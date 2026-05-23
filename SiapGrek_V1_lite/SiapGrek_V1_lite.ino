// ===========================================
// SiapGrek IoT V1 — Production Firmware
// ===========================================
//
// End-to-end integration with the SiapGrek backend.
//
// PUBLISH (telemetry):
//   Topic:   orchid/{device_id}/telemetry
//   Payload: TelemetryPayloadSchema (see ingestion-service)
//
// SUBSCRIBE (commands):
//   Topic:   orchid/{device_id}/command/{actuator_kind}/{actuator_id}
//   Payload: "0" or "1" (integer as string)
//
// ===========================================

#include "config.h"

// --- Libraries ---
#include <WiFi.h>
#include <PubSubClient.h>
#include <ModbusMaster.h>
#include <ArduinoJson.h>
#include <LiquidCrystal_I2C.h>
#include <time.h>

// ===========================================
// Hardware Instances
// ===========================================
LiquidCrystal_I2C lcd(0x27, 16, 2);
WiFiClient        espClient;
PubSubClient      mqtt(espClient);
ModbusMaster      RELAY, THCPH, TARH;

// ===========================================
// Sensor State
// ===========================================
// Soil (from THCPH slave — Modbus addr 2)
float soilHumidity      = 0.0;
float soilTemperature   = 0.0;
float soilPh            = 0.0;
int   soilEcRaw         = 0;     // raw register value (µS/cm)

// Environment (from TARH slave — Modbus addr 3)
float envTemperature    = 0.0;
float envHumidity       = 0.0;

// Sensor read status
bool soilReadOk = false;
bool envReadOk  = false;

// ===========================================
// Actuator State (mirrors relay coil state)
// ===========================================
bool relayState[RELAY_NUM_COILS] = { false, false, false };

// ===========================================
// Timing
// ===========================================
unsigned long lastTelemetryMs = 0;

// ===========================================
// SETUP
// ===========================================
void setup() {
    Serial.begin(9600);

    // Modbus RS485 via Serial2 (RX=16, TX=17)
    Serial2.begin(9600, SERIAL_8N1, 16, 17);
    RELAY.begin(MODBUS_ADDR_RELAY, Serial2);
    THCPH.begin(MODBUS_ADDR_THCPH, Serial2);
    TARH.begin(MODBUS_ADDR_TARH,   Serial2);

    // LCD
    lcd.init();
    lcd.clear();
    lcd.backlight();
    lcd.setCursor(0, 0);
    lcd.print("SiapGrek IoT V.1");
    lcd.setCursor(0, 1);
    lcd.print(" BRIN-TelU 2026 ");

    Serial.println(F(""));
    Serial.println(F("========================================"));
    Serial.println(F("       SiapGrek IoT V1 — Production     "));
    Serial.println(F("========================================"));

    // WiFi
    connectWiFi();

    // NTP time sync (needed for ISO timestamps)
    configTime(CONFIG_TZ_OFFSET_HOURS * 3600, 0, "pool.ntp.org", "time.nist.gov");
    Serial.println(F("[time] NTP sync initiated."));

    // MQTT
    mqtt.setServer(CONFIG_MQTT_HOST, CONFIG_MQTT_PORT);
    mqtt.setCallback(onMqttMessage);
    mqtt.setBufferSize(512);  // Ensure buffer can hold our payloads
    connectMqtt();

    // Initialize all relays to OFF
    for (int i = 0; i < RELAY_NUM_COILS; i++) {
        RELAY.writeSingleCoil(i, false);
        relayState[i] = false;
        delay(100);
    }
    Serial.println(F("[relay] All actuators initialized to OFF."));

    delay(CONFIG_LCD_SPLASH_MS);
    lcd.clear();
}

