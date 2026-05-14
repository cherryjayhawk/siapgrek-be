import { z } from "zod/v4";

/**
 * Telemetry Payload Schema
 *
 * Validates the JSON structure published by ESP32 edge nodes
 * on the `orchid/{device_id}/telemetry` MQTT topic.
 */
export const SoilSensorSchema = z.object({
    slave_id: z.string(),
    temperature: z.number(),
    humidity: z.number(),
    ph: z.number().optional(),
    ec: z.number().optional(),
});

export const TelemetryPayloadSchema = z.object({
    soil_sensors: z.array(SoilSensorSchema).optional(),
    environment: z.object({
        temperature: z.number(),
        humidity: z.number(),
    }),
    light: z.object({
        lux: z.number(),
    }),
    timestamp: z.coerce.date(),
});

/** Inferred TypeScript type from the Zod schema */
export type TelemetryPayload = z.infer<typeof TelemetryPayloadSchema>;

/**
 * Parsed payload ready for insertion
 */
export interface ParsedEnvReading {
    deviceId: string;
    timestamp: Date;
    envTemperature: number;
    envHumidity: number;
    lightLux: number;
}

export interface ParsedSoilReading {
    deviceId: string;
    slaveId: string;
    timestamp: Date;
    soilTemperature: number;
    soilHumidity: number;
    soilPh: number | null;
    soilConductivity: number | null;
}

export interface SensorReading {
    env: ParsedEnvReading;
    soil: ParsedSoilReading[];
}
