import { NextRequest } from "next/server";
import { requireUser } from "@/lib/session";
import { updateProduct, deleteProduct } from "@backend/services/catalog";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;

  let body: { model?: unknown; description?: unknown; category?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const product = await updateProduct(id, auth.user.manufacturerId, {
      model: typeof body.model === "string" ? body.model : undefined,
      description:
        typeof body.description === "string" ? body.description : undefined,
      category: typeof body.category === "string" ? body.category : undefined,
    });

    if (!product) {
      // Same 404 whether the product belongs to another manufacturer or does
      // not exist: distinguishing them would confirm other tenants' ids.
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    return Response.json({ product });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not update product";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;

  try {
    const deleted = await deleteProduct(id, auth.user.manufacturerId);
    if (!deleted) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not delete product";
    return Response.json({ error: message }, { status: 409 });
  }
}
