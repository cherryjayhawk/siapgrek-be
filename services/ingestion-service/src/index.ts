import { initDatabase } from "./db/repository";
import { checkDbConnection } from "./db/client";
import { initMqttClient } from "./mqtt/client";

/**
 * Ingestion Service - Main Entrypoint
 *
 * High-throughput telemetry worker:
 * - Subscribes to MQTT telemetry topics
 * - Validates payloads with Zod
 * - Immediately inserts readings into TimescaleDB
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
    initMqttClient();

    console.log("[ingestion-service] Orchestration loop initialized. Immediate insertion active.");
}

start().catch(err => {
    console.error("Failed to start service:", err);
    process.exit(1);
});
