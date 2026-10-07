import { NextRequest } from "next/server";
import { requireUser } from "@/lib/session";
import { recordInterest, listInterest } from "@backend/services/interest";

/**
 * Manufacturers asking for access.
 *
 * POST is public — that is the point of the form. GET is not: the rows hold
 * other people's names and email addresses, so reading them requires a
 * signed-in panel user.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Behind a CDN the client address arrives in a header; the first entry is
  // the original caller.
  const sourceIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;

  try {
    await recordInterest({
      kind: body.kind === "waitlist" ? "waitlist" : "manufacturer",
      company: body.company as string,
      contactName: body.contactName as string,
      email: body.email as string,
      partsMade: body.partsMade as string,
      problem: body.problem as string | undefined,
      sourceIp,
    });

    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not record that";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const entries = await listInterest();
  return Response.json({ entries });
}