// ===========================================
// MAIN LOOP
// ===========================================
void loop() {
    // 1. Maintain MQTT connection
    if (!mqtt.connected()) {
        connectMqtt();
    }
    mqtt.loop();

    // 2. Periodic telemetry publish
    unsigned long now = millis();
    if (now - lastTelemetryMs >= CONFIG_TELEMETRY_INTERVAL_MS) {
        lastTelemetryMs = now;

        // Read sensors
        readSoilSensor();
        delay(CONFIG_MODBUS_READ_DELAY_MS);
        readEnvSensor();

        // Display on LCD
        updateLcd();

        // Publish to MQTT
        publishTelemetry();
    }
}

// ===========================================
// SENSOR READING
// ===========================================

/**
 * Read soil sensor via Modbus (Slave 2 / THCPH).
 * Registers: 0x0000..0x0003
 *   [0] = Humidity × 10
 *   [1] = Temperature × 10
 *   [2] = Conductivity (µS/cm, raw integer)
 *   [3] = pH × 10
 */
void readSoilSensor() {
    uint8_t result = THCPH.readHoldingRegisters(0x0000, 4);
    if (result == THCPH.ku8MBSuccess) {
        soilHumidity    = THCPH.getResponseBuffer(0x00) / 10.0f;
        soilTemperature = THCPH.getResponseBuffer(0x01) / 10.0f;
        soilEcRaw       = THCPH.getResponseBuffer(0x02);
        soilPh          = THCPH.getResponseBuffer(0x03) / 10.0f;
        soilReadOk = true;

        Serial.printf("[soil] T=%.1f°C  H=%.1f%%  EC=%d µS/cm  pH=%.1f\n",
                      soilTemperature, soilHumidity, soilEcRaw, soilPh);
    } else {
        soilReadOk = false;
        Serial.printf("[soil] Modbus read FAILED (code=%d)\n", result);
    }
}

/**
 * Read environment sensor via Modbus (Slave 3 / TARH).
 * Registers: 0x0001..0x0002 (input registers)
 *   [0] = Temperature × 10
 *   [1] = Humidity × 10
 */
void readEnvSensor() {
    uint8_t result = TARH.readInputRegisters(0x0001, 2);
    if (result == TARH.ku8MBSuccess) {
        envTemperature = TARH.getResponseBuffer(0x00) / 10.0f;
        envHumidity    = TARH.getResponseBuffer(0x01) / 10.0f;
        envReadOk = true;

        Serial.printf("[env]  T=%.1f°C  H=%.1f%%\n", envTemperature, envHumidity);
    } else {
        envReadOk = false;
        Serial.printf("[env]  Modbus read FAILED (code=%d)\n", result);
    }
}

// ===========================================
// MQTT — PUBLISH TELEMETRY
// ===========================================

/**
 * Build and publish the telemetry JSON payload.
 *
 * MUST match TelemetryPayloadSchema in ingestion-service:
 * {
 *   "timestamp": "2026-05-19T03:00:00+0700",
 *   "environment": { "temperature": 28.5, "humidity": 72.3 },
 *   "light": { "lux": 0 },
 *   "soil_sensors": [
 *     {
 *       "slave_id": "slave01",
 *       "temperature": 24.5,
 *       "humidity": 62.0,
 *       "ph": 6.3,
 *       "ec": 1.1
 *     }
 *   ]
 * }
 */
void publishTelemetry() {
    StaticJsonDocument<384> doc;

    // --- Timestamp (ISO 8601) ---
    char isoTime[30];
    time_t now;
    time(&now);
    struct tm* t = localtime(&now);
    strftime(isoTime, sizeof(isoTime), "%Y-%m-%dT%H:%M:%S%z", t);
    doc["timestamp"] = isoTime;

    // --- Environment ---
    JsonObject env = doc.createNestedObject("environment");
    if (envReadOk) {
        env["temperature"] = roundTo1(envTemperature);
        env["humidity"]    = roundTo1(envHumidity);
    } else {
        env["temperature"] = 0.0;
        env["humidity"]    = 0.0;
    }

    // --- Light (placeholder — no lux sensor connected yet) ---
    JsonObject light = doc.createNestedObject("light");
    light["lux"] = 0;

    // --- Soil Sensors Array ---
    // The backend expects an array of soil sensor objects, each identified
    // by a unique `slave_id`. Currently we have one soil probe on Modbus slave 2.
    if (soilReadOk) {
        JsonArray soilArr = doc.createNestedArray("soil_sensors");
        JsonObject s1 = soilArr.createNestedObject();
        s1["slave_id"]    = "slave01";
        s1["temperature"] = roundTo1(soilTemperature);
        s1["humidity"]    = roundTo1(soilHumidity);
        s1["ph"]          = roundTo1(soilPh);
        s1["ec"]          = soilEcRaw / 1000.0;  // µS/cm → mS/cm
    }

    // --- Serialize & Publish ---
    char payload[384];
    size_t len = serializeJson(doc, payload, sizeof(payload));

    if (mqtt.publish(CONFIG_MQTT_PUB_TELEMETRY, payload, true)) {
        Serial.printf("[mqtt] Telemetry published (%d bytes) → %s\n", len, CONFIG_MQTT_PUB_TELEMETRY);
    } else {
        Serial.println(F("[mqtt] ⚠ Telemetry publish FAILED"));
    }
}

