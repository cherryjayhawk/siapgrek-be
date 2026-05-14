import { Pool } from "pg";

let _pool: Pool | null = null;

/**
 * Returns the shared Postgres connection pool.
 * Lazily initialized on first call so that modules
 * importing db.ts don't crash when DATABASE_URL is
 * absent (e.g. during unit tests).
 */
export function getPool(): Pool {
    if (!_pool) {
        const databaseUrl = process.env["DATABASE_URL"];
        if (!databaseUrl) {
            throw new Error("DATABASE_URL environment variable is required");
        }
        _pool = new Pool({ connectionString: databaseUrl });
    }
    return _pool;
}
