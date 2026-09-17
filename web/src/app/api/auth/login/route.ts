import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { authenticate, createSession } from "@backend/services/auth";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST(request: NextRequest) {
  let email: unknown;
  let password: unknown;

  try {
    ({ email, password } = await request.json());
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof email !== "string" || typeof password !== "string") {
    return Response.json({ error: "Email and password are required" }, { status: 400 });
  }

  const userId = await authenticate(email, password);

  if (!userId) {
    // Same message for unknown email and wrong password: revealing which one
    // failed would let an attacker enumerate registered accounts.
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const { token, expiresAt } = await createSession(
    userId,
    request.headers.get("user-agent") ?? undefined,
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  );

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return Response.json({ ok: true });
}