// ===========================================
// MQTT — RECEIVE COMMANDS
// ===========================================

/**
 * MQTT message callback.
 *
 * Expected topic format:
 *   orchid/{device_id}/command/{actuator_kind}/{actuator_id}
 *
 * Expected payload:
 *   "0" (OFF) or "1" (ON)
 *
 * Examples:
 *   orchid/node01/command/watering/valve1  → payload "1"  → turn on watering valve 1
 *   orchid/node01/command/misting/pump1   → payload "0"  → turn off misting pump 1
 *   orchid/node01/command/misting/pump2   → payload "1"  → turn on misting pump 2
 */
void onMqttMessage(char* topic, byte* payload, unsigned int length) {
    // Parse payload to integer
    char payloadStr[8];
    int copyLen = min((unsigned int)7, length);
    memcpy(payloadStr, payload, copyLen);
    payloadStr[copyLen] = '\0';
    int value = atoi(payloadStr);
    bool turnOn = (value != 0);

    Serial.printf("[mqtt] Command received: %s = %s\n", topic, payloadStr);

    // Parse topic segments: orchid / {device_id} / command / {kind} / {id}
    // We need segments [3] = actuator_kind, [4] = actuator_id
    char topicCopy[128];
    strncpy(topicCopy, topic, sizeof(topicCopy) - 1);
    topicCopy[sizeof(topicCopy) - 1] = '\0';

    char* segments[6];
    int segCount = 0;
    char* token = strtok(topicCopy, "/");
    while (token != NULL && segCount < 6) {
        segments[segCount++] = token;
        token = strtok(NULL, "/");
    }

    if (segCount < 5) {
        Serial.printf("[mqtt] ⚠ Malformed command topic (expected 5 segments, got %d)\n", segCount);
        return;
    }

    const char* actuatorKind = segments[3];
    const char* actuatorId   = segments[4];

    // Map actuator_kind/actuator_id → relay coil index
    int coilIndex = resolveCoilIndex(actuatorKind, actuatorId);

    if (coilIndex < 0) {
        Serial.printf("[mqtt] ⚠ Unknown actuator: %s/%s\n", actuatorKind, actuatorId);
        return;
    }

    // Execute relay command
    setRelay(coilIndex, turnOn);
}

/**
 * Map an actuator_kind + actuator_id to a relay coil index.
 *
 * This mapping MUST stay in sync with ControlMenu.tsx in the frontend:
 *   watering/valve1  → coil 0
 *   misting/pump1    → coil 1
 *   misting/pump2    → coil 2
 *
 * Returns -1 if no mapping found.
 */
int resolveCoilIndex(const char* kind, const char* id) {
    if (strcmp(kind, "watering") == 0 && strcmp(id, "valve1") == 0) {
        return RELAY_COIL_WATERING_VALVE1;
    }
    if (strcmp(kind, "misting") == 0 && strcmp(id, "pump1") == 0) {
        return RELAY_COIL_MISTING_PUMP1;
    }
    if (strcmp(kind, "misting") == 0 && strcmp(id, "pump2") == 0) {
        return RELAY_COIL_MISTING_PUMP2;
    }
    return -1;
}

