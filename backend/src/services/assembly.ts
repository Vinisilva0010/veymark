/**
 * Assemblies: parts that contain other parts.
 *
 * A sealed case — battery, alternator, starter, control module — can be opened
 * and refilled with fakes while its own tag still reads as authentic. Two
 * things close that gap, and both are recorded here.
 *
 * The seal position tells the line to apply the tag across the opening, so
 * opening the case tears the antenna and the part stops answering at all.
 *
 * The parent link records which components belong inside which assembly. It is
 * written into each passport on-chain as well as here, so a buyer can follow
 * it without trusting this database.
 */
import { query } from "../db/client";

export interface ComponentSlot {
  role: string;
  filled: boolean;
  chipUid: string | null;
  assetId: string | null;
  model: string | null;
}

export interface AssemblyState {
  isAssembly: boolean;
  sealPosition: "surface" | "across_opening";
  slots: ComponentSlot[];
  complete: boolean;
}

/**
 * What a product declares must be inside it, and what is actually recorded
 * inside this specific part.
 *
 * A declared role with nothing in it is not a neutral gap: it means the
 * assembly was provisioned without a component the manufacturer says belongs
 * there, and verification should say so rather than stay quiet.
 */
export async function getAssemblyState(
  partId: string
): Promise<AssemblyState> {
  const [part] = await query<{
    product_id: string;
    seal_position: "surface" | "across_opening";
    is_assembly: boolean;
  }>(
    `SELECT p.product_id, p.seal_position, pr.is_assembly
       FROM parts p
       JOIN products pr ON pr.id = p.product_id
      WHERE p.id = $1`,
    [partId]
  );

  if (!part) {
    throw new Error("Part not found");
  }

  if (!part.is_assembly) {
    return {
      isAssembly: false,
      sealPosition: part.seal_position,
      slots: [],
      complete: true,
    };
  }

  const declared = await query<{ role: string }>(
    `SELECT role FROM product_components
      WHERE product_id = $1
      ORDER BY role`,
    [part.product_id]
  );

  const present = await query<{
    component_role: string | null;
    chip_uid: string;
    asset_id: string | null;
    model: string;
  }>(
    `SELECT c.component_role, c.chip_uid, c.asset_id, cp.model
       FROM parts c
       JOIN products cp ON cp.id = c.product_id
      WHERE c.parent_part_id = $1`,
    [partId]
  );

  const byRole = new Map(present.map((c) => [c.component_role ?? "", c]));

  const slots: ComponentSlot[] = declared.map((d) => {
    const found = byRole.get(d.role);
    return {
      role: d.role,
      filled: Boolean(found),
      chipUid: found?.chip_uid ?? null,
      assetId: found?.asset_id ?? null,
      model: found?.model ?? null,
    };
  });

  return {
    isAssembly: true,
    sealPosition: part.seal_position,
    slots,
    complete: slots.every((s) => s.filled),
  };
}

/**
 * Attaches an already provisioned component to an assembly.
 *
 * Kept separate from provisioning because the component is written first, on
 * its own, and only then placed inside. Refusing the checks below early means
 * a bad link never reaches the chain, where it could not be corrected.
 */
export async function attachComponent(
  assemblyPartId: string,
  componentPartId: string,
  role: string,
  manufacturerId: string
): Promise<void> {
  if (assemblyPartId === componentPartId) {
    throw new Error("A part cannot be placed inside itself");
  }

  const rows = await query<{
    id: string;
    manufacturer_id: string;
    is_assembly: boolean;
    parent_part_id: string | null;
  }>(
    `SELECT p.id, pr.manufacturer_id, pr.is_assembly, p.parent_part_id
       FROM parts p
       JOIN products pr ON pr.id = p.product_id
      WHERE p.id = ANY($1::uuid[])`,
    [[assemblyPartId, componentPartId]]
  );

  const assembly = rows.find((r) => r.id === assemblyPartId);
  const component = rows.find((r) => r.id === componentPartId);

  if (!assembly || !component) {
    throw new Error("Part not found");
  }

  // Both sides must belong to the manufacturer doing the attaching, or one
  // maker could place components inside another maker's assemblies.
  if (
    assembly.manufacturer_id !== manufacturerId ||
    component.manufacturer_id !== manufacturerId
  ) {
    throw new Error("Part not found");
  }

  if (!assembly.is_assembly) {
    throw new Error("That part is not an assembly");
  }

  if (component.parent_part_id) {
    throw new Error("That component is already inside another assembly");
  }

  const declared = await query<{ role: string }>(
    `SELECT pc.role
       FROM product_components pc
       JOIN parts p ON p.product_id = pc.product_id
      WHERE p.id = $1 AND pc.role = $2`,
    [assemblyPartId, role]
  );

  if (declared.length === 0) {
    throw new Error("That role is not declared for this assembly");
  }

  const taken = await query(
    `SELECT 1 FROM parts
      WHERE parent_part_id = $1 AND component_role = $2`,
    [assemblyPartId, role]
  );

  if (taken.length > 0) {
    throw new Error("That role is already filled");
  }

  await query(
    `UPDATE parts SET parent_part_id = $2, component_role = $3 WHERE id = $1`,
    [componentPartId, assemblyPartId, role]
  );
}
