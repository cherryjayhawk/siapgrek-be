import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import mqtt, { type MqttClient } from "mqtt";
import { sql } from "../../src/db/client";
import { initMqttClient } from "../../src/mqtt/client";

const MQTT_URL = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
const MQTT_USERNAME = process.env.MQTT_USERNAME || "orchid_device";
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || "Orchid2026";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

describe("IoT Node Disconnect & Buffer Simulation (Packet Delivery Rate)", () => {
    let publisher: MqttClient;
    const testTopic = `orchid/test_node_reconnect/telemetry`;
    const TOTAL_MESSAGES = 50;

    let ingestClient: MqttClient;

    beforeAll(async () => {
        // Jalankan Ingestion Service MQTT Client di background
        ingestClient = initMqttClient();

        // Bersihkan tabel untuk device ID ini agar kita bisa menghitung akurat
        await sql`DELETE FROM env_telemetry WHERE device_id = 'test_node_reconnect'`;
        await sql`DELETE FROM soil_telemetry WHERE device_id = 'test_node_reconnect'`;

        await new Promise<void>(resolve => {
            if (ingestClient.connected) return resolve();
            ingestClient.once("connect", () => resolve());
        });
        
        // Setup Publisher (Simulasi IoT Node)
        // Kita menggunakan clean: false untuk menjaga state session dan antrean QoS 1
        publisher = mqtt.connect(MQTT_URL, {
            username: MQTT_USERNAME,
            password: MQTT_PASSWORD,
            clientId: 'iot_node_sim_01',
            clean: false,
            reconnectPeriod: 1000, // Reconnect setiap 1 detik jika putus
            connectTimeout: 5000,
        });

        await new Promise(resolve => publisher.on("connect", resolve));
        await delay(1000); // Pastikan subscriptions terekam di broker
        console.log("[Test] IoT Node Terhubung ke Broker.");
    });

    afterAll(async () => {
        publisher.end();
        await sql.end();
    });

    it("should buffer messages offline and deliver 100% of data without duplicates after reconnect", async () => {
        const publishPromises: Promise<any>[] = [];
        let messagesSentBeforeDisconnect = 0;
        let messagesSentDuringDisconnect = 0;

        // 1. Kirim 10 pesan pertama dalam kondisi normal
        for (let i = 0; i < 10; i++) {
            const timestamp = new Date().toISOString();
            const payload = JSON.stringify({
                timestamp,
                environment: { temperature: 25.0, humidity: 60.0 },
                light: { lux: 1000 },
                soil_sensors: [{ slave_id: "slave1", temperature: 24.0, humidity: 50.0, ph: 6.5, ec: 1.1 }]
            });

            const p = new Promise((resolve, reject) => {
                publisher.publish(testTopic, payload, { qos: 1 }, (err) => {
                    if (err) reject(err); else resolve(true);
                });
            });
            publishPromises.push(p);
            messagesSentBeforeDisconnect++;
            await delay(50);
        }

        console.log(`[Test] ${messagesSentBeforeDisconnect} pesan terkirim. Memutus koneksi jaringan...`);

        // 2. Putus jaringan secara paksa (menghentikan Mosquitto broker container)
        const procStop = Bun.spawn(["docker", "stop", "orchid-mosquitto"]);
        await procStop.exited;
        console.log("[Test] Mosquitto broker DIMATIKAN. Jaringan terputus!");

        // 3. IoT Node terus mencoba mengirim data sensor selama offline
        console.log("[Test] Memulai simulasi buffering IoT offline...");
        for (let i = 10; i < 40; i++) {
            const timestamp = new Date().toISOString();
            const payload = JSON.stringify({
                timestamp,
                environment: { temperature: 25.0, humidity: 60.0 },
                light: { lux: 1000 },
                soil_sensors: [{ slave_id: "slave1", temperature: 24.0, humidity: 50.0, ph: 6.5, ec: 1.1 }]
            });

            // Publish saat offline: pustaka MQTT akan menyimpannya dalam buffer memori
            const p = new Promise((resolve, reject) => {
                publisher.publish(testTopic, payload, { qos: 1 }, (err) => {
                    if (err) reject(err); else resolve(true);
                });
            });
            publishPromises.push(p);
            messagesSentDuringDisconnect++;
            await delay(50);
        }

        console.log(`[Test] ${messagesSentDuringDisconnect} pesan berhasil di-buffer di memori IoT Node.`);
        console.log("[Test] Menghidupkan ulang jaringan...");

        // 4. Hidupkan ulang Mosquitto
        const procStart = Bun.spawn(["docker", "start", "orchid-mosquitto"]);
        await procStart.exited;
        console.log("[Test] Mosquitto broker DIHIDUPKAN kembali. Menunggu node reconnect...");

        // Tunggu publisher & ingest client reconnect
        await new Promise<void>(resolve => {
            let pConnected = publisher.connected;
            let iConnected = ingestClient.connected;
            
            const check = () => { if (pConnected && iConnected) resolve(); };
            
            if (!pConnected) publisher.once("connect", () => { pConnected = true; check(); });
            if (!iConnected) ingestClient.once("connect", () => { iConnected = true; check(); });
            
            check();
        });
        
        // Kasih waktu sikit agar ingestClient sempat subscribe ulang
        await delay(1000);
        console.log("[Test] IoT Node & Ingestion Service berhasil Reconnect dan siap!");

        // 5. Kirim sisa pesan
        for (let i = 40; i < TOTAL_MESSAGES; i++) {
            const timestamp = new Date().toISOString();
            const payload = JSON.stringify({
                timestamp,
                environment: { temperature: 25.0, humidity: 60.0 },
                light: { lux: 1000 },
                soil_sensors: [{ slave_id: "slave1", temperature: 24.0, humidity: 50.0, ph: 6.5, ec: 1.1 }]
            });

            const p = new Promise((resolve, reject) => {
                publisher.publish(testTopic, payload, { qos: 1 }, (err) => {
                    if (err) reject(err); else resolve(true);
                });
            });
            publishPromises.push(p);
            await delay(50);
        }

        console.log("[Test] Menunggu seluruh payload tereksekusi dan disimpan di database...");
        await Promise.all(publishPromises);

        // Tunggu Ingestion Service memproses semua pesan yang masuk ke antrean broker
        await delay(5000);

        // 6. Validasi Idempotent Insertion dan Packet Delivery Rate
        const envCount = await sql`SELECT count(*) FROM env_telemetry WHERE device_id = 'test_node_reconnect'`;
        const totalRows = parseInt(envCount[0].count);
        
        console.log(`[Test] Total pesan terkirim: ${TOTAL_MESSAGES}, Total tersimpan di DB: ${totalRows}`);
        
        expect(totalRows).toBe(TOTAL_MESSAGES);
    }, 30000); // 30 detik timeout
});
