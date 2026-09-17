/**
 * Product catalog access.
 *
 * Every query is scoped by manufacturer_id, never by resource id alone.
 * Without that scoping, one manufacturer could read or edit another's
 * products by changing an id in the URL — the classic multi-tenant leak.
 */
import { query } from "../db/client";

export interface Manufacturer {
  id: string;
  name: string;
  wallet_pubkey: string;
  verified_onchain: boolean;
  created_at: Date;
}

export interface Product {
  id: string;
  manufacturer_id: string;
  model: string;
  description: string | null;
  category: string | null;
  created_at: Date;
  part_count?: number;
}

export async function getManufacturer(
  manufacturerId: string
): Promise<Manufacturer | null> {
  const rows = await query<Manufacturer>(
    `SELECT id, name, wallet_pubkey, verified_onchain, created_at
       FROM manufacturers WHERE id = $1`,
    [manufacturerId]
  );
  return rows[0] ?? null;
}

export async function listProducts(
  manufacturerId: string
): Promise<Product[]> {
  return query<Product>(
    `SELECT p.id, p.manufacturer_id, p.model, p.description, p.category,
            p.created_at,
            COUNT(parts.id)::int AS part_count
       FROM products p
       LEFT JOIN parts ON parts.product_id = p.id
      WHERE p.manufacturer_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC`,
    [manufacturerId]
  );
}

export async function getProduct(
  productId: string,
  manufacturerId: string
): Promise<Product | null> {
  const rows = await query<Product>(
    `SELECT id, manufacturer_id, model, description, category, created_at
       FROM products
      WHERE id = $1 AND manufacturer_id = $2`,
    [productId, manufacturerId]
  );
  return rows[0] ?? null;
}

export interface CreateProductInput {
  model: string;
  description?: string;
  category?: string;
}

export async function createProduct(
  manufacturerId: string,
  input: CreateProductInput
): Promise<Product> {
  const model = input.model.trim();
  if (!model) {
    throw new Error("Model is required");
  }
  if (model.length > 120) {
    throw new Error("Model must be 120 characters or fewer");
  }

  try {
    const rows = await query<Product>(
      `INSERT INTO products (manufacturer_id, model, description, category)
       VALUES ($1, $2, $3, $4)
       RETURNING id, manufacturer_id, model, description, category, created_at`,
      [
        manufacturerId,
        model,
        input.description?.trim() || null,
        input.category?.trim() || null,
      ]
    );

    return rows[0];
  } catch (err) {
    // Translate database errors into messages safe to show a client. Raw
    // Postgres errors leak schema details such as constraint names.
    if (typeof err === "object" && err !== null && "code" in err) {
      if ((err as { code: string }).code === "23505") {
        throw new Error("A product with this model already exists");
      }
    }
    throw new Error("Could not create product");
  }
}

export async function deleteProduct(
  productId: string,
  manufacturerId: string
): Promise<boolean> {
  // parts.product_id uses ON DELETE RESTRICT, so a product with provisioned
  // parts cannot be removed. That is intentional: deleting it would orphan
  // physical tags already in the field.
  const rows = await query<{ id: string }>(
    `DELETE FROM products
      WHERE id = $1 AND manufacturer_id = $2
      RETURNING id`,
    [productId, manufacturerId]
  );
  return rows.length > 0;
}
