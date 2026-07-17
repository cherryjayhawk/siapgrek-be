import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import mqtt, { type MqttClient } from "mqtt";

const MQTT_URL = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
const MQTT_USERNAME = process.env.MQTT_USERNAME || "orchid_device";
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || "Orchid2026";

describe("Konektivitas Transmisi Jaringan (MQTT) - QoS 1", () => {
    let publisher: MqttClient;
    let subscriber: MqttClient;
    const testTopic = `orchid/test_qos/telemetry`;
    const TOTAL_MESSAGES = 100;

    beforeAll(async () => {
        // Setup Subscriber
        subscriber = mqtt.connect(MQTT_URL, {
            username: MQTT_USERNAME,
            password: MQTT_PASSWORD,
            clientId: 'test_sub_' + Math.random().toString(16).slice(2, 8),
        });

        // Setup Publisher
        publisher = mqtt.connect(MQTT_URL, {
            username: MQTT_USERNAME,
            password: MQTT_PASSWORD,
            clientId: 'test_pub_' + Math.random().toString(16).slice(2, 8),
        });

        await Promise.all([
            new Promise(resolve => subscriber.on("connect", resolve)),
            new Promise(resolve => publisher.on("connect", resolve))
        ]);

        // Subscribe to topic with QoS 1
        await new Promise((resolve, reject) => {
            subscriber.subscribe(testTopic, { qos: 1 }, (err) => {
                if (err) reject(err);
                else resolve(true);
            });
        });
    });

    afterAll(() => {
        subscriber.end();
        publisher.end();
    });

    it("should deliver 100% of messages (0% Packet Loss) using QoS 1", async () => {
        let messagesReceived = 0;
        
        subscriber.on("message", (topic, message) => {
            if (topic === testTopic) {
                messagesReceived++;
            }
        });

        const publishPromises = [];

        for (let i = 0; i < TOTAL_MESSAGES; i++) {
            const payload = JSON.stringify({ sequence: i, timestamp: new Date().toISOString() });
            
            const p = new Promise((resolve, reject) => {
                publisher.publish(testTopic, payload, { qos: 1 }, (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
            publishPromises.push(p);
        }

        // Wait for all publishes to be acknowledged by broker
        await Promise.all(publishPromises);

        // Give subscriber a small window to receive all messages
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Metrik Keberhasilan: 0% Packet Loss
        expect(messagesReceived).toBe(TOTAL_MESSAGES);
    }, 10000); // 10s timeout
});
