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
