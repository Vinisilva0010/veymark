/**
 * Provisions the parts the public test bench is allowed to generate taps for.
 *
 * Each one goes through the real provisioning flow — encrypted tag key,
 * passport minted on devnet, mint signature stored — and is then flagged
 * is_demo. Safe to re-run: parts that already exist are skipped.
 *
 * Run against production with:
 *   DATABASE_URL="<neon url>" npx ts-node scripts/seed-demo-parts.ts
 */
import "dotenv/config";
import { query, closePool } from "../backend/src/db/client";
import { provisionPart } from "../backend/src/services/provisioning";

const DEMO_UIDS = ["04DE0000000001", "04DE0000000002", "04DE0000000003"];

async function main() {
  const products = await query<{ id: string; model: string; manufacturer_id: string }>(
    `SELECT id, model, manufacturer_id FROM products ORDER BY created_at LIMIT 3`
  );
  const [user] = await query<{ id: string; email: string }>(
    `SELECT id, email FROM manufacturer_users LIMIT 1`
  );

  if (products.length === 0 || !user) {
    throw new Error("Run seed-catalog.ts against this database first.");
  }

  for (let i = 0; i < DEMO_UIDS.length; i++) {
    const chipUid = DEMO_UIDS[i];
    const product = products[i % products.length];

    const existing = await query(`SELECT 1 FROM parts WHERE chip_uid = $1`, [chipUid]);
    if (existing.length > 0) {
      await query(`UPDATE parts SET is_demo = TRUE WHERE chip_uid = $1`, [chipUid]);
      console.log(`skip   ${chipUid} (already provisioned, ensured is_demo)`);
      continue;
    }

    const result = await provisionPart({
      productId: product.id,
      manufacturerId: product.manufacturer_id,
      chipUid,
      batch: `DEMO-${i + 1}`,
      operatorUserId: user.id,
      operatorLabel: "demo-seed",
    });

    await query(`UPDATE parts SET is_demo = TRUE WHERE id = $1`, [result.partId]);
    console.log(`ok     ${chipUid}  ${product.model}  mint=${result.mintStatus}`);
  }

  await closePool();
}

main().catch(async (err) => {
  console.error(err);
  await closePool();
  process.exit(1);
});
