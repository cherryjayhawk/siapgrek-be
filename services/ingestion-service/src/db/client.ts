import postgres from "postgres";

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error("[db] DATABASE_URL is not provided in environment.");
    process.exit(1);
}

/**
 * Global database client pool connected to TimescaleDB.
 * Used for inserting sensor telemetry.
 */
export const sql = postgres(dbUrl, {
    max: 10, // max connections in pool
    idle_timeout: 20, // max idle time before closing a connection
    connect_timeout: 10, // connect timeout in seconds
    onnotice: () => { }, // suppress notice messages
});

/**
 * Basic health check to ensure DB connectivity.
 */
export async function checkDbConnection(): Promise<boolean> {
    try {
        await sql`SELECT 1`;
        return true;
    } catch (err) {
        console.error("[db] TimescaleDB connection failed:", err);
        return false;
    }
}
