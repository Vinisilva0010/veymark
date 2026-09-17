/**
 * Generates a valid tap URL for a provisioned part, the way a physical tag
 * would on being touched.
 *
 * Usage:
 *   npx ts-node scripts/simulate-tap.ts <chip_uid> [counter]
 *
 * Omitting the counter uses last_counter + 1, which is what a real tag does.
 * Passing an old counter on purpose is how the replay rejection is
 * demonstrated.
 */
import "dotenv/config";
import { query, closePool } from "../backend/src/db/client";
import { decryptKey } from "../backend/src/crypto/keys";
import { generateSun, deriveTagKeys } from "../backend/src/crypto/sun";

async function main() {
  const chipUid = process.argv[2];
  const explicitCounter = process.argv[3]
    ? Number(process.argv[3])
    : undefined;

  if (!chipUid) {
    console.error("Usage: simulate-tap.ts <chip_uid> [counter]");
    process.exit(1);
  }

  const rows = await query<{
    sdm_key_encrypted: Buffer;
    last_counter: string;
  }>(
    `SELECT sdm_key_encrypted, last_counter::text AS last_counter
       FROM parts WHERE chip_uid = $1`,
    [chipUid.toUpperCase()]
  );

  if (rows.length === 0) {
    console.error(`No provisioned part with chip UID ${chipUid}`);
    await closePool();
    process.exit(1);
  }

  const counter = explicitCounter ?? Number(rows[0].last_counter) + 1;
  const keys = deriveTagKeys(decryptKey(rows[0].sdm_key_encrypted));
  const payload = generateSun(
    chipUid.toUpperCase(),
    counter,
    keys.metaReadKey,
    keys.macKey
  );

  const base = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";
  const url = `${base}/api/verify?picc_data=${payload.piccData}&cmac=${payload.cmac}`;

  console.log("\nCounter:", counter);
  console.log("Tap URL:\n" + url + "\n");

  await closePool();
}

main().catch(async (err) => {
  console.error(err);
  await closePool();
  process.exit(1);
});
