import { NextRequest } from "next/server";
import { createHash } from "crypto";
import {
  provisionDemoPart,
  DemoLimitError,
  DEMO_LIMIT_PER_VISITOR,
} from "@backend/services/demo";

/**
 * Registers a demo part and mints its passport, live.
 *
 * The visitor is identified by a hash of their address plus a token the
 * browser generates and keeps. Hashed so no raw address is stored, and the
 * token alone is not trusted — clearing it still leaves the address in the
 * key, so the per-visitor cap cannot be reset by wiping storage.
 */
function visitorKey(request: NextRequest, token: string): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return createHash("sha256").update(ip + "|" + token).digest("hex");
}

export async function POST(request: NextRequest) {
  let body: { productId?: unknown; batch?: unknown; token?: unknown };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.productId !== "string") {
    return Response.json({ error: "productId is required" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.slice(0, 64) : "";
  const batch = typeof body.batch === "string" ? body.batch : "DEMO";

  try {
    const result = await provisionDemoPart(
      visitorKey(request, token),
      body.productId,
      batch
    );
    return Response.json({ result, limitPerVisitor: DEMO_LIMIT_PER_VISITOR });
  } catch (err) {
    if (err instanceof DemoLimitError) {
      return Response.json({ error: err.message }, { status: 429 });
    }
    return Response.json(
      { error: "Could not register the part right now." },
      { status: 500 }
    );
  }
}
