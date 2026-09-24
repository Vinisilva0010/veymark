/**
 * Public test bench.
 *
 * Lets someone without a physical tag exercise real verification: taps are
 * generated server-side with the same AES-128 SUN scheme a chip uses, then
 * checked by the live verification endpoint.
 *
 * Generating valid taps is only safe because it is restricted to parts flagged
 * is_demo. Without that filter this endpoint would mint authentic taps for any
 * real product — the attack the whole system exists to prevent. The filter is
 * in the query itself, not in a check after it, so there is no code path that
 * loads a production part's key.
 */
import { randomBytes } from "crypto";
import { query } from "../db/client";
import { decryptKey } from "../crypto/keys";
import { generateSun, deriveTagKeys } from "../crypto/sun";

export interface DemoPart {
  chipUid: string;
  model: string;
  batch: string;
  manufacturerName: string;
}

export async function listDemoParts(): Promise<DemoPart[]> {
  const rows = await query<{
    chip_uid: string;
    model: string;
    batch: string;
    manufacturer_name: string;
  }>(
    `SELECT p.chip_uid, pr.model, p.batch, m.name AS manufacturer_name
       FROM parts p
       JOIN products pr ON pr.id = p.product_id
       JOIN manufacturers m ON m.id = pr.manufacturer_id
      WHERE p.is_demo = TRUE
      ORDER BY p.chip_uid`
  );

  return rows.map((r) => ({
    chipUid: r.chip_uid,
    model: r.model,
    batch: r.batch,
    manufacturerName: r.manufacturer_name,
  }));
}

export type TapMode = "genuine" | "forged";

export interface DemoTap {
  piccData: string;
  cmac: string;
  counter: number;
  mode: TapMode;
}

export async function generateDemoTap(
  chipUid: string,
  mode: TapMode
): Promise<DemoTap> {
  const rows = await query<{
    sdm_key_encrypted: Buffer;
    last_counter: string;
  }>(
    `SELECT sdm_key_encrypted, last_counter::text AS last_counter
       FROM parts
      WHERE chip_uid = $1 AND is_demo = TRUE`,
    [chipUid.toUpperCase()]
  );

  if (rows.length === 0) {
    throw new Error("Not a demo part");
  }

  const counter = Number(rows[0].last_counter) + 1;

  if (mode === "forged") {
    // An attacker can read the UID printed on the part, but never the key
    // inside the chip. So they build the payload with a key of their own.
    // The backend cannot decrypt it and the tap comes back unverified.
    const attackerKey = randomBytes(16);
    const payload = generateSun(chipUid, counter, attackerKey, attackerKey);
    return { ...payload, counter, mode };
  }

  const keys = deriveTagKeys(decryptKey(rows[0].sdm_key_encrypted));
  const payload = generateSun(chipUid, counter, keys.metaReadKey, keys.macKey);
  return { ...payload, counter, mode };
}

/**
 * Live provisioning for the demo page.
 *
 * A visitor can watch a part being registered and its passport minted on
 * Solana for real. Three things keep that safe:
 *
 *   1. It mints into a separate Merkle tree. A tree's capacity is fixed when
 *      it is created, so filling the production tree would permanently break
 *      real provisioning.
 *   2. Per-visitor and global daily caps. The global cap is the one that
 *      holds even if someone rotates addresses.
 *   3. Parts created here are flagged is_demo, so they can never be confused
 *      with production stock and can be cleaned up.
 */
import { randomBytes as randomBytesForDemo } from "crypto";
import { encryptKey } from "../crypto/keys";
import { mintPassport } from "./minting";

export const DEMO_LIMIT_PER_VISITOR = 3;
export const DEMO_LIMIT_PER_DAY = 200;

export interface DemoProvisionResult {
  chipUid: string;
  model: string;
  batch: string;
  manufacturerName: string;
  /** Shown once, the way the factory station would hand it to the writer. */
  tagKeyHex: string;
  assetId: string | null;
  mintSignature: string | null;
  mintStatus: "minted" | "pending";
}

export class DemoLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DemoLimitError";
  }
}

async function assertWithinLimits(visitorKey: string): Promise<void> {
  const [perVisitor] = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
       FROM demo_mints
      WHERE visitor_key = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
    [visitorKey]
  );

  if (Number(perVisitor?.count ?? 0) >= DEMO_LIMIT_PER_VISITOR) {
    throw new DemoLimitError(
      "You have registered the maximum number of demo parts for now. Try again in an hour."
    );
  }

  const [perDay] = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
       FROM demo_mints
      WHERE created_at > NOW() - INTERVAL '1 day'`
  );

  if (Number(perDay?.count ?? 0) >= DEMO_LIMIT_PER_DAY) {
    throw new DemoLimitError(
      "The demo has hit today's limit on new registrations. Verification below still works."
    );
  }
}

export async function provisionDemoPart(
  visitorKey: string,
  productId: string,
  batch: string
): Promise<DemoProvisionResult> {
  await assertWithinLimits(visitorKey);

  const cleanBatch = batch.trim().slice(0, 24) || "DEMO";

  const [product] = await query<{
    id: string;
    model: string;
    manufacturer_name: string;
  }>(
    `SELECT pr.id, pr.model, m.name AS manufacturer_name
       FROM products pr
       JOIN manufacturers m ON m.id = pr.manufacturer_id
      WHERE pr.id = $1`,
    [productId]
  );

  if (!product) throw new Error("Unknown product");

  // A fresh UID per run, so every visitor registers their own part rather
  // than colliding with someone else's.
  const chipUid = (
    "04" +
    randomBytesForDemo(6).toString("hex").toUpperCase()
  ).slice(0, 14);

  const tagMasterKey = randomBytesForDemo(16);

  const [part] = await query<{ id: string }>(
    `INSERT INTO parts
       (product_id, chip_uid, sdm_key_encrypted, batch,
        provisioned_by, mint_status, is_demo)
     VALUES ($1, $2, $3, $4, 'demo-visitor', 'pending', TRUE)
     RETURNING id`,
    [product.id, chipUid, encryptKey(tagMasterKey), cleanBatch]
  );

  await query(
    `INSERT INTO demo_mints (visitor_key, part_id) VALUES ($1, $2)`,
    [visitorKey, part.id]
  );

  try {
    const { assetId, signature } = await mintPassport(
      {
        model: product.model,
        batch: cleanBatch,
        manufacturerName: product.manufacturer_name,
        chipUid,
      },
      "demo"
    );

    await query(
      `UPDATE parts
          SET asset_id = $2, mint_signature = $3, mint_status = 'minted',
              mint_attempts = mint_attempts + 1, mint_last_attempt_at = NOW()
        WHERE id = $1`,
      [part.id, assetId, signature]
    );

    return {
      chipUid,
      model: product.model,
      batch: cleanBatch,
      manufacturerName: product.manufacturer_name,
      tagKeyHex: tagMasterKey.toString("hex"),
      assetId,
      mintSignature: signature,
      mintStatus: "minted",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await query(
      `UPDATE parts
          SET mint_attempts = mint_attempts + 1,
              mint_last_attempt_at = NOW(), mint_last_error = $2
        WHERE id = $1`,
      [part.id, message.slice(0, 500)]
    );

    // The part is already verifiable by chip; only the public record is
    // missing. The demo shows exactly this case as a step of its own.
    return {
      chipUid,
      model: product.model,
      batch: cleanBatch,
      manufacturerName: product.manufacturer_name,
      tagKeyHex: tagMasterKey.toString("hex"),
      assetId: null,
      mintSignature: null,
      mintStatus: "pending",
    };
  }
}
