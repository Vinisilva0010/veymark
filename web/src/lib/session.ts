/**
 * Session helpers for API routes.
 *
 * The session cookie is httpOnly so client-side JavaScript cannot read it,
 * which removes the token as an XSS target. sameSite=lax blocks it from being
 * sent on cross-site POSTs, covering the common CSRF case.
 */
import { cookies } from "next/headers";
import { resolveSession, type SessionUser } from "@backend/services/auth";

export const SESSION_COOKIE = "veymark_session";

type AuthResult = { user: SessionUser } | { response: Response };

export async function currentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return resolveSession(store.get(SESSION_COOKIE)?.value);
}

/** Returns the user or a 401 response. Use at the top of protected routes. */
export async function requireUser(): Promise<AuthResult> {
  const user = await currentUser();
  if (!user) {
    return {
      response: Response.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }
  return { user };
}
