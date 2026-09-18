import { NextRequest } from "next/server";
import { query } from "@backend/db/client";

type Params = { params: Promise<{ chipUid: string }> };

/**
 * Metadata served for each passport's URI.
 *
 * Public and read-only: this is what a wallet or explorer fetches when
 * displaying the passport. It exposes only what is already printed on the part
 * — model, batch, manufacturer — and never the tag key or the encrypted blob.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { chipUid } = await params;

  const rows = await query<{
    model: string;
    description: string | null;
    batch: string;
    manufacturer_name: string;
    provisioned_at: Date;
  }>(
    `SELECT pr.model, pr.description, p.batch,
            m.name AS manufacturer_name, p.provisioned_at
       FROM parts p
       JOIN products pr ON pr.id = p.product_id
       JOIN manufacturers m ON m.id = pr.manufacturer_id
      WHERE p.chip_uid = $1`,
    [chipUid.toUpperCase()]
  );

  if (rows.length === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const part = rows[0];

  return Response.json({
    name: part.model,
    description:
      part.description ??
      `Authenticity passport for ${part.model} by ${part.manufacturer_name}`,
    attributes: [
      { trait_type: "Manufacturer", value: part.manufacturer_name },
      { trait_type: "Batch", value: part.batch },
      {
        trait_type: "Provisioned",
        value: part.provisioned_at.toISOString().slice(0, 10),
      },
    ],
  });
}
