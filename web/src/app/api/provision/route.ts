import { NextRequest } from "next/server";
import { requireUser } from "@/lib/session";
import { provisionPart, listPendingMints } from "@backend/services/provisioning";

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const pending = await listPendingMints();
  return Response.json({ pending });
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  let body: {
    productId?: unknown;
    chipUid?: unknown;
    batch?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (
    typeof body.productId !== "string" ||
    typeof body.chipUid !== "string" ||
    typeof body.batch !== "string"
  ) {
    return Response.json(
      { error: "productId, chipUid and batch are required" },
      { status: 400 }
    );
  }

  try {
    const result = await provisionPart({
      productId: body.productId,
      manufacturerId: auth.user.manufacturerId,
      chipUid: body.chipUid,
      batch: body.batch,
      operatorUserId: auth.user.userId,
      operatorLabel: auth.user.email,
    });

    // The tag master key is returned exactly once, here. The database only
    // holds the encrypted form, so it cannot be recovered later.
    return Response.json({ result }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not provision part";
    return Response.json({ error: message }, { status: 400 });
  }
}
