import { NextRequest } from "next/server";
import { purgeOldDemoParts } from "@backend/services/demo";

/**
 * Scheduled cleanup of visitor-created demo parts.
 *
 * Protected by a shared secret so it cannot be triggered by anyone who finds
 * the URL — a deletion endpoint left open is an obvious way to wipe data.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.DEMO_PURGE_SECRET;

  if (!secret || request.headers.get("x-purge-secret") !== secret) {
    return Response.json({ error: "Not authorised" }, { status: 401 });
  }

  const removed = await purgeOldDemoParts();
  return Response.json({ removed });
}
