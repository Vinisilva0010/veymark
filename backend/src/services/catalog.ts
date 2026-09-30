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
  is_assembly?: boolean;
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
            p.created_at, p.is_assembly,
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

export interface UpdateProductInput {
  model?: string;
  description?: string | null;
  category?: string | null;
}

export async function updateProduct(
  productId: string,
  manufacturerId: string,
  input: UpdateProductInput
): Promise<Product | null> {
  const model = input.model?.trim();
  if (model !== undefined) {
    if (!model) throw new Error("Model is required");
    if (model.length > 120) {
      throw new Error("Model must be 120 characters or fewer");
    }
  }

  try {
    const rows = await query<Product>(
      `UPDATE products
          SET model = COALESCE($3, model),
              description = COALESCE($4, description),
              category = COALESCE($5, category)
        WHERE id = $1 AND manufacturer_id = $2
        RETURNING id, manufacturer_id, model, description, category, created_at`,
      [
        productId,
        manufacturerId,
        model ?? null,
        input.description?.trim() || null,
        input.category?.trim() || null,
      ]
    );
    return rows[0] ?? null;
  } catch (err) {
    if (typeof err === "object" && err !== null && "code" in err) {
      if ((err as { code: string }).code === "23505") {
        throw new Error("A product with this model already exists");
      }
    }
    throw new Error("Could not update product");
  }
}

export interface ComponentSlotDeclaration {
  id: string;
  role: string;
  component_product_id: string | null;
  component_model: string | null;
}

/**
 * The slots a product declares, with the product that fills each one.
 *
 * Scoped by manufacturer like everything else here: the assembly is looked up
 * under the caller's manufacturer, so passing another maker's product id
 * returns nothing rather than their bill of materials.
 */
export async function listComponentSlots(
  productId: string,
  manufacturerId: string
): Promise<ComponentSlotDeclaration[]> {
  return query<ComponentSlotDeclaration>(
    `SELECT pc.id, pc.role, pc.component_product_id,
            cp.model AS component_model
       FROM product_components pc
       JOIN products pr ON pr.id = pc.product_id
       LEFT JOIN products cp ON cp.id = pc.component_product_id
      WHERE pc.product_id = $1 AND pr.manufacturer_id = $2
      ORDER BY pc.role`,
    [productId, manufacturerId]
  );
}

/**
 * Marks a product as a sealed case, or back to a plain part.
 *
 * Refused once parts exist. Those tags were written without contents, and
 * every one of them would read as an incomplete assembly for the rest of its
 * life — a permanent false negative on parts already in the field.
 */
export async function setAssembly(
  productId: string,
  manufacturerId: string,
  isAssembly: boolean
): Promise<void> {
  const [existing] = await query<{ is_assembly: boolean; part_count: string }>(
    `SELECT pr.is_assembly,
            (SELECT COUNT(*) FROM parts WHERE product_id = pr.id)::text
              AS part_count
       FROM products pr
      WHERE pr.id = $1 AND pr.manufacturer_id = $2`,
    [productId, manufacturerId]
  );

  if (!existing) throw new Error("Product not found");
  if (existing.is_assembly === isAssembly) return;

  if (existing.part_count !== "0") {
    throw new Error(
      "This product already has provisioned parts. Its assembly setting cannot be changed."
    );
  }

  await query(
    `UPDATE products SET is_assembly = $3
      WHERE id = $1 AND manufacturer_id = $2`,
    [productId, manufacturerId, isAssembly]
  );
}

/**
 * Declares a slot: a named role and the product that fills it.
 *
 * The component product must belong to the same manufacturer, or a maker
 * could name someone else's product as the approved part for their case.
 */
export async function declareComponentSlot(
  productId: string,
  manufacturerId: string,
  role: string,
  componentProductId: string | null
): Promise<ComponentSlotDeclaration> {
  const trimmedRole = role.trim();
  if (!trimmedRole) throw new Error("Role is required");
  if (trimmedRole.length > 80) {
    throw new Error("Role must be 80 characters or fewer");
  }

  const [assembly] = await query<{ is_assembly: boolean }>(
    `SELECT is_assembly FROM products
      WHERE id = $1 AND manufacturer_id = $2`,
    [productId, manufacturerId]
  );

  if (!assembly) throw new Error("Product not found");

  if (componentProductId) {
    if (componentProductId === productId) {
      throw new Error("A product cannot be a component of itself");
    }

    const [component] = await query<{ id: string }>(
      `SELECT id FROM products
        WHERE id = $1 AND manufacturer_id = $2`,
      [componentProductId, manufacturerId]
    );

    if (!component) throw new Error("Component product not found");
  }

  try {
    const rows = await query<ComponentSlotDeclaration>(
      `INSERT INTO product_components (product_id, role, component_product_id)
       VALUES ($1, $2, $3)
       RETURNING id, role, component_product_id,
                 (SELECT model FROM products WHERE id = $3) AS component_model`,
      [productId, trimmedRole, componentProductId]
    );
    // A product with declared contents is an assembly by definition. Setting
    // it here rather than asking for it separately removes the state where a
    // product lists its contents but is not treated as a case.
    if (!assembly.is_assembly) {
      await query(`UPDATE products SET is_assembly = TRUE WHERE id = $1`, [
        productId,
      ]);
    }

    return rows[0];
  } catch (err) {
    if (typeof err === "object" && err !== null && "code" in err) {
      if ((err as { code: string }).code === "23505") {
        throw new Error("That role is already declared for this product");
      }
    }
    throw new Error("Could not declare that slot");
  }
}

/**
 * Removes a declared slot.
 *
 * Refused while any real part is attached in that role. Removing it would
 * erase the record of what is physically inside a case already sealed and
 * shipped, and the buyer would see a component with no declared place.
 */
export async function removeComponentSlot(
  slotId: string,
  productId: string,
  manufacturerId: string
): Promise<boolean> {
  const [slot] = await query<{ role: string }>(
    `SELECT pc.role
       FROM product_components pc
       JOIN products pr ON pr.id = pc.product_id
      WHERE pc.id = $1 AND pc.product_id = $2 AND pr.manufacturer_id = $3`,
    [slotId, productId, manufacturerId]
  );

  if (!slot) return false;

  const attached = await query(
    `SELECT 1
       FROM parts c
       JOIN parts assembly ON assembly.id = c.parent_part_id
      WHERE assembly.product_id = $1 AND c.component_role = $2
      LIMIT 1`,
    [productId, slot.role]
  );

  if (attached.length > 0) {
    throw new Error(
      "Parts are already recorded in that role. It cannot be removed."
    );
  }

  const rows = await query<{ id: string }>(
    `DELETE FROM product_components
      WHERE id = $1 AND product_id = $2
      RETURNING id`,
    [slotId, productId]
  );

  return rows.length > 0;
}

export async function deleteProduct(
  productId: string,
  manufacturerId: string
): Promise<boolean> {
  // parts.product_id uses ON DELETE RESTRICT, so a product with provisioned
  // parts cannot be removed. That is intentional: deleting it would orphan
  // physical tags already in the field.
  try {
    const rows = await query<{ id: string }>(
      `DELETE FROM products
        WHERE id = $1 AND manufacturer_id = $2
        RETURNING id`,
      [productId, manufacturerId]
    );
    return rows.length > 0;
  } catch (err) {
    if (typeof err === "object" && err !== null && "code" in err) {
      if ((err as { code: string }).code === "23503") {
        throw new Error(
          "This product has provisioned parts and cannot be deleted"
        );
      }
    }
    throw new Error("Could not delete product");
  }
}
