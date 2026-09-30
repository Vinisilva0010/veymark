/**
 * Assembly declarations in the catalogue, against the local database.
 *
 * Declaring contents is an office task done once per product, not a decision
 * made on the line. These cases cover the two refusals that protect parts
 * already in the world: an assembly setting cannot change once tags exist,
 * and a slot cannot be removed while real parts are recorded in it.
 */
import { randomBytes } from "crypto";
import { query, closePool } from "../src/db/client";
import { encryptKey } from "../src/crypto/keys";
import {
  listComponentSlots,
  setAssembly,
  declareComponentSlot,
  removeComponentSlot,
} from "../src/services/catalog";

let failures = 0;
function check(label: string, passed: boolean) {
  console.log(`${passed ? "PASS" : "FAIL"}  ${label}`);
  if (!passed) failures++;
}

async function expectRejection(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    check(label, false);
  } catch {
    check(label, true);
  }
}

const suffix = randomBytes(3).toString("hex").toUpperCase();

async function newProduct(
  manufacturerId: string,
  name: string
): Promise<string> {
  const [row] = await query<{ id: string }>(
    `INSERT INTO products (manufacturer_id, model, category)
     VALUES ($1, $2, 'Test') RETURNING id`,
    [manufacturerId, `${name} CAT-${suffix}`]
  );
  return row.id;
}

async function main() {
  const [manufacturer] = await query<{ id: string }>(
    `SELECT id FROM manufacturers ORDER BY created_at LIMIT 1`
  );
  if (!manufacturer) throw new Error("Run seed-catalog.ts first");

  const caseProduct = await newProduct(manufacturer.id, "Case");
  const partProduct = await newProduct(manufacturer.id, "Insert");

  // A plain product holds nothing: declaring a slot on it would produce a
  // contents list nobody ever fills.
  await expectRejection("a plain product cannot declare slots", () =>
    declareComponentSlot(caseProduct, manufacturer.id, "insert", partProduct)
  );

  await setAssembly(caseProduct, manufacturer.id, true);

  const slot = await declareComponentSlot(
    caseProduct,
    manufacturer.id,
    "insert",
    partProduct
  );
  check("slot declared with its product", slot.component_product_id === partProduct);

  const slots = await listComponentSlots(caseProduct, manufacturer.id);
  check("slot is listed", slots.length === 1);
  check("listed slot names the product", slots[0].component_model !== null);

  await expectRejection("the same role cannot be declared twice", () =>
    declareComponentSlot(caseProduct, manufacturer.id, "insert", partProduct)
  );

  await expectRejection("a product cannot be its own component", () =>
    declareComponentSlot(caseProduct, manufacturer.id, "itself", caseProduct)
  );

  // Another manufacturer's product is invisible here, so it cannot be named
  // as the approved part for this case.
  const [other] = await query<{ id: string }>(
    `INSERT INTO manufacturers (name, wallet_pubkey)
     VALUES ($1, $2) RETURNING id`,
    [`Other CAT-${suffix}`, `wallet-${suffix}`]
  );
  const foreignProduct = await newProduct(other.id, "Foreign");

  await expectRejection("a foreign product cannot fill a slot", () =>
    declareComponentSlot(caseProduct, manufacturer.id, "foreign", foreignProduct)
  );

  await expectRejection("a foreign caller cannot declare slots", () =>
    declareComponentSlot(caseProduct, other.id, "sneaky", partProduct)
  );

  // An unused slot comes off cleanly.
  const spare = await declareComponentSlot(
    caseProduct,
    manufacturer.id,
    "spare",
    partProduct
  );
  check(
    "an unused slot can be removed",
    await removeComponentSlot(spare.id, caseProduct, manufacturer.id)
  );

  // Now the protections that matter: a real part in the role, and real tags
  // written for the product.
  const [assemblyPart] = await query<{ id: string }>(
    `INSERT INTO parts (product_id, chip_uid, sdm_key_encrypted, batch,
                        provisioned_by)
     VALUES ($1, $2, $3, 'CAT-TEST', 'catalog-test') RETURNING id`,
    [
      caseProduct,
      ("04" + randomBytes(6).toString("hex").toUpperCase()).slice(0, 14),
      encryptKey(randomBytes(16)),
    ]
  );

  await query(
    `INSERT INTO parts (product_id, chip_uid, sdm_key_encrypted, batch,
                        provisioned_by, parent_part_id, component_role)
     VALUES ($1, $2, $3, 'CAT-TEST', 'catalog-test', $4, 'insert')`,
    [
      partProduct,
      ("04" + randomBytes(6).toString("hex").toUpperCase()).slice(0, 14),
      encryptKey(randomBytes(16)),
      assemblyPart.id,
    ]
  );

  await expectRejection("a slot in use cannot be removed", () =>
    removeComponentSlot(slot.id, caseProduct, manufacturer.id)
  );

  await expectRejection("assembly cannot be turned off once tags exist", () =>
    setAssembly(caseProduct, manufacturer.id, false)
  );

  const stillThere = await listComponentSlots(caseProduct, manufacturer.id);
  check("the refused removal left the slot in place", stillThere.length === 1);

  await query(`DELETE FROM parts WHERE provisioned_by = 'catalog-test'`);
  // Slot declarations reference the component product with ON DELETE
  // RESTRICT, so they come off before the products they point at.
  await query(
    `DELETE FROM product_components
      WHERE product_id IN (SELECT id FROM products WHERE model LIKE $1)`,
    [`%CAT-${suffix}`]
  );
  await query(`DELETE FROM products WHERE model LIKE $1`, [`%CAT-${suffix}`]);
  await query(`DELETE FROM manufacturers WHERE name = $1`, [
    `Other CAT-${suffix}`,
  ]);

  console.log(
    failures === 0 ? "\nAll catalog assembly tests passed" : `\n${failures} failed`
  );
  await closePool();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (err) => {
  console.error(err);
  await closePool();
  process.exit(1);
});
