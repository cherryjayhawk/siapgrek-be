import { z } from "zod/v4";

/**
 * Telemetry Payload Schema
 *
 * Validates the JSON structure published by ESP32 edge nodes
 * on the `orchid/{device_id}/telemetry` MQTT topic.
 */
export const TelemetryPayloadSchema = z.object({
    soil: z.object({
        temperature: z.number(),
        humidity: z.number(),
        ph: z.number().optional(),
        conductivity: z.number().optional(),
    }),
    environment: z.object({
        temperature: z.number(),
        humidity: z.number(),
    }),
    light: z.object({
        lux: z.number(),
    }),
    // timestamp: z.iso.datetime(),
    timestamp: z.coerce.date(),
});

/** Inferred TypeScript type from the Zod schema */
export type TelemetryPayload = z.infer<typeof TelemetryPayloadSchema>;

/**
 * Flattened sensor reading ready for database insertion.
 * Includes the device_id extracted from the MQTT topic.
 * Field names are mapped directly to SQL columns in the 'telemetry' hypertable.
 */
export interface SensorReading {
    /** Maps to 'device_id' (TEXT) */
    deviceId: string;
    /** Maps to 'time' (TIMESTAMPTZ) */
    timestamp: Date;
    /** Maps to 'soil_temperature' (DOUBLE PRECISION) */
    soilTemperature: number;
    /** Maps to 'soil_humidity' (DOUBLE PRECISION) */
    soilHumidity: number;
    /** Maps to 'env_temperature' (DOUBLE PRECISION) */
    envTemperature: number;
    /** Maps to 'env_humidity' (DOUBLE PRECISION) */
    envHumidity: number;
    /** Maps to 'light_lux' (INTEGER) */
    lightLux: number;
    /** Maps to 'soil_ph' (DOUBLE PRECISION), NULL if omitted */
    soilPh: number | null;
    /** Maps to 'soil_conductivity' (DOUBLE PRECISION), NULL if omitted */
    soilConductivity: number | null;
}
