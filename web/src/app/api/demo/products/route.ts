import { query } from "@backend/db/client";

/**
 * Catalogue shown on the demo page.
 *
 * Public and read-only: model names only, no keys and no per-part data. The
 * demo needs product ids to register against, and those are meaningless
 * without a session.
 */
export async function GET() {
  const products = await query<{ id: string; model: string }>(
    `SELECT pr.id, pr.model
       FROM products pr
       JOIN manufacturers m ON m.id = pr.manufacturer_id
      ORDER BY pr.created_at
      LIMIT 6`
  );

  return Response.json({ products });
}
