import { NextRequest } from "next/server";
import { requireUser } from "@/lib/session";
import { attachComponent, getAssemblyState } from "@backend/services/assembly";
import { query } from "@backend/db/client";

/**
 * Places a provisioned component inside a provisioned assembly.
 *
 * Both parts exist before this runs: each was written and passported on its
 * own. Attaching is a separate step because a component is often made on a
 * different line, or by a different supplier, than the case it ends up in.
 */
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  let body: {
    assemblyChipUid?: unknown;
    componentChipUid?: unknown;
    role?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (
    typeof body.assemblyChipUid !== "string" ||
    typeof body.componentChipUid !== "string" ||
    typeof body.role !== "string"
  ) {
    return Response.json(
      { error: "assemblyChipUid, componentChipUid and role are required" },
      { status: 400 }
    );
  }

  // Tags are identified by the number on the chip, which is what the reader
  // gives the operator — they never handle internal ids.
  const rows = await query<{ id: string; chip_uid: string }>(
    `SELECT p.id, p.chip_uid
       FROM parts p
       JOIN products pr ON pr.id = p.product_id
      WHERE p.chip_uid = ANY($1::text[]) AND pr.manufacturer_id = $2`,
    [
      [
        body.assemblyChipUid.toUpperCase(),
        body.componentChipUid.toUpperCase(),
      ],
      auth.user.manufacturerId,
    ]
  );

  const assembly = rows.find(
    (r) => r.chip_uid === (body.assemblyChipUid as string).toUpperCase()
  );
  const component = rows.find(
    (r) => r.chip_uid === (body.componentChipUid as string).toUpperCase()
  );

  if (!assembly || !component) {
    return Response.json({ error: "Part not found" }, { status: 404 });
  }

  try {
    await attachComponent(
      assembly.id,
      component.id,
      body.role,
      auth.user.manufacturerId
    );
    const state = await getAssemblyState(assembly.id);
    return Response.json({ state });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not attach that component";
    return Response.json({ error: message }, { status: 400 });
  }
}

/** Current contents of an assembly, by its tag number. */
export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const chipUid = request.nextUrl.searchParams.get("chipUid");
  if (!chipUid) {
    return Response.json({ error: "chipUid is required" }, { status: 400 });
  }

  const [part] = await query<{ id: string }>(
    `SELECT p.id
       FROM parts p
       JOIN products pr ON pr.id = p.product_id
      WHERE p.chip_uid = $1 AND pr.manufacturer_id = $2`,
    [chipUid.toUpperCase(), auth.user.manufacturerId]
  );

  if (!part) {
    return Response.json({ error: "Part not found" }, { status: 404 });
  }

  const state = await getAssemblyState(part.id);
  return Response.json({ state });
}
