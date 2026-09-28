import { NextRequest } from "next/server";
import { query } from "@backend/db/client";

type Params = { params: Promise<{ chipUid: string }> };

/**
 * Metadata served for each passport's URI.
 *
 * Public and read-only: what a wallet or explorer fetches when displaying the
 * passport. It exposes only what is already printed on the part — model,
 * batch, manufacturer — plus the assembly relationship, and never the tag key.
 *
 * The relationship is here rather than only in our database so a buyer can
 * follow it from the passport itself: a component names the assembly it
 * belongs to, and an assembly lists what should be inside it.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { chipUid } = await params;

  const rows = await query<{
    id: string;
    model: string;
    description: string | null;
    batch: string;
    manufacturer_name: string;
    provisioned_at: Date;
    seal_position: string;
    component_role: string | null;
    parent_asset_id: string | null;
    parent_model: string | null;
  }>(
    `SELECT p.id, pr.model, pr.description, p.batch,
            m.name AS manufacturer_name, p.provisioned_at,
            p.seal_position, p.component_role,
            parent.asset_id AS parent_asset_id,
            parent_pr.model AS parent_model
       FROM parts p
       JOIN products pr ON pr.id = p.product_id
       JOIN manufacturers m ON m.id = pr.manufacturer_id
       LEFT JOIN parts parent ON parent.id = p.parent_part_id
       LEFT JOIN products parent_pr ON parent_pr.id = parent.product_id
      WHERE p.chip_uid = $1`,
    [chipUid.toUpperCase()]
  );

  if (rows.length === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const part = rows[0];

  const components = await query<{
    asset_id: string | null;
    component_role: string | null;
    model: string;
  }>(
    `SELECT c.asset_id, c.component_role, cp.model
       FROM parts c
       JOIN products cp ON cp.id = c.product_id
      WHERE c.parent_part_id = $1
      ORDER BY c.component_role`,
    [part.id]
  );

  const attributes: { trait_type: string; value: string }[] = [
    { trait_type: "Manufacturer", value: part.manufacturer_name },
    { trait_type: "Batch", value: part.batch },
    {
      trait_type: "Provisioned",
      value: part.provisioned_at.toISOString().slice(0, 10),
    },
    {
      trait_type: "Seal",
      value:
        part.seal_position === "across_opening"
          ? "Across the opening — breaks if the case is opened"
          : "On the surface",
    },
  ];

  if (part.component_role) {
    attributes.push({ trait_type: "Role", value: part.component_role });
  }
  if (part.parent_asset_id) {
    attributes.push({ trait_type: "Inside", value: part.parent_model ?? "" });
    attributes.push({ trait_type: "Assembly", value: part.parent_asset_id });
  }

  return Response.json({
    name: part.component_role
      ? part.component_role + " / " + part.model
      : part.model,
    description:
      part.description ??
      `Authenticity passport for ${part.model} by ${part.manufacturer_name}`,
    attributes,
    // Present only on assemblies: what the manufacturer recorded as being
    // inside this case.
    components: components.map((c) => ({
      role: c.component_role,
      model: c.model,
      assetId: c.asset_id,
    })),
  });
}
