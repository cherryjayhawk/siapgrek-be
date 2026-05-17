import { Hono } from "hono";
import { cors } from "hono/cors";
import type mqtt from "mqtt";

/**
 * Minimal HTTP server that bridges frontend actuator commands to MQTT.
 *
 * POST /api/v1/command
 * Body: { device_id, actuator_kind, actuator_id, value }
 *
 * Publishes to MQTT topic: orchid/{device_id}/command/{actuator_kind}/{actuator_id}
 */

export function createHttpServer(mqttClient: mqtt.MqttClient) {
    const app = new Hono();

    app.use("*", cors({
        origin: process.env.TRUSTED_ORIGINS?.split(",") || ["http://localhost:3000"],
    }));

    // Health check
    app.get("/health", (c) => c.json({ status: "ok", service: "ingestion-service" }));

    // Command bridge: HTTP → MQTT
    app.post("/api/v1/command", async (c) => {
        try {
            const body = await c.req.json<{
                device_id: string;
                actuator_kind: string;
                actuator_id: string;
                value: number;
            }>();

            if (!body.device_id || !body.actuator_kind || !body.actuator_id || body.value === undefined) {
                return c.json({ error: "Missing required fields: device_id, actuator_kind, actuator_id, value" }, 400);
            }

            const topic = `orchid/${body.device_id}/command/${body.actuator_kind}/${body.actuator_id}`;
            const payload = String(body.value);

            if (!mqttClient.connected) {
                return c.json({ error: "MQTT broker is not connected" }, 503);
            }

            await new Promise<void>((resolve, reject) => {
                mqttClient.publish(topic, payload, { qos: 1 }, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            console.log(`[http] Published command: ${topic} = ${payload}`);
            return c.json({ status: "ok", topic, value: body.value });
        } catch (err) {
            console.error("[http] Command publish failed:", err);
            return c.json({ error: "Failed to publish command" }, 500);
        }
    });

    return app;
}
