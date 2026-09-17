import { NextRequest } from "next/server";
import { requireUser } from "@/lib/session";
import { revokeSession } from "@backend/services/auth";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;

  const revoked = await revokeSession(id, auth.user.userId);
  if (!revoked) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  return Response.json({ ok: true });
}
