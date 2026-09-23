import { NextRequest } from "next/server";
import { generateDemoTap } from "@backend/services/demo";

/**
 * Generates a tap for a demo part, standing in for the physical chip.
 *
 * Restricted to parts flagged is_demo at the query level. The response carries
 * the payload only — verification happens through the same public endpoint a
 * real tap uses, so nothing here is a shortcut around the real check.
 */
export async function POST(request: NextRequest) {
  let body: { chipUid?: unknown; mode?: unknown };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.chipUid !== "string") {
    return Response.json({ error: "chipUid is required" }, { status: 400 });
  }

  const mode = body.mode === "forged" ? "forged" : "genuine";

  try {
    const tap = await generateDemoTap(body.chipUid, mode);
    return Response.json({ tap });
  } catch {
    return Response.json({ error: "Not a demo part" }, { status: 404 });
  }
}
