import { describe, it, expect, mock, beforeEach, afterEach, type Mock } from "bun:test";
import mqtt from "mqtt";
import { initMqttClient } from "./client";
import * as repository from "../db/repository";

// Mock the repository functions
mock.module("../db/repository", () => ({
    insertTelemetrySingle: mock(async (data) => { }),
    insertCommandLog: mock(async (data) => { }),
}));

describe("MQTT Ingestion Client", () => {
    let mockClient: any;
    let messageCallback: (topic: string, message: Buffer) => Promise<void>;

    beforeEach(() => {
        (repository.insertTelemetrySingle as Mock<any>).mockClear();
        (repository.insertCommandLog as Mock<any>).mockClear();

        // Setup mock MQTT client
        mockClient = {
            on: mock((event: string, cb: any) => {
                if (event === "message") {
                    messageCallback = cb;
                }
            }),
            subscribe: mock((topic: string, opts: any, cb: any) => {
                if (cb) cb(null);
            }),
            connect: mock(() => mockClient),
        } as any;

        // Mock the mqtt library
        mock.module("mqtt", () => ({
            default: {
                connect: mock(() => mockClient)
            }
        }));

        // Initialize client to trigger setup and hook into `messageCallback`
        initMqttClient();

        // Trigger the on connect callback directly to let it log and subscribe
        const connectCallback = mockClient.on.mock.calls.find((c: any) => c[0] === "connect")?.[1];
        if (connectCallback) {
            connectCallback();
        }
    });

    it("should process and insert valid telemetry messages from MQTT_TELEMETRY_TOPIC", async () => {
        const insertMock = repository.insertTelemetrySingle as Mock<any>;

        const validPayload = {
            timestamp: new Date().toISOString(),
            soil: {
                temperature: 25.5,
                humidity: 60.1,
                ph: 6.5,
                conductivity: 1200
            },
            environment: {
                temperature: 28.0,
                humidity: 70.0
            },
            light: {
                lux: 1000
            }
        };

        const testTopic = "orchid/test_node/telemetry";

        // Simulate an incoming valid message
        expect(messageCallback).toBeDefined();
        await messageCallback(testTopic, Buffer.from(JSON.stringify(validPayload)));

        // Expect the repository function to have been called with the flattened data
        expect(insertMock).toHaveBeenCalled();
        const calledArgs = insertMock.mock.calls[0]?.[0] as any;

        expect(calledArgs.deviceId).toBe("test_node");
        expect(calledArgs.soilTemperature).toBe(25.5);
        expect(calledArgs.soilHumidity).toBe(60.1);
        expect(calledArgs.envTemperature).toBe(28.0);
        expect(calledArgs.envHumidity).toBe(70.0);
        expect(calledArgs.lightLux).toBe(1000);
        expect(calledArgs.soilPh).toBe(6.5);
        expect(calledArgs.soilConductivity).toBe(1200);
    });

    it("should reject invalid telemetry payloads gracefully", async () => {
        const insertMock = repository.insertTelemetrySingle as Mock<any>;

        const invalidPayload = {
            timestamp: new Date().toISOString(),
            soil: {
                humidity: 60.1,
            },
            environment: {
                temperature: 28.0,
                humidity: 70.0
            },
            light: {
                lux: 1000
            }
        };

        const testTopic = "orchid/test_node/telemetry";

        // Simulate an incoming invalid message
        expect(messageCallback).toBeDefined();
        await messageCallback(testTopic, Buffer.from(JSON.stringify(invalidPayload)));

        // Since it's invalid, insert should NEVER be called
        expect(insertMock).not.toHaveBeenCalled();
    });
});
