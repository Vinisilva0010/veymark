import { NextRequest } from "next/server";
import { requireUser } from "@/lib/session";
import {
  listComponentSlots,
  declareComponentSlot,
  removeComponentSlot,
} from "@backend/services/catalog";

type Params = { params: Promise<{ id: string }> };

/**
 * The components a product declares must be inside it.
 *
 * Declaring them on the product rather than per part means provisioning can
 * tell an incomplete assembly from a complete one, and verification can name
 * what is missing instead of staying quiet about it.
 *
 * Each slot also names the product that fills it, so attaching can refuse a
 * tag that is the wrong part for that role. All of it goes through the
 * catalog service: the refusals that protect parts already in the field live
 * there, and a route writing SQL of its own would walk straight past them.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const components = await listComponentSlots(id, auth.user.manufacturerId);
  return Response.json({ components });
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;

  let body: { role?: unknown; componentProductId?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.role !== "string" || !body.role.trim()) {
    return Response.json({ error: "A role is required" }, { status: 400 });
  }

  const role = body.role.trim().toLowerCase().slice(0, 60);

  const componentProductId =
    typeof body.componentProductId === "string" && body.componentProductId
      ? body.componentProductId
      : null;

  try {
    const component = await declareComponentSlot(
      id,
      auth.user.manufacturerId,
      role,
      componentProductId
    );
    return Response.json({ component }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not declare that component";
    // Same 404 shape as elsewhere: a product that belongs to another
    // manufacturer must not read differently from one that does not exist.
    const status = message === "Product not found" ? 404 : 400;
    return Response.json({ error: message }, { status });
  }
}

/**
 * Removes a declared slot.
 *
 * Refused while real parts are recorded in that role — removing it would
 * erase the record of what is inside cases already sealed and shipped.
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const slotId = request.nextUrl.searchParams.get("slotId");

  if (!slotId) {
    return Response.json({ error: "slotId is required" }, { status: 400 });
  }

  try {
    const removed = await removeComponentSlot(
      slotId,
      id,
      auth.user.manufacturerId
    );

    if (!removed) {
      return Response.json({ error: "Slot not found" }, { status: 404 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not remove that slot";
    return Response.json({ error: message }, { status: 409 });
  }
}
