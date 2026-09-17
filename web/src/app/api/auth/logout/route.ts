import { cookies } from "next/headers";
import { destroySession } from "@backend/services/auth";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  // Delete the server-side session, not just the cookie: clearing the cookie
  // alone would leave a valid token usable if it was captured elsewhere.
  await destroySession(token);
  store.delete(SESSION_COOKIE);

  return Response.json({ ok: true });
}
