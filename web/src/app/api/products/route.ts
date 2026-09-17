import { NextRequest } from "next/server";
import { requireUser } from "@/lib/session";
import { listProducts, createProduct } from "@backend/services/catalog";

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const products = await listProducts(auth.user.manufacturerId);
  return Response.json({ products });
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  let body: { model?: unknown; description?: unknown; category?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.model !== "string") {
    return Response.json({ error: "Model is required" }, { status: 400 });
  }

  try {
    const product = await createProduct(auth.user.manufacturerId, {
      model: body.model,
      description:
        typeof body.description === "string" ? body.description : undefined,
      category: typeof body.category === "string" ? body.category : undefined,
    });
    return Response.json({ product }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create product";
    return Response.json({ error: message }, { status: 400 });
  }
}
