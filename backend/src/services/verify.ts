/**
 * Tap verification.
 *
 * Order matters here. The cryptographic proof runs first and is decisive: if
 * the SUN payload does not validate, nothing else is consulted. The on-chain
 * lookup runs second and is reported separately — if it fails, the part is
 * still authentic (the chip proved it), and the screen says the public record
 * could not be read right now rather than hiding it.
 */
import { query } from "../db/client";
import { decryptKey } from "../crypto/keys";
import { verifySun, deriveTagKeys } from "../crypto/sun";

export type VerificationResult = "authentic" | "unverified" | "alert";
export type ChainStatus = "confirmed" | "unavailable" | "mismatch";

export interface VerificationResponse {
  result: VerificationResult;
  chainStatus: ChainStatus | null;
  part: {
    model: string;
    description: string | null;
    batch: string;
    provisionedAt: string;
    manufacturerName: string;
    manufacturerVerified: boolean;
    assetId: string | null;
    mintSignature: string | null;
  } | null;
  /** True when this is the first successful verification of this tag. */
  firstVerification: boolean;
  verificationCount: number;
  /** Present only when result is "alert". */
  alertReason?: string;
}

interface PartRow {
  id: string;
  chip_uid: string;
  sdm_key_encrypted: Buffer;
  asset_id: string | null;
  mint_signature: string | null;
  batch: string;
  status: string;
  last_counter: string;
  provisioned_at: Date;
  model: string;
  description: string | null;
  manufacturer_name: string;
  manufacturer_verified: boolean;
  manufacturer_wallet: string;
}

const UNVERIFIED: VerificationResponse = {
  result: "unverified",
  chainStatus: null,
  part: null,
  firstVerification: false,
  verificationCount: 0,
};

/** Logs every attempt, including ones with an unknown UID — an unrecognised
 * tag being probed is itself a signal worth keeping. */
async function logAttempt(
  partId: string | null,
  chipUid: string,
  result: VerificationResult,
  counter: number | null,
  geo?: { country?: string; region?: string }
): Promise<void> {
  await query(
    `INSERT INTO verifications
       (part_id, chip_uid, result, counter_value, geo_country, geo_region)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      partId,
      chipUid,
      result,
      counter,
      geo?.country ?? null,
      geo?.region ?? null,
    ]
  );
}

export interface VerifyTapInput {
  piccData: string;
  cmac: string;
  geo?: { country?: string; region?: string };
  /** Injected so the caller decides how the chain is read (and tests can stub it). */
  readChain?: (assetId: string, expectedOwner: string) => Promise<ChainStatus>;
}

export async function verifyTap(
  input: VerifyTapInput
): Promise<VerificationResponse> {
  // The UID is inside the encrypted payload, so the candidate tag cannot be
  // looked up before decryption. Every stored key is tried against the
  // payload; at pilot scale this is fine, and phase 4 adds a UID hint column
  // if the table grows.
  const rows = await query<PartRow>(
    `SELECT p.id, p.chip_uid, p.sdm_key_encrypted, p.asset_id,
            p.mint_signature, p.batch,
            p.status, p.last_counter::text AS last_counter, p.provisioned_at,
            pr.model, pr.description,
            m.name AS manufacturer_name,
            m.verified_onchain AS manufacturer_verified,
            m.wallet_pubkey AS manufacturer_wallet
       FROM parts p
       JOIN products pr ON pr.id = p.product_id
       JOIN manufacturers m ON m.id = pr.manufacturer_id
      WHERE p.status <> 'retired'`
  );

  let matched: PartRow | null = null;
  let counter = 0;

  for (const row of rows) {
    try {
      const master = decryptKey(row.sdm_key_encrypted);
      const keys = deriveTagKeys(master);
      const decoded = verifySun(
        input.piccData,
        input.cmac,
        keys.metaReadKey,
        keys.macKey
      );
      if (decoded.uid === row.chip_uid) {
        matched = row;
        counter = decoded.counter;
        break;
      }
    } catch {
      // Wrong key for this payload: keep looking.
      continue;
    }
  }

  if (!matched) {
    await logAttempt(null, "unknown", "unverified", null);
    return UNVERIFIED;
  }

  // Replay protection. A captured URL replayed later carries a counter that no
  // longer exceeds the stored one, so it fails here even though its CMAC is
  // perfectly valid.
  const lastCounter = Number(matched.last_counter);
  if (counter <= lastCounter) {
    await logAttempt(matched.id, matched.chip_uid, "alert", counter);
    return {
      result: "alert",
      chainStatus: null,
      part: null,
      firstVerification: false,
      verificationCount: 0,
      alertReason:
        "This tap repeats a code already used. It may be a replayed or copied scan.",
    };
  }

  await query(`UPDATE parts SET last_counter = $2 WHERE id = $1`, [
    matched.id,
    counter,
  ]);

  // Chain lookup is reported, never decisive.
  let chainStatus: ChainStatus = "unavailable";
  if (matched.asset_id && input.readChain) {
    try {
      chainStatus = await input.readChain(
        matched.asset_id,
        matched.manufacturer_wallet
      );
    } catch {
      chainStatus = "unavailable";
    }
  }

  const [counts] = await query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM verifications
      WHERE part_id = $1 AND result = 'authentic'`,
    [matched.id]
  );
  const previousCount = Number(counts?.total ?? 0);

  const result: VerificationResult =
    matched.status === "flagged" ? "alert" : "authentic";

  await logAttempt(
    matched.id,
    matched.chip_uid,
    result,
    counter,
    input.geo
  );

  return {
    result,
    chainStatus,
    part: {
      model: matched.model,
      description: matched.description,
      batch: matched.batch,
      provisionedAt: matched.provisioned_at.toISOString(),
      manufacturerName: matched.manufacturer_name,
      manufacturerVerified: matched.manufacturer_verified,
      assetId: matched.asset_id,
      mintSignature: matched.mint_signature,
    },
    firstVerification: previousCount === 0,
    verificationCount: previousCount + 1,
    ...(result === "alert"
      ? {
          alertReason:
            "This part was reported by the manufacturer. Contact them before use.",
        }
      : {}),
  };
}
