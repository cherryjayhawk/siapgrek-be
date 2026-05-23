import mqtt from "mqtt";

const MQTT_URL = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
const MQTT_USERNAME = process.env.MQTT_USERNAME || "orchid_mqtt";
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || "mqtt_secret_change_me";

console.log(`[test] Connecting to broker at ${MQTT_URL}...`);

const client = mqtt.connect(MQTT_URL, {
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
    clientId: 'test_publisher_' + Math.random().toString(16).slice(2, 8),
});

client.on("connect", () => {
    console.log("[test] Connected to MQTT broker.");

    const topic = "orchid/testnode01/telemetry";
    
    // Simulate reading matching TelemetryPayloadSchema
    // This matches the firmware's publishTelemetry() output exactly.
    const payload = JSON.stringify({
        timestamp: new Date().toISOString(),
        environment: {
            temperature: 28.0 + Math.random() * 3,
            humidity: 70.0 + Math.random() * 10,
        },
        light: {
            lux: 5000 + Math.floor(Math.random() * 5000),
        },
        soil_sensors: [
            {
                slave_id: "slave01",
                temperature: 24.3 + Math.random() * 2,
                humidity: 60.5 + Math.random() * 5,
                ph: 6.2 + Math.random(),
                ec: 1.1 + Math.random() * 0.5,
            }
        ],
    });

    console.log(`[test] Publishing telemetry message to ${topic}:`);
    console.log(JSON.stringify(JSON.parse(payload), null, 2));

    client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
            console.error("[test] Failed to publish:", err);
        } else {
            console.log("[test] Message successfully published!");
        }
        
        console.log("[test] Disconnecting in 1 second...");
        setTimeout(() => {
            client.end();
            process.exit(0);
        }, 1000);
    });
});

client.on("error", (err) => {
    console.error("[test] MQTT Client Error:", err.message);
    process.exit(1);
});