/**
 * Set a relay coil to the desired state and update local tracking.
 */
void setRelay(int coilIndex, bool turnOn) {
    RELAY.writeSingleCoil(coilIndex, turnOn);
    relayState[coilIndex] = turnOn;

    const char* names[] = { "watering/valve1", "misting/pump1", "misting/pump2" };
    Serial.printf("[relay] %s → %s\n", names[coilIndex], turnOn ? "ON" : "OFF");

    // Update LCD with actuator state
    lcd.setCursor(0, 1);
    lcd.printf("W:%s M1:%s M2:%s",
               relayState[RELAY_COIL_WATERING_VALVE1] ? "1" : "0",
               relayState[RELAY_COIL_MISTING_PUMP1]   ? "1" : "0",
               relayState[RELAY_COIL_MISTING_PUMP2]   ? "1" : "0");
}

// ===========================================
// WiFi & MQTT CONNECTION
// ===========================================

void connectWiFi() {
    Serial.printf("[wifi] Connecting to %s", CONFIG_WIFI_SSID);
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi...");

    WiFi.begin(CONFIG_WIFI_SSID, CONFIG_WIFI_PASSWORD);
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
        attempts++;
        if (attempts > 40) {  // 20 second timeout
            Serial.println(F("\n[wifi] ⚠ Connection timed out. Restarting..."));
            ESP.restart();
        }
    }

    Serial.printf("\n[wifi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP());
}

/**
 * Connect (or reconnect) to the MQTT broker.
 * Subscribes to command topics on successful connection.
 */
void connectMqtt() {
    while (!mqtt.connected()) {
        Serial.printf("[mqtt] Connecting to %s:%d ...\n", CONFIG_MQTT_HOST, CONFIG_MQTT_PORT);
        lcd.setCursor(0, 0);
        lcd.print("MQTT...");

        if (mqtt.connect(CONFIG_MQTT_CLIENT_ID, CONFIG_MQTT_USER, CONFIG_MQTT_PASS)) {
            Serial.println(F("[mqtt] Connected!"));

            // Subscribe to command topics: orchid/node01/command/+/+
            if (mqtt.subscribe(CONFIG_MQTT_SUB_COMMAND, 1)) {
                Serial.printf("[mqtt] Subscribed to: %s\n", CONFIG_MQTT_SUB_COMMAND);
            } else {
                Serial.println(F("[mqtt] ⚠ Subscribe failed"));
            }

            lcd.setCursor(0, 0);
            lcd.print("MQTT Connected! ");
        } else {
            Serial.printf("[mqtt] Failed (rc=%d). Retrying in %d ms...\n",
                          mqtt.state(), CONFIG_MQTT_RECONNECT_MS);
            lcd.setCursor(0, 0);
            lcd.print("MQTT Retry...   ");
            delay(CONFIG_MQTT_RECONNECT_MS);
        }
    }
}

// ===========================================
// LCD
// ===========================================

void updateLcd() {
    lcd.clear();

    // Line 1: Env temp + humidity
    lcd.setCursor(0, 0);
    if (envReadOk) {
        lcd.printf("E:%.0fC %.0f%%", envTemperature, envHumidity);
    } else {
        lcd.print("E: -- err --");
    }

    // Append soil temp if space allows
    if (soilReadOk) {
        lcd.setCursor(11, 0);
        lcd.printf("S:%.0fC", soilTemperature);
    }

    // Line 2: Actuator states
    lcd.setCursor(0, 1);
    lcd.printf("W:%s M1:%s M2:%s",
               relayState[RELAY_COIL_WATERING_VALVE1] ? "1" : "0",
               relayState[RELAY_COIL_MISTING_PUMP1]   ? "1" : "0",
               relayState[RELAY_COIL_MISTING_PUMP2]   ? "1" : "0");
}

// ===========================================
// UTILITY
// ===========================================

float roundTo1(float value) {
    return ((int)(value * 10 + 0.5)) / 10.0;
}