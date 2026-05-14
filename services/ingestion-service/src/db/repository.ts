import { sql } from "./client";
import type { SensorReading } from "../schemas/telemetry.schema";

export interface SingleInsertResult {
    insertedCount: number;
    timestamp: Date;
    deviceId: string;
}

/**
 * Ensures the telemetry hypertable exists in TimescaleDB.
 */
export async function initDatabase(): Promise<void> {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS telemetry (
                time TIMESTAMPTZ NOT NULL,
                device_id TEXT NOT NULL DEFAULT 'node01',
                soil_temperature DOUBLE PRECISION,
                soil_humidity DOUBLE PRECISION,
                env_temperature DOUBLE PRECISION,
                env_humidity DOUBLE PRECISION,
                light_lux INTEGER,
                soil_ph DOUBLE PRECISION,
                soil_conductivity DOUBLE PRECISION
            )
        `;

        await sql`
            SELECT create_hypertable('telemetry', by_range('time', INTERVAL '1 day'), if_not_exists => TRUE)
        `;
        console.log("[db] TimescaleDB hypertable 'telemetry' initialized successfully.");

        // Ensure command_log table exists (standard relational table)
        await sql`
            CREATE TABLE IF NOT EXISTS command_log (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                device_id TEXT NOT NULL,
                actuator TEXT NOT NULL,
                command_value INTEGER NOT NULL,
                source TEXT NOT NULL DEFAULT 'fuzzy-logic'
            )
        `;
        console.log("[db] Table 'command_log' initialized successfully.");
    } catch (err) {
        console.error("[db] Failed to initialize 'telemetry' hypertable:", err);
        throw err;
    }
}

/**
 * Perform a single insert of a sensor reading into the TimescaleDB hypertable.
 *
 * NOTE: Assumes `telemetry` table exists and is a configured hypertable.
 *
 * @param reading Flattened sensor reading
 * @returns Metadata about the inserted reading
 */
export async function insertTelemetrySingle(
    reading: SensorReading
): Promise<SingleInsertResult> {
    const row = {
        time: reading.timestamp,
        device_id: reading.deviceId,
        soil_temperature: reading.soilTemperature,
        soil_humidity: reading.soilHumidity,
        env_temperature: reading.envTemperature,
        env_humidity: reading.envHumidity,
        light_lux: Math.round(reading.lightLux), // INTEGER mapped
        soil_ph: reading.soilPh,
        soil_conductivity: reading.soilConductivity,
    };

    try {
        const result = await sql`
      INSERT INTO telemetry ${sql(row)}
      RETURNING *
    `;

        return {
            insertedCount: result.count,
            timestamp: reading.timestamp,
            deviceId: reading.deviceId,
        };
    } catch (err) {
        console.error("[repository] Single insert failed:", err);
        throw err;
    }
}

/**
 * Insert a command log entry into the `command_log` table.
 */
export interface CommandLogEntry {
    deviceId: string;
    actuator: string;
    commandValue: number;
    source: string;
}

export async function insertCommandLog(
    entry: CommandLogEntry
): Promise<void> {
    const row = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        device_id: entry.deviceId,
        actuator: entry.actuator,
        command_value: entry.commandValue,
        source: entry.source,
    };

    try {
        await sql`
            INSERT INTO command_log ${sql(row)}
        `;
    } catch (err) {
        console.error("[repository] Command log insert failed:", err);
        throw err;
    }
}

