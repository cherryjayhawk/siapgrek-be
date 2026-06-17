import postgres from "postgres";

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error("[dummy-worker] DATABASE_URL is not provided in environment.");
    process.exit(1);
}

const sql = postgres(dbUrl, {
    max: 2,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => { },
});

console.log("[dummy-worker] Starting dummy data insertion worker...");
console.log("[dummy-worker] Waiting for initial connection...");

async function insertDummyData() {
    try {
        await sql`
            WITH env_data AS (
              INSERT INTO env_telemetry (time, device_id, env_temperature, env_humidity, light_lux)
              VALUES (
                now(),
                'node01',
                20 + (random() * 15),
                40 + (random() * 40),
                (100 + (random() * 900))::integer
              )
              RETURNING 1
            ),
            soil_data AS (
              INSERT INTO soil_telemetry (time, device_id, slave_id, soil_temperature, soil_humidity, soil_ph, soil_conductivity)
              VALUES (
                now(),
                'node01',
                'slave01',
                18 + (random() * 12),
                30 + (random() * 50),
                5.5 + (random() * 2.5),
                0.5 + (random() * 2.0)
              )
              RETURNING 1
            )
            SELECT 'Data inserted successfully' AS result;
        `;
        console.log(`[dummy-worker] [${new Date().toISOString()}] Inserted new dummy telemetry for node01`);
    } catch (err) {
        console.error("[dummy-worker] Error inserting dummy data:", err);
    }
}

// Initial insert right away
insertDummyData();

// Then run every 60 seconds
setInterval(() => {
    insertDummyData();
}, 60000);

// Graceful shutdown
process.on("SIGINT", async () => {
    console.log("\n[dummy-worker] Shutting down...");
    await sql.end();
    process.exit(0);
});
process.on("SIGTERM", async () => {
    console.log("\n[dummy-worker] Shutting down...");
    await sql.end();
    process.exit(0);
});
