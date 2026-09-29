import { NextRequest } from "next/server";
import { requireUser } from "@/lib/session";
import { query } from "@backend/db/client";

type Params = { params: Promise<{ id: string }> };

/**
 * The components a product declares must be inside it.
 *
 * Declaring them on the product rather than per part means provisioning can
 * tell an incomplete assembly from a complete one, and verification can name
 * what is missing instead of staying quiet about it.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;

  const components = await query<{ id: string; role: string }>(
    `SELECT pc.id, pc.role
       FROM product_components pc
       JOIN products p ON p.id = pc.product_id
      WHERE pc.product_id = $1 AND p.manufacturer_id = $2
      ORDER BY pc.role`,
    [id, auth.user.manufacturerId]
  );

  return Response.json({ components });
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;

  let body: { role?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.role !== "string" || !body.role.trim()) {
    return Response.json({ error: "A role is required" }, { status: 400 });
  }

  const role = body.role.trim().toLowerCase().slice(0, 60);

  // Scoped to the manufacturer so a product id alone cannot be used to add
  // components to somebody else's catalogue.
  const owned = await query(
    `SELECT 1 FROM products WHERE id = $1 AND manufacturer_id = $2`,
    [id, auth.user.manufacturerId]
  );

  if (owned.length === 0) {
    return Response.json({ error: "Product not found" }, { status: 404 });
  }

  try {
    const [component] = await query<{ id: string; role: string }>(
      `INSERT INTO product_components (product_id, role)
       VALUES ($1, $2)
       RETURNING id, role`,
      [id, role]
    );

    // A product with declared components is an assembly by definition.
    await query(
      `UPDATE products SET is_assembly = TRUE WHERE id = $1`,
      [id]
    );

    return Response.json({ component }, { status: 201 });
  } catch (err) {
    if (typeof err === "object" && err !== null && "code" in err) {
      if ((err as { code: string }).code === "23505") {
        return Response.json(
          { error: "That role is already declared" },
          { status: 400 }
        );
      }
    }
    return Response.json(
      { error: "Could not declare that component" },
      { status: 400 }
    );
  }
}
