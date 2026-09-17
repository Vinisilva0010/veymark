/**
 * Authentication for the manufacturer panel.
 *
 * Sessions are opaque random tokens. Only their SHA-256 hash is stored, so a
 * database dump yields no usable sessions. Revocation is a row delete, which
 * matters here because panel access implies provisioning authority.
 */
import { randomBytes, createHash, timingSafeEqual } from "crypto";
import { hash as argonHash, verify as argonVerify } from "@node-rs/argon2";
import { query } from "../db/client";

const SESSION_TTL_HOURS = 12;
const TOKEN_BYTES = 32;

export interface SessionUser {
  userId: string;
  manufacturerId: string;
  email: string;
  displayName: string;
}

export async function hashPassword(plain: string): Promise<string> {
  // Argon2id: memory-hard, which blunts GPU-accelerated cracking in a way
  // bcrypt no longer does well.
  return argonHash(plain, {
    algorithm: 2, // Argon2id
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyPassword(
  plain: string,
  stored: string
): Promise<boolean> {
  try {
    return await argonVerify(stored, plain);
  } catch {
    return false;
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 3600 * 1000);

  await query(
    `INSERT INTO sessions (user_id, token_hash, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, hashToken(token), expiresAt, userAgent ?? null, ipAddress ?? null]
  );

  return { token, expiresAt };
}

export async function resolveSession(
  token: string | undefined
): Promise<SessionUser | null> {
  if (!token) return null;

  const rows = await query<{
    session_id: string;
    user_id: string;
    manufacturer_id: string;
    email: string;
    display_name: string;
  }>(
    `SELECT s.id AS session_id, u.id AS user_id, u.manufacturer_id,
            u.email, u.display_name
       FROM sessions s
       JOIN manufacturer_users u ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.expires_at > NOW()
        AND u.is_active = TRUE`,
    [hashToken(token)]
  );

  if (rows.length === 0) return null;

  const row = rows[0];
  await query(`UPDATE sessions SET last_seen_at = NOW() WHERE id = $1`, [
    row.session_id,
  ]);

  return {
    userId: row.user_id,
    manufacturerId: row.manufacturer_id,
    email: row.email,
    displayName: row.display_name,
  };
}

export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  await query(`DELETE FROM sessions WHERE token_hash = $1`, [hashToken(token)]);
}

export async function authenticate(
  email: string,
  password: string
): Promise<string | null> {
  const rows = await query<{ id: string; password_hash: string }>(
    `SELECT id, password_hash FROM manufacturer_users
      WHERE email = $1 AND is_active = TRUE`,
    [email.toLowerCase().trim()]
  );

  // Always run a verification, even when the user does not exist, so response
  // time does not reveal which emails are registered.
  const stored =
    rows[0]?.password_hash ??
    "$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

  const ok = await verifyPassword(password, stored);
  if (!ok || rows.length === 0) return null;

  await query(`UPDATE manufacturer_users SET last_login_at = NOW() WHERE id = $1`, [
    rows[0].id,
  ]);

  return rows[0].id;
}

export async function purgeExpiredSessions(): Promise<number> {
  const rows = await query<{ count: string }>(
    `WITH deleted AS (DELETE FROM sessions WHERE expires_at < NOW() RETURNING 1)
     SELECT COUNT(*)::text AS count FROM deleted`
  );
  return Number(rows[0]?.count ?? 0);
}

export interface ActiveSession {
  id: string;
  created_at: Date;
  last_seen_at: Date;
  expires_at: Date;
  user_agent: string | null;
  ip_address: string | null;
}

/** Lists a user's own active sessions so they can spot and cut unknown ones. */
export async function listSessions(userId: string): Promise<ActiveSession[]> {
  return query<ActiveSession>(
    `SELECT id, created_at, last_seen_at, expires_at, user_agent,
            host(ip_address) AS ip_address
       FROM sessions
      WHERE user_id = $1 AND expires_at > NOW()
      ORDER BY last_seen_at DESC`,
    [userId]
  );
}

/**
 * Revokes one session by id, scoped to its owner so a session id alone is
 * not enough to cut someone else's access.
 */
export async function revokeSession(
  sessionId: string,
  userId: string
): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `DELETE FROM sessions WHERE id = $1 AND user_id = $2 RETURNING id`,
    [sessionId, userId]
  );
  return rows.length > 0;
}
