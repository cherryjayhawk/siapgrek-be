import mqtt from "mqtt";
import { validateTelemetry } from "../utils/validator";
import { insertTelemetrySingle, insertCommandLog } from "../db/repository";

import type { SensorReading } from "../schemas/telemetry.schema";

const MQTT_URL = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
const MQTT_USERNAME = process.env.MQTT_USERNAME || "orchid_mqtt";
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || "mqtt_secret_change_me";
const MQTT_TELEMETRY_TOPIC = process.env.MQTT_TOPIC || "orchid/+/telemetry";
const MQTT_COMMAND_TOPIC = "orchid/+/command/+/+";

export function initMqttClient(): mqtt.MqttClient {
    console.log(`[mqtt] Connecting to broker at ${MQTT_URL}...`);

    const client = mqtt.connect(MQTT_URL, {
        username: MQTT_USERNAME,
        password: MQTT_PASSWORD,
        clientId: `ingestion-service_${Math.random().toString(16).slice(2, 8)}`,
        clean: true,
        reconnectPeriod: 5000, // keep retrying every 5 seconds if connection drops
    });

    client.on("connect", () => {
        console.log("[mqtt] Connected successfully.");

        // Subscribe to telemetry from any edge node
        client.subscribe(MQTT_TELEMETRY_TOPIC, { qos: 1 }, (err) => {
            if (err) {
                console.error(`[mqtt] Failed to subscribe to ${MQTT_TELEMETRY_TOPIC}:`, err);
            } else {
                console.log(`[mqtt] Subscribed to topic pattern: ${MQTT_TELEMETRY_TOPIC}`);
            }
        });

        // Subscribe to command topics for audit logging
        client.subscribe(MQTT_COMMAND_TOPIC, { qos: 1 }, (err) => {
            if (err) {
                console.error(`[mqtt] Failed to subscribe to ${MQTT_COMMAND_TOPIC}:`, err);
            } else {
                console.log(`[mqtt] Subscribed to topic pattern: ${MQTT_COMMAND_TOPIC}`);
            }
        });
    });

    client.on("error", (err) => {
        console.error("[mqtt] Client error:", err.message);
    });

    // Orchestrating ingestion here
    client.on("message", async (topic, message) => {
        console.log("[mqtt] Message received on topic:", topic);
        const parts = topic.split("/");

        // --- Command topic: orchid/{device_id}/command/{actuator_kind}/{actuator_id} ---
        if (parts.length >= 5 && parts[2] === "command") {
            const deviceId = parts[1] || "unknown_device";
            const actuatorKind = parts[3] || "unknown_kind";
            const actuatorId = parts[4] || "unknown_actuator";
            const payload = message.toString().trim();
            const commandValue = parseInt(payload, 10);

            if (isNaN(commandValue)) {
                console.warn(`[mqtt] Invalid command payload on ${topic}: "${payload}"`);
                return;
            }

            try {
                await insertCommandLog({
                    deviceId,
                    actuator: `${actuatorKind}/${actuatorId}`,
                    commandValue,
                    source: "manual", // Source could be UI/manual now that fuzzy is edge
                });
                console.log(`[mqtt] Command logged: ${deviceId}/${actuatorKind}/${actuatorId} = ${commandValue}`);
            } catch (err) {
                console.error(`[mqtt] Error logging command for ${deviceId}/${actuatorKind}/${actuatorId}:`, err);
            }
            return;
        }

        // --- Telemetry topic: orchid/{device_id}/telemetry ---
        const deviceId = parts[1] || "unknown_device";

        // 1. Zod validation wrapper (safe parse)
        const validData = validateTelemetry(message, deviceId);

        // 2. If valid, insert to database immediately
        if (validData) {
            const timestamp = validData.timestamp || new Date();
            const reading: SensorReading = {
                env: {
                    deviceId,
                    timestamp,
                    envTemperature: validData.environment.temperature,
                    envHumidity: validData.environment.humidity,
                    lightLux: validData.light.lux,
                },
                soil: (validData.soil_sensors || []).map(s => ({
                    deviceId,
                    slaveId: s.slave_id,
                    timestamp,
                    soilTemperature: s.temperature,
                    soilHumidity: s.humidity,
                    soilPh: s.ph ?? null,
                    soilConductivity: s.ec ?? null,
                })),
            };

            try {
                await insertTelemetrySingle(reading);
            } catch (err) {
                console.error(`[mqtt] Error processing telemetry for ${deviceId}:`, err);
            }
        }
    });

    return client;
}
