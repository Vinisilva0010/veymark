import { requireUser } from "@/lib/session";
import { listSessions } from "@backend/services/auth";

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const sessions = await listSessions(auth.user.userId);
  return Response.json({ sessions });
}
