import { NextRequest } from "next/server";
import { requireUser } from "@/lib/session";
import { query } from "@backend/db/client";
import { decryptKey } from "@backend/crypto/keys";
import { generateSun, deriveTagKeys } from "@backend/crypto/sun";

/**
 * Produces the URL a physical tag would produce on being touched.
 *
 * This exists so the whole cycle can be followed without tags in hand: write
 * a tag in the panel, follow the link, and see exactly what a buyer's phone
 * would see. It is how the system is demonstrated and tested.
 *
 * It is also a door that must not exist in a real installation. A factory
 * able to mint a valid tap without the chip defeats the one thing the chip
 * is for, so it is off unless ALLOW_SIMULATED_TAP is explicitly set, and it
 * requires a signed-in user of the manufacturer that owns the part.
 */
export async function GET(request: NextRequest) {
  if (process.env.ALLOW_SIMULATED_TAP !== "true") {
    return Response.json({ error: "Not available" }, { status: 404 });
  }

  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const chipUid = request.nextUrl.searchParams.get("chipUid");
  if (!chipUid) {
    return Response.json({ error: "chipUid is required" }, { status: 400 });
  }

  const rows = await query<{
    sdm_key_encrypted: Buffer;
    last_counter: string;
  }>(
    `SELECT p.sdm_key_encrypted, p.last_counter::text AS last_counter
       FROM parts p
       JOIN products pr ON pr.id = p.product_id
      WHERE p.chip_uid = $1 AND pr.manufacturer_id = $2`,
    [chipUid.toUpperCase(), auth.user.manufacturerId]
  );

  if (rows.length === 0) {
    return Response.json({ error: "Part not found" }, { status: 404 });
  }

  // The counter always moves forward, like a real tag. A repeated value is
  // what the replay rejection is built to catch, and handing one out here
  // would produce a refusal that looks like a broken link.
  const counter = Number(rows[0].last_counter) + 1;
  const keys = deriveTagKeys(decryptKey(rows[0].sdm_key_encrypted));
  const payload = generateSun(
    chipUid.toUpperCase(),
    counter,
    keys.metaReadKey,
    keys.macKey
  );

  // Points at the page a buyer lands on, not the endpoint behind it. The tag
  // itself opens /v; /api/verify answers it and returns JSON.
  return Response.json({
    url: `/v?picc_data=${payload.piccData}&cmac=${payload.cmac}`,
  });
}
