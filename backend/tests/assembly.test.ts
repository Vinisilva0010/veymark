/**
 * Assembly behaviour, end to end against the local database.
 *
 * Creates a sealed-case product with two declared components, provisions the
 * assembly and its internals, then checks the state the verification endpoint
 * would return. Also asserts the refusals: a part inside itself, a component
 * taken twice, and an undeclared role.
 */
import { randomBytes } from "crypto";
import { query, closePool } from "../src/db/client";
import { encryptKey } from "../src/crypto/keys";
import { getAssemblyState, attachComponent } from "../src/services/assembly";

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

async function provision(
  productId: string,
  batch: string
): Promise<string> {
  const uid = ("04" + randomBytes(6).toString("hex").toUpperCase()).slice(0, 14);
  const [row] = await query<{ id: string }>(
    `INSERT INTO parts
       (product_id, chip_uid, sdm_key_encrypted, batch, provisioned_by,
        seal_position)
     VALUES ($1, $2, $3, $4, 'assembly-test', 'across_opening')
     RETURNING id`,
    [productId, uid, encryptKey(randomBytes(16)), batch]
  );
  return row.id;
}

async function main() {
  const [manufacturer] = await query<{ id: string }>(
    `SELECT id FROM manufacturers ORDER BY created_at LIMIT 1`
  );
  if (!manufacturer) throw new Error("Run seed-catalog.ts first");

  const suffix = randomBytes(3).toString("hex");

  const [battery] = await query<{ id: string }>(
    `INSERT INTO products (manufacturer_id, model, category, is_assembly)
     VALUES ($1, $2, 'Electrical', TRUE)
     RETURNING id`,
    [manufacturer.id, `Battery TEST-${suffix}`]
  );

  const [cell] = await query<{ id: string }>(
    `INSERT INTO products (manufacturer_id, model, category)
     VALUES ($1, $2, 'Electrical') RETURNING id`,
    [manufacturer.id, `Cell stack TEST-${suffix}`]
  );

  const [bms] = await query<{ id: string }>(
    `INSERT INTO products (manufacturer_id, model, category)
     VALUES ($1, $2, 'Electronics') RETURNING id`,
    [manufacturer.id, `BMS board TEST-${suffix}`]
  );

  await query(
    `INSERT INTO product_components (product_id, role)
     VALUES ($1, 'cell stack'), ($1, 'management board')`,
    [battery.id]
  );

  const assemblyPart = await provision(battery.id, "ASM-1");
  const cellPart = await provision(cell.id, "ASM-1");
  const bmsPart = await provision(bms.id, "ASM-1");

  // Empty assembly: both slots declared, neither filled.
  let state = await getAssemblyState(assemblyPart);
  check("recognised as an assembly", state.isAssembly);
  check("seal recorded across the opening", state.sealPosition === "across_opening");
  check("two slots declared", state.slots.length === 2);
  check("nothing filled yet", state.slots.every((s) => !s.filled));
  check("not complete while empty", !state.complete);

  await attachComponent(assemblyPart, cellPart, "cell stack", manufacturer.id);
  state = await getAssemblyState(assemblyPart);
  check("one slot filled", state.slots.filter((s) => s.filled).length === 1);
  check("still incomplete with one missing", !state.complete);

  await attachComponent(
    assemblyPart,
    bmsPart,
    "management board",
    manufacturer.id
  );
  state = await getAssemblyState(assemblyPart);
  check("complete once both are in", state.complete);
  check(
    "each slot names its component",
    state.slots.every((s) => s.model !== null && s.chipUid !== null)
  );

  // Refusals.
  const spare = await provision(cell.id, "ASM-2");

  await expectRejection("a part cannot contain itself", () =>
    attachComponent(assemblyPart, assemblyPart, "cell stack", manufacturer.id)
  );

  await expectRejection("a filled role cannot be filled twice", () =>
    attachComponent(assemblyPart, spare, "cell stack", manufacturer.id)
  );

  await expectRejection("an undeclared role is refused", () =>
    attachComponent(assemblyPart, spare, "cooling fan", manufacturer.id)
  );

  await expectRejection("a component cannot be in two assemblies", () =>
    attachComponent(assemblyPart, cellPart, "management board", manufacturer.id)
  );

  // A plain part reports as not an assembly.
  const plainState = await getAssemblyState(cellPart);
  check("a component is not itself an assembly", !plainState.isAssembly);

  // Clean up so repeated runs do not pile up test rows.
  await query(`DELETE FROM parts WHERE provisioned_by = 'assembly-test'`);
  await query(`DELETE FROM products WHERE model LIKE $1`, [`%TEST-${suffix}`]);

  console.log(
    failures === 0 ? "\nAll assembly tests passed" : `\n${failures} test(s) failed`
  );
  await closePool();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (err) => {
  console.error(err);
  await closePool();
  process.exit(1);
});
