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

        try {
            await sql`
                SELECT create_hypertable(
                    'env_telemetry',
                    by_range('time', INTERVAL '1 day'),
                    if_not_exists => TRUE
                )
            `;

            await sql`
                SELECT create_hypertable(
                    'soil_telemetry',
                    by_range('time', INTERVAL '1 day'),
                    if_not_exists => TRUE
                )
            `;

            console.log("[db] TimescaleDB hypertables initialized successfully.");
        } catch (e) {
            console.warn(
                "[db] Could not create hypertables. Using standard tables.",
                e
            );
        }

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
        console.error("[db] Failed to initialize telemetry tables:", err);
        throw err;
    }
}

/**
 * Insert a telemetry reading.
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

        console.log("========== TELEMETRY ==========");
        console.dir(reading, { depth: null });

        console.log("========== ENV ROW ==========");
        console.dir(envRow, { depth: null });

        const envResult = await sql`
            INSERT INTO env_telemetry ${sql(envRow)}
            ON CONFLICT DO NOTHING
        `;

        console.log(
            `[repository] env inserted: ${envResult.count}`
        );

        insertedCount += envResult.count;

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

            console.log("========== SOIL ROWS ==========");
            console.dir(soilRows, { depth: null });

            const soilResult = await sql`
                INSERT INTO soil_telemetry ${sql(soilRows)}
                ON CONFLICT (device_id, slave_id, time)
                DO NOTHING
            `;

            console.log(
                `[repository] soil inserted: ${soilResult.count}`
            );

            insertedCount += soilResult.count;
        }

        console.log(
            `[repository] total inserted: ${insertedCount}`
        );

        return {
            insertedCount,
            timestamp: reading.env.timestamp,
            deviceId: reading.env.deviceId,
        };

    } catch (err) {

        console.error("========== INSERT FAILED ==========");
        console.error(err);

        console.log("========== PAYLOAD ==========");
        console.dir(reading, { depth: null });

        throw err;
    }
}

/**
 * Insert a batch of telemetry readings.
 */
export async function insertTelemetryBatch(
    readings: SensorReading[]
): Promise<SingleInsertResult> {
    if (readings.length === 0) {
        return { insertedCount: 0, timestamp: new Date(), deviceId: "batch_empty" };
    }

    const envRows = readings.map(r => ({
        time: r.env.timestamp,
        device_id: r.env.deviceId,
        env_temperature: r.env.envTemperature,
        env_humidity: r.env.envHumidity,
        light_lux: Math.round(r.env.lightLux),
    }));

    let insertedCount = 0;

    try {
        const envResult = await sql`
            INSERT INTO env_telemetry ${sql(envRows)}
            ON CONFLICT DO NOTHING
        `;

        insertedCount += envResult.count;

        const soilRows: any[] = [];
        for (const reading of readings) {
            if (reading.soil && reading.soil.length > 0) {
                for (const s of reading.soil) {
                    soilRows.push({
                        time: s.timestamp,
                        device_id: s.deviceId,
                        slave_id: s.slaveId,
                        soil_temperature: s.soilTemperature,
                        soil_humidity: s.soilHumidity,
                        soil_ph: s.soilPh,
                        soil_conductivity: s.soilConductivity,
                    });
                }
            }
        }

        if (soilRows.length > 0) {
            const soilResult = await sql`
                INSERT INTO soil_telemetry ${sql(soilRows)}
                ON CONFLICT (device_id, slave_id, time)
                DO NOTHING
            `;
            insertedCount += soilResult.count;
        }

        console.log(`[repository] Batch flushed: total ${insertedCount} rows inserted.`);

        return {
            insertedCount,
            timestamp: readings[readings.length - 1].env.timestamp,
            deviceId: "batch",
        };

    } catch (err) {
        console.error("========== BATCH INSERT FAILED ==========");
        console.error(err);
        throw err;
    }
}

/**
 * Insert command log.
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

        console.log("========== COMMAND ==========");
        console.dir(row, { depth: null });

        await sql`
            INSERT INTO command_log ${sql(row)}
            ON CONFLICT DO NOTHING
        `;

    } catch (err) {

        console.error("[repository] Command log insert failed:", err);
        throw err;
    }
}