/**
 * Part provisioning.
 *
 * Order is deliberate: the database row is written first with a null asset_id,
 * then the passport is minted, then the asset id is filled in.
 *
 * The reason is physical. On a production line the tag is applied to the part
 * at the moment it is written, so a failure that leaves nothing in the
 * database would put a tag in the world the system does not recognise — that
 * genuine part would verify as "could not verify" forever. A row marked
 * 'pending' is recoverable; a missing row is not.
 *
 * A pending part is already verifiable by chip. Only the public record is
 * missing, and the retry job fills it in.
 */
import { randomBytes } from "crypto";
import { query } from "../db/client";
import { encryptKey } from "../crypto/keys";
import { mintPassport } from "./minting";

export interface ProvisionInput {
  productId: string;
  manufacturerId: string;
  chipUid: string;
  batch: string;
  operatorUserId: string;
  operatorLabel: string;
}

export interface ProvisionResult {
  partId: string;
  chipUid: string;
  tagMasterKeyHex: string;
  assetId: string | null;
  mintStatus: "pending" | "minted";
  /** Set when the row was written but the mint did not complete. */
  mintError?: string;
}

const UID_PATTERN = /^[0-9A-F]{14}$/;

export async function provisionPart(
  input: ProvisionInput
): Promise<ProvisionResult> {
  const chipUid = input.chipUid.trim().toUpperCase();

  if (!UID_PATTERN.test(chipUid)) {
    throw new Error("Chip UID must be 14 hex characters (7 bytes)");
  }

  const batch = input.batch.trim();
  if (!batch) throw new Error("Batch is required");

  // Confirm the product belongs to this manufacturer before writing anything.
  // Without this check an operator could provision parts against another
  // manufacturer's product by passing its id.
  const products = await query<{ model: string; manufacturer_name: string }>(
    `SELECT pr.model, m.name AS manufacturer_name
       FROM products pr
       JOIN manufacturers m ON m.id = pr.manufacturer_id
      WHERE pr.id = $1 AND pr.manufacturer_id = $2`,
    [input.productId, input.manufacturerId]
  );

  if (products.length === 0) {
    throw new Error("Product not found");
  }

  const tagMasterKey = randomBytes(16);

  // Step 1: the row. If this fails, nothing physical has happened yet.
  let partId: string;
  try {
    const rows = await query<{ id: string }>(
      `INSERT INTO parts
         (product_id, chip_uid, sdm_key_encrypted, batch,
          provisioned_by, provisioned_by_user_id, mint_status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING id`,
      [
        input.productId,
        chipUid,
        encryptKey(tagMasterKey),
        batch,
        input.operatorLabel,
        input.operatorUserId,
      ]
    );
    partId = rows[0].id;
  } catch (err) {
    if (typeof err === "object" && err !== null && "code" in err) {
      if ((err as { code: string }).code === "23505") {
        throw new Error("This chip UID is already provisioned");
      }
    }
    throw new Error("Could not register part");
  }

  // Step 2: the passport. A failure here is recorded, not fatal — the caller
  // still gets the key so the tag can be written, and the retry job will
  // finish the job.
  try {
    const assetId = await mintPassport({
      model: products[0].model,
      batch,
      manufacturerName: products[0].manufacturer_name,
      chipUid,
    });

    await query(
      `UPDATE parts
          SET asset_id = $2,
              mint_status = 'minted',
              mint_attempts = mint_attempts + 1,
              mint_last_attempt_at = NOW(),
              mint_last_error = NULL
        WHERE id = $1`,
      [partId, assetId]
    );

    return {
      partId,
      chipUid,
      tagMasterKeyHex: tagMasterKey.toString("hex"),
      assetId,
      mintStatus: "minted",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    await query(
      `UPDATE parts
          SET mint_attempts = mint_attempts + 1,
              mint_last_attempt_at = NOW(),
              mint_last_error = $2
        WHERE id = $1`,
      [partId, message.slice(0, 500)]
    );

    return {
      partId,
      chipUid,
      tagMasterKeyHex: tagMasterKey.toString("hex"),
      assetId: null,
      mintStatus: "pending",
      mintError: "Passport minting is pending. The part is already verifiable.",
    };
  }
}

/** Parts whose passport is still missing, oldest attempt first. */
export async function listPendingMints(limit = 20) {
  return query<{
    id: string;
    chip_uid: string;
    batch: string;
    model: string;
    manufacturer_name: string;
    mint_attempts: number;
    mint_last_error: string | null;
  }>(
    `SELECT p.id, p.chip_uid, p.batch, pr.model,
            m.name AS manufacturer_name,
            p.mint_attempts, p.mint_last_error
       FROM parts p
       JOIN products pr ON pr.id = p.product_id
       JOIN manufacturers m ON m.id = pr.manufacturer_id
      WHERE p.mint_status <> 'minted'
      ORDER BY p.mint_last_attempt_at NULLS FIRST
      LIMIT $1`,
    [limit]
  );
}

/** Retries one pending mint. Used by the retry job and the panel. */
export async function retryMint(partId: string): Promise<string | null> {
  const rows = await query<{
    chip_uid: string;
    batch: string;
    model: string;
    manufacturer_name: string;
  }>(
    `SELECT p.chip_uid, p.batch, pr.model, m.name AS manufacturer_name
       FROM parts p
       JOIN products pr ON pr.id = p.product_id
       JOIN manufacturers m ON m.id = pr.manufacturer_id
      WHERE p.id = $1 AND p.mint_status <> 'minted'`,
    [partId]
  );

  if (rows.length === 0) return null;

  try {
    const assetId = await mintPassport({
      model: rows[0].model,
      batch: rows[0].batch,
      manufacturerName: rows[0].manufacturer_name,
      chipUid: rows[0].chip_uid,
    });

    await query(
      `UPDATE parts
          SET asset_id = $2, mint_status = 'minted',
              mint_attempts = mint_attempts + 1,
              mint_last_attempt_at = NOW(), mint_last_error = NULL
        WHERE id = $1`,
      [partId, assetId]
    );

    return assetId;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await query(
      `UPDATE parts
          SET mint_attempts = mint_attempts + 1,
              mint_last_attempt_at = NOW(), mint_last_error = $2
        WHERE id = $1`,
      [partId, message.slice(0, 500)]
    );
    return null;
  }
}
