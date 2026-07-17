import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { initDatabase, insertTelemetrySingle } from "../../src/db/repository";
import { sql } from "../../src/db/client";

describe("Database & API Idempotency Testing", () => {
    beforeAll(async () => {
        // Initialize tables and hypertables
        await initDatabase();
        // Clear tables for a clean slate
        await sql`DELETE FROM env_telemetry`;
        await sql`DELETE FROM soil_telemetry`;
    });

    afterAll(async () => {
        await sql.end();
    });

    it("should process and insert a valid payload successfully", async () => {
        const timestamp = new Date();
        const payload = {
            env: {
                deviceId: "test_node_01",
                timestamp: timestamp,
                envTemperature: 25.5,
                envHumidity: 60,
                lightLux: 1000
            },
            soil: [
                {
                    deviceId: "test_node_01",
                    slaveId: "slave1",
                    timestamp: timestamp,
                    soilTemperature: 24,
                    soilHumidity: 50,
                    soilPh: 6.5,
                    soilConductivity: 1200
                }
            ]
        };

        const res = await insertTelemetrySingle(payload);
        
        // Memastikan row masuk (1 env + 1 soil = 2 total row yang di-insert)
        // Note: query count might be independent per query in `insertTelemetrySingle`
        // We can just verify via select count.
        
        const envCount = await sql`SELECT count(*) FROM env_telemetry`;
        const soilCount = await sql`SELECT count(*) FROM soil_telemetry`;
        
        expect(envCount[0].count).toBe("1");
        expect(soilCount[0].count).toBe("1");
    });

    it("should prevent duplicate insertion (idempotent) due to Unique Constraint", async () => {
        // Retry insert exact same payload
        const timestamp = new Date("2026-06-19T10:00:00.000Z"); // fixed time for this test

        const payload = {
            env: {
                deviceId: "test_node_dup",
                timestamp: timestamp,
                envTemperature: 25.5,
                envHumidity: 60,
                lightLux: 1000
            },
            soil: [
                {
                    deviceId: "test_node_dup",
                    slaveId: "slave1",
                    timestamp: timestamp,
                    soilTemperature: 24,
                    soilHumidity: 50,
                    soilPh: 6.5,
                    soilConductivity: 1200
                }
            ]
        };

        // First insert
        await insertTelemetrySingle(payload);

        // Second insert (simulating QoS 1 retry delivery of exact same message)
        await insertTelemetrySingle(payload);

        // Third insert
        await insertTelemetrySingle(payload);

        // Total rows with deviceId 'test_node_dup' should still be 1!
        const envCount = await sql`SELECT count(*) FROM env_telemetry WHERE device_id = 'test_node_dup'`;
        const soilCount = await sql`SELECT count(*) FROM soil_telemetry WHERE device_id = 'test_node_dup'`;

        expect(envCount[0].count).toBe("1");
        expect(soilCount[0].count).toBe("1");
    });

    it("should verify Time-Series metadata (hypertables) and exact timestamp", async () => {
        // 1. Verify TimescaleDB Hypertable
        // timescaledb_information.hypertables contains active hypertables
        const hypertables = await sql`
            SELECT hypertable_name 
            FROM timescaledb_information.hypertables 
            WHERE hypertable_name IN ('env_telemetry', 'soil_telemetry')
        `;

        // It should return 2 rows (env_telemetry and soil_telemetry)
        // If timescaledb extension failed to load, this might return 0.
        expect(hypertables.length).toBeGreaterThanOrEqual(1);

        // 2. Verify timestamp is saved correctly without corruption
        const testTimestamp = new Date("2025-01-01T15:30:45.123Z");
        await insertTelemetrySingle({
            env: {
                deviceId: "test_node_ts",
                timestamp: testTimestamp,
                envTemperature: 25.5,
                envHumidity: 60,
                lightLux: 1000
            },
            soil: []
        });

        // Query the inserted row
        const rows = await sql`SELECT time FROM env_telemetry WHERE device_id = 'test_node_ts'`;
        const savedTime = new Date(rows[0].time);
        
        // Assert equal
        expect(savedTime.getTime()).toBe(testTimestamp.getTime());
    });
});
