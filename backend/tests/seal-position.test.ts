/**
 * Seal position validation, end to end against the local database.
 *
 * The seal position is not cosmetic: verification reports it to the buyer, so
 * a tag recorded as "surface" tells the buyer a torn antenna proves nothing.
 * If provisionPart ever coerces an unrecognised value instead of refusing it,
 * a frontend bug would silently record "surface" on a part the operator
 * sealed across the opening, and the system would mislead the buyer.
 *
 * These cases exist to fail loudly if that fail-safe is ever removed.
 */
import { randomBytes } from "crypto";
import { query, closePool } from "../src/db/client";
import { provisionPart } from "../src/services/provisioning";

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

function uid(): string {
  return ("04" + randomBytes(6).toString("hex").toUpperCase()).slice(0, 14);
}

const BATCH = "SEAL-TEST-" + randomBytes(3).toString("hex").toUpperCase();

async function main() {
  const [product] = await query<{ id: string; manufacturer_id: string }>(
    `SELECT id, manufacturer_id FROM products ORDER BY created_at LIMIT 1`
  );

  if (!product) {
    console.error("No products found. Run seed-catalog.ts first.");
    await closePool();
    process.exit(1);
  }

  const [operator] = await query<{ id: string }>(
    `SELECT id FROM manufacturer_users LIMIT 1`
  );

  const base = {
    productId: product.id,
    manufacturerId: product.manufacturer_id,
    batch: BATCH,
    operatorUserId: operator?.id ?? null,
    operatorLabel: "seal-position-test",
  } as const;

  // An unrecognised value must be refused. This is the whole point of the
  // file: coercion here would put a false "surface" on a sealed part.
  await expectRejection("unknown seal position is refused", () =>
    provisionPart({
      ...base,
      chipUid: uid(),
      sealPosition: "glued_on_top" as never,
    } as never)
  );

  // Empty string and null are refused too: both are plausible outputs of an
  // uninitialised form field, and neither means "surface".
  await expectRejection("empty seal position is refused", () =>
    provisionPart({ ...base, chipUid: uid(), sealPosition: "" as never } as never)
  );

  await expectRejection("null seal position is refused", () =>
    provisionPart({
      ...base,
      chipUid: uid(),
      sealPosition: null as never,
    } as never)
  );

  // Casing is not normalised. Accepting "ACROSS_OPENING" would mean the
  // service guesses intent; the enum in the database has one spelling.
  await expectRejection("uppercase seal position is refused", () =>
    provisionPart({
      ...base,
      chipUid: uid(),
      sealPosition: "ACROSS_OPENING" as never,
    } as never)
  );

  // A refused call must write nothing at all. A row left behind would be an
  // unverifiable part: a tag was never written for it.
  const [{ count }] = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM parts WHERE batch = $1`,
    [BATCH]
  );
  check("refused calls wrote no rows", count === "0");

  // Accepted values persist as given. The mint may fail here (devnet is not
  // guaranteed in a test run); the row is written before the mint, so the
  // stored position is still the thing under test.
  const sealedUid = uid();
  try {
    await provisionPart({
      ...base,
      chipUid: sealedUid,
      sealPosition: "across_opening",
    } as never);
  } catch {
    // Mint failure is out of scope here.
  }

  const absentUid = uid();
  try {
    await provisionPart({ ...base, chipUid: absentUid } as never);
  } catch {
    // Same.
  }

  const stored = await query<{ chip_uid: string; seal_position: string }>(
    `SELECT chip_uid, seal_position FROM parts WHERE batch = $1`,
    [BATCH]
  );

  const sealed = stored.find((r) => r.chip_uid === sealedUid);
  const absent = stored.find((r) => r.chip_uid === absentUid);

  check("across_opening is stored as given", sealed?.seal_position === "across_opening");
  check("absent seal position defaults to surface", absent?.seal_position === "surface");

  await query(`DELETE FROM parts WHERE batch = $1`, [BATCH]);

  console.log(failures === 0 ? "\nAll seal position checks passed" : `\n${failures} failed`);
  await closePool();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (err) => {
  console.error(err);
  await query(`DELETE FROM parts WHERE batch = $1`, [BATCH]).catch(() => {});
  await closePool();
  process.exit(1);
});
