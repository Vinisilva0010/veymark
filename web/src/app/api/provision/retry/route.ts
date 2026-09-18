import { NextRequest } from "next/server";
import { requireUser } from "@/lib/session";
import { retryMint } from "@backend/services/provisioning";

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  let body: { partId?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.partId !== "string") {
    return Response.json({ error: "partId is required" }, { status: 400 });
  }

  const assetId = await retryMint(body.partId);

  if (!assetId) {
    return Response.json(
      { error: "Mint retry did not complete. The part is still verifiable." },
      { status: 409 }
    );
  }

  return Response.json({ assetId });
}
