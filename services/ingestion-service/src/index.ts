import { initDatabase } from "./db/repository";
import { checkDbConnection } from "./db/client";
import { initMqttClient } from "./mqtt/client";
import { createHttpServer } from "./http/server";

/**
 * Ingestion Service - Main Entrypoint
 *
 * High-throughput telemetry worker:
 * - Subscribes to MQTT telemetry topics
 * - Validates payloads with Zod
 * - Immediately inserts readings into TimescaleDB
 * - Exposes HTTP command bridge for frontend actuator control
 */

async function start() {
    console.log("[ingestion-service] Starting up...");

    // 1. Verify DB is reachable early
    const isDbConnected = await checkDbConnection();
    if (!isDbConnected) {
        console.error("[ingestion-service] Failed to connect to DB. Retrying is handled by docker-compose, but we will exit 1 for now.");
        // We'll proceed so MQTT can still connect, but ideally we'd crash loop here if DB is strictly required at boot.
    } else {
        await initDatabase();
    }

    // 2. Initialize MQTT Client (which handles receiving and storing data)
    const mqttClient = initMqttClient();

    // 3. Start HTTP server for command bridge
    const httpPort = parseInt(process.env.INGESTION_HTTP_PORT || "3005", 10);
    const app = createHttpServer(mqttClient);

    Bun.serve({
        port: httpPort,
        fetch: app.fetch,
    });

    console.log(`[ingestion-service] HTTP command bridge listening on :${httpPort}`);
    console.log("[ingestion-service] Orchestration loop initialized. Immediate insertion active.");
}

start().catch(err => {
    console.error("Failed to start service:", err);
    process.exit(1);
});
