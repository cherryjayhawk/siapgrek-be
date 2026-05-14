import {
    TelemetryPayloadSchema,
    type TelemetryPayload,
} from "../schemas/telemetry.schema";

/**
 * Safely parses a raw MQTT message buffer/string into a validated
 * TelemetryPayload. Returns `null` on any parsing or validation failure.
 *
 * @param raw - The raw MQTT message (Buffer or string)
 * @param deviceId - The device_id extracted from the MQTT topic (for logging)
 * @returns The validated payload, or null if invalid
 */
export function validateTelemetry(
    raw: Buffer | string,
    deviceId: string
): TelemetryPayload | null {
    try {
        const text = typeof raw === "string" ? raw : raw.toString("utf-8");
        const json = JSON.parse(text);
        const result = TelemetryPayloadSchema.safeParse(json);

        if (!result.success) {
            console.error(
                `[validator] Invalid telemetry from device '${deviceId}':`,
                result.error.issues.map((i) => i.message).join(", ")
            );
            return null;
        }

        return result.data;
    } catch (err) {
        console.error(
            `[validator] Failed to parse telemetry from device '${deviceId}':`,
            err instanceof Error ? err.message : err
        );
        return null;
    }
}
