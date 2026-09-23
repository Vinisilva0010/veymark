import "dotenv/config";
import { Pool } from "pg";

// The pool is created on first use rather than at import time. Next imports
// every route module during build to collect configuration, and a top-level
// connection would fail there even though no query is ever run.
let pool: Pool | null = null;
let cachedConnectionString: string | null = null;

function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  // The cached pool is reused only when it was built from the same connection
  // string. A module-level cache alone is not safe here: serverless bundles
  // share module state across routes, and a pool created before the
  // environment was populated would keep pointing at the driver's localhost
  // default for every later request.
  if (pool && cachedConnectionString === connectionString) {
    return pool;
  }

  cachedConnectionString = connectionString;
  pool = new Pool({
    connectionString,
    // Neon requires TLS; the driver does not infer it from the URL alone.
    ssl: connectionString.includes("localhost")
      ? undefined
      : { rejectUnauthorized: false },
  });

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
