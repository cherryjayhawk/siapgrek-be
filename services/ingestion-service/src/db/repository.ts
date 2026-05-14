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
        await sql`CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;`

        await sql`
            CREATE TABLE IF NOT EXISTS env_telemetry (
                time TIMESTAMPTZ NOT NULL,
                device_id TEXT NOT NULL,
                env_temperature DOUBLE PRECISION,
                env_humidity DOUBLE PRECISION,
                light_lux INTEGER
            )
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS soil_telemetry (
                time TIMESTAMPTZ NOT NULL,
                device_id TEXT NOT NULL,
                slave_id TEXT NOT NULL,
                soil_temperature DOUBLE PRECISION,
                soil_humidity DOUBLE PRECISION,
                soil_ph DOUBLE PRECISION,
                soil_conductivity DOUBLE PRECISION
            )
        `;

        // Wait, since we are using Neon (standard Postgres basically, or open-source Timescale), 
        // we should create hypertables if possible.
        try {
            await sql`SELECT create_hypertable('env_telemetry', by_range('time', INTERVAL '1 day'), if_not_exists => TRUE)`;
            await sql`SELECT create_hypertable('soil_telemetry', by_range('time', INTERVAL '1 day'), if_not_exists => TRUE)`;
            console.log("[db] TimescaleDB hypertables initialized successfully.");
        } catch (e) {
            console.warn("[db] Could not create hypertables (might not be supported on this Neon tier or extension is missing). Using standard tables.", e);
        }

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
    const envRow = {
        time: reading.env.timestamp,
        device_id: reading.env.deviceId,
        env_temperature: reading.env.envTemperature,
        env_humidity: reading.env.envHumidity,
        light_lux: Math.round(reading.env.lightLux),
    };

    let insertedCount = 0;

    try {
        // Insert Environment Telemetry
        const envResult = await sql`
      INSERT INTO env_telemetry ${sql(envRow)}
    `;
        insertedCount += envResult.count;

        // Insert Soil Telemetry
        if (reading.soil && reading.soil.length > 0) {
            const soilRows = reading.soil.map(s => ({
                time: s.timestamp,
                device_id: s.deviceId,
                slave_id: s.slaveId,
                soil_temperature: s.soilTemperature,
                soil_humidity: s.soilHumidity,
                soil_ph: s.soilPh,
                soil_conductivity: s.soilConductivity,
            }));

            const soilResult = await sql`
                INSERT INTO soil_telemetry ${sql(soilRows)}
            `;
            insertedCount += soilResult.count;
        }

        return {
            insertedCount,
            timestamp: reading.env.timestamp,
            deviceId: reading.env.deviceId,
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

