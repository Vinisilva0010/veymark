import "dotenv/config";
import { Pool } from "pg";

// The pool is created on first use rather than at import time. Next imports
// every route module during build to collect configuration, and a top-level
// connection would fail there even though no query is ever run.
let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  pool = new Pool({ connectionString });
  return pool;
}

export async function query<T = any>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await getPool().query(text, params);
  return result.rows as T[];
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
