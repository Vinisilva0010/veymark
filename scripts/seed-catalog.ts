/**
 * Creates a demo manufacturer, a panel user and sample products.
 *
 * The password is generated and printed once — it is never stored in code
 * or in the repository.
 */
import "dotenv/config";
import { randomBytes } from "crypto";
import { pool, query } from "../backend/src/db/client";
import { hashPassword } from "../backend/src/services/auth";

async function main() {
  const walletPubkey =
    process.env.DEMO_MANUFACTURER_WALLET ??
    "7aSDp11gPbCCew7yMSQKuBLr6pcKfgwRPtp2QgAE89f3";

  const [manufacturer] = await query<{ id: string }>(
    `INSERT INTO manufacturers (name, wallet_pubkey)
     VALUES ($1, $2)
     ON CONFLICT (wallet_pubkey) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    ["Demo Auto Parts", walletPubkey]
  );

  const password = randomBytes(12).toString("base64url");
  const email = "operator@demo.veymark.xyz";

  await query(
    `INSERT INTO manufacturer_users
       (manufacturer_id, email, password_hash, display_name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [manufacturer.id, email, await hashPassword(password), "Demo Operator"]
  );

  const products = [
    ["Shock Absorber XR-40", "Front suspension shock absorber", "Suspension"],
    ["Wheel Bearing RM-12", "Front wheel bearing assembly", "Bearings"],
    ["Headlight Bulb H7", "H7 halogen headlight bulb", "Lighting"],
  ];

  for (const [model, description, category] of products) {
    await query(
      `INSERT INTO products (manufacturer_id, model, description, category)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (manufacturer_id, model) DO NOTHING`,
      [manufacturer.id, model, description, category]
    );
  }

  console.log("\n--- Seed complete ---");
  console.log("Manufacturer:", manufacturer.id);
  console.log("Login email: ", email);
  console.log("Password:    ", password);
  console.log("\nSave the password now — it is not stored anywhere.\n");

  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
