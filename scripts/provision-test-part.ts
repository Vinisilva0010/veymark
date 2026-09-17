/**
 * Provisions one part for local testing: generates a tag master key, encrypts
 * it and stores the record. No on-chain mint yet — that is phase 4.
 */
import "dotenv/config";
import { randomBytes } from "crypto";
import { query, closePool } from "../backend/src/db/client";
import { encryptKey } from "../backend/src/crypto/keys";

async function main() {
  const chipUid = (process.argv[2] ?? "04AABBCCDDEE80").toUpperCase();
  const batch = process.argv[3] ?? "TEST-4521";

  const products = await query<{ id: string; model: string }>(
    `SELECT id, model FROM products ORDER BY created_at LIMIT 1`
  );

  if (products.length === 0) {
    console.error("No products found. Run seed-catalog.ts first.");
    await closePool();
    process.exit(1);
  }

  const users = await query<{ id: string }>(
    `SELECT id FROM manufacturer_users LIMIT 1`
  );

  const tagMasterKey = randomBytes(16);

  await query(
    `INSERT INTO parts
       (product_id, chip_uid, sdm_key_encrypted, batch,
        provisioned_by, provisioned_by_user_id, asset_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (chip_uid) DO UPDATE
       SET sdm_key_encrypted = EXCLUDED.sdm_key_encrypted,
           last_counter = 0`,
    [
      products[0].id,
      chipUid,
      encryptKey(tagMasterKey),
      batch,
      "provision-test-script",
      users[0]?.id ?? null,
      process.env.TEST_ASSET_ID ?? null,
    ]
  );

  console.log("\n--- Part provisioned ---");
  console.log("Product: ", products[0].model);
  console.log("Chip UID:", chipUid);
  console.log("Batch:   ", batch);
  console.log("\nSimulate a tap with:");
  console.log(`  npx ts-node scripts/simulate-tap.ts ${chipUid}\n`);

  await closePool();
}

main().catch(async (err) => {
  console.error(err);
  await closePool();
  process.exit(1);
});
