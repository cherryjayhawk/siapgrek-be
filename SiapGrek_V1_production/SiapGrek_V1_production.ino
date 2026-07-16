// ===========================================
// SiapGrek IoT V1 — Production Firmware (with SD Card Fail-Safe Buffering)
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
// FAIL-SAFE:
//   - Buffers telemetry to SD Card when MQTT/WiFi is down
//   - Retransmits buffered data when connection recovers
//   - Fuzzy controller runs independently every 60s regardless of connectivity
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
#include <SdFat.h>
#include <SPI.h>

// ===========================================
// Hardware Instances
// ===========================================
LiquidCrystal_I2C lcd(0x27, 16, 2);
WiFiClient        espClient;
PubSubClient      mqtt(espClient);
ModbusMaster      RELAY, THCPH, TARH;
SdFat             sd;

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
unsigned long lastFuzzyMs     = 0;

// ===========================================
// SD Card & Buffering State
// ===========================================
bool sdEn = false;
const char* BUFFER_DIR  = "/buffer";
const char* BUFFER_FILE = "/buffer/telemetry.jsonl";

// ===========================================
// MQTT Non-Blocking Reconnect State
// ===========================================
unsigned long lastMqttReconnectAttempt = 0;
unsigned long lastBufferFlushAttempt   = 0;
bool mqttWasConnected = false;

// ===========================================
// FUZZY LOGIC — Membership Function Types
// ===========================================
enum MFType { TRAP, TRI };

struct MF {
    MFType type;
    float a, b, c, d;
};

struct FuzzySet {
    const char* label;
    MF mf;
};

// --- Input MFs ---
// Soil Moisture (%)
FuzzySet soilDry   = {"Dry",      {TRAP, 0,  0,  20, 40}};
FuzzySet soilMoist = {"Moist",    {TRAP, 30, 50, 60, 70}};
FuzzySet soilWet   = {"Wet",      {TRAP, 60, 80, 100, 100}};

// Relative Humidity (%)
FuzzySet humLow    = {"Low",      {TRAP, 30, 30, 45, 60}};
FuzzySet humMod    = {"Moderate", {TRI,  55, 70, 85, 0}};
FuzzySet humHigh   = {"High",     {TRAP, 75, 90, 100, 100}};

// Air Temperature (°C)
FuzzySet tempCold  = {"Cold",     {TRAP, 15, 15, 20, 23}};
FuzzySet tempMod   = {"Moderate", {TRI,  22, 27, 32, 0}};
FuzzySet tempHot   = {"Hot",      {TRAP, 28, 33, 38, 38}};

// Output MFs — Misting Duty Cycle (%)
FuzzySet outOff      = {"Off",      {TRAP, 0,  0,  15, 25}};
FuzzySet outLow      = {"Low",      {TRI,  15, 35, 55, 0}};
FuzzySet outModerate = {"Moderate", {TRI,  35, 55, 75, 0}};
FuzzySet outHigh     = {"High",     {TRAP, 65, 85, 100, 100}};

// --- 27 Agronomic Rules (Soil, Humidity, Temperature → Output) ---
const char* rules[27][4] = {
    {"Dry",   "Low",      "Cold",     "High"},
    {"Dry",   "Low",      "Moderate", "High"},
    {"Dry",   "Low",      "Hot",      "High"},
    {"Dry",   "Moderate", "Cold",     "High"},
    {"Dry",   "Moderate", "Moderate", "High"},
    {"Dry",   "Moderate", "Hot",      "High"},
    {"Dry",   "High",     "Cold",     "Moderate"},
    {"Dry",   "High",     "Moderate", "Moderate"},
    {"Dry",   "High",     "Hot",      "High"},
    {"Moist", "Low",      "Cold",     "Moderate"},
    {"Moist", "Low",      "Moderate", "Moderate"},
    {"Moist", "Low",      "Hot",      "High"},
    {"Moist", "Moderate", "Cold",     "Low"},
    {"Moist", "Moderate", "Moderate", "Low"},
    {"Moist", "Moderate", "Hot",      "Moderate"},
    {"Moist", "High",     "Cold",     "Off"},
    {"Moist", "High",     "Moderate", "Off"},
    {"Moist", "High",     "Hot",      "Low"},
    {"Wet",   "Low",      "Cold",     "Off"},
    {"Wet",   "Low",      "Moderate", "Off"},
    {"Wet",   "Low",      "Hot",      "Off"},
    {"Wet",   "Moderate", "Cold",     "Off"},
    {"Wet",   "Moderate", "Moderate", "Off"},
    {"Wet",   "Moderate", "Hot",      "Off"},
    {"Wet",   "High",     "Cold",     "Off"},
    {"Wet",   "High",     "Moderate", "Off"},
    {"Wet",   "High",     "Hot",      "Off"}
};

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
    Serial.println(F("       + SD Fail-Safe Buffering         "));
    Serial.println(F("========================================"));

    // SD Card init
    initSdCard();

    // WiFi
    connectWiFi();

    // NTP time sync
    configTime(CONFIG_TZ_OFFSET_HOURS * 3600, 0, "pool.ntp.org", "time.nist.gov");
    Serial.println(F("[time] NTP sync initiated."));

    // MQTT
    mqtt.setServer(CONFIG_MQTT_HOST, CONFIG_MQTT_PORT);
    mqtt.setCallback(onMqttMessage);
    mqtt.setBufferSize(512);
    // Initial blocking connect (only at boot)
    connectMqttBlocking();

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
// MAIN LOOP — NON-BLOCKING FAIL-SAFE
// ===========================================
void loop() {
    // 1. Non-blocking MQTT maintenance
    maintainMqtt();

    // 2. Fuzzy logic runs every 60s INDEPENDENTLY of connectivity
    unsigned long now = millis();
    if (now - lastFuzzyMs >= 60000) {
        lastFuzzyMs = now;

        // Read sensors
        readSoilSensor();
        delay(CONFIG_MODBUS_READ_DELAY_MS);
        readEnvSensor();

        // Fuzzy inference for misting control
        float mistingDuty = fuzzyInference(soilHumidity, envHumidity, envTemperature);
        controlMisting(mistingDuty);

        // Display on LCD
        updateLcd();

        // Build telemetry payload
        char payload[512];
        buildTelemetryPayload(payload, sizeof(payload), mistingDuty);

        // Publish with fail-safe routing (MQTT or SD Card)
        publishTelemetryWithFailSafe(payload);
    }

    delay(100);  // Breathing room
}

// ===========================================
// SD CARD & BUFFERING
// ===========================================

void initSdCard() {
    if (!sd.begin(CONFIG_SD_CS_PIN, SD_SCK_MHZ(10))) {
        sdEn = false;
        Serial.println(F("[sd] SD Card init FAILED — buffering disabled"));
        lcd.setCursor(0, 1);
        lcd.print("SD: FAIL        ");
        delay(1000);
        return;
    }
    sdEn = true;
    Serial.println(F("[sd] SD Card init OK"));

    if (!sd.exists(BUFFER_DIR)) {
        sd.mkdir(BUFFER_DIR);
        Serial.println(F("[sd] Buffer dir created"));
    }
}

bool saveToBuffer(const char* payload) {
    if (!sdEn) return false;
    FsFile file = sd.open(BUFFER_FILE, O_WRITE | O_CREAT | O_APPEND);
    if (!file) {
        Serial.println(F("[buffer] ERROR: cannot open buffer file"));
        return false;
    }
    file.println(payload);
    file.close();
    Serial.println(F("[buffer] Data saved to SD Card"));
    return true;
}

void flushBuffer() {
    if (!sdEn || !mqtt.connected()) return;
    if (!sd.exists(BUFFER_FILE)) {
        Serial.println(F("[buffer] Flush attempt: no pending data"));
        return;
    }

    FsFile file = sd.open(BUFFER_FILE, O_READ);
    if (!file) return;

    Serial.println(F("[buffer] Starting retransmit..."));
    int count = 0;
    char line[512];

    while (file.available()) {
        int n = file.fgets(line, sizeof(line));
        if (n <= 0) continue;
        line[strcspn(line, "\r\n")] = 0;

        if (strlen(line) > 0 && mqtt.connected()) {
            if (mqtt.publish(CONFIG_MQTT_PUB_TELEMETRY, line, false)) {
                count++;
                delay(100);
            } else {
                Serial.println(F("[buffer] Retransmit publish failed, will retry later"));
                file.close();
                return; // Keep remaining data for next attempt
            }
        }
    }
    file.close();

    sd.remove(BUFFER_FILE);
    Serial.printf("[buffer] Retransmit complete. %d records sent.\n", count);

    lcd.setCursor(0, 1);
    lcd.printf("Flush:%d OK     ", count);
}

// ===========================================
// MQTT — NON-BLOCKING MAINTENANCE
// ===========================================

void maintainMqtt() {
    if (WiFi.status() != WL_CONNECTED) {
        mqttWasConnected = false;
        return;
    }

    if (mqtt.connected()) {
        mqtt.loop();
        mqttWasConnected = true;

        // Periodic flush attempt every 30s if buffer exists
        unsigned long now = millis();
        if (now - lastBufferFlushAttempt >= 30000) {
            lastBufferFlushAttempt = now;
            flushBuffer();
        }
        return;
    }

    // MQTT disconnected — non-blocking reconnect
    mqttWasConnected = false;
    unsigned long now = millis();
    if (now - lastMqttReconnectAttempt >= CONFIG_MQTT_RECONNECT_MS) {
        lastMqttReconnectAttempt = now;

        Serial.printf("[mqtt] Reconnecting to %s:%d ...\n", CONFIG_MQTT_HOST, CONFIG_MQTT_PORT);

        if (mqtt.connect(CONFIG_MQTT_CLIENT_ID, CONFIG_MQTT_USER, CONFIG_MQTT_PASS)) {
            Serial.println(F("[mqtt] Reconnected!"));
            mqtt.subscribe(CONFIG_MQTT_SUB_COMMAND, 1);
            mqttWasConnected = true;
            // Immediately try to flush buffered data after reconnect
            flushBuffer();
        } else {
            Serial.printf("[mqtt] Reconnect failed (rc=%d)\n", mqtt.state());
        }
    }
}

// Blocking connect only used during setup()
void connectMqttBlocking() {
    while (!mqtt.connected()) {
        Serial.printf("[mqtt] Connecting to %s:%d ...\n", CONFIG_MQTT_HOST, CONFIG_MQTT_PORT);
        lcd.setCursor(0, 0);
        lcd.print("MQTT...");

        if (mqtt.connect(CONFIG_MQTT_CLIENT_ID, CONFIG_MQTT_USER, CONFIG_MQTT_PASS)) {
            Serial.println(F("[mqtt] Connected!"));
            if (mqtt.subscribe(CONFIG_MQTT_SUB_COMMAND, 1)) {
                Serial.printf("[mqtt] Subscribed: %s\n", CONFIG_MQTT_SUB_COMMAND);
            }
            lcd.setCursor(0, 0);
            lcd.print("MQTT Connected! ");
            mqttWasConnected = true;
        } else {
            Serial.printf("[mqtt] Failed (rc=%d). Retry in %d ms...\n",
                          mqtt.state(), CONFIG_MQTT_RECONNECT_MS);
            lcd.setCursor(0, 0);
            lcd.print("MQTT Retry...   ");
            delay(CONFIG_MQTT_RECONNECT_MS);
        }
    }
}

// ===========================================
// FUZZY LOGIC ENGINE
// ===========================================

float mfValue(float x, FuzzySet& fs) {
    MF& m = fs.mf;
    if (m.type == TRAP) {
        if (x <= m.a || x >= m.d) return 0.0;
        if (x >= m.b && x <= m.c) return 1.0;
        if (x > m.a && x < m.b) return (x - m.a) / (m.b - m.a);
        if (x > m.c && x < m.d) return (m.d - x) / (m.d - m.c);
    } else if (m.type == TRI) {
        if (x <= m.a || x >= m.c) return 0.0;
        if (x == m.b) return 1.0;
        if (x > m.a && x < m.b) return (x - m.a) / (m.b - m.a);
        if (x > m.b && x < m.c) return (m.c - x) / (m.c - m.b);
    }
    return 0.0;
}

FuzzySet* getInputMF(const char* label, const char* variable) {
    if (strcmp(variable, "soil") == 0) {
        if (strcmp(label, "Dry") == 0)   return &soilDry;
        if (strcmp(label, "Moist") == 0) return &soilMoist;
        if (strcmp(label, "Wet") == 0)   return &soilWet;
    } else if (strcmp(variable, "hum") == 0) {
        if (strcmp(label, "Low") == 0)      return &humLow;
        if (strcmp(label, "Moderate") == 0) return &humMod;
        if (strcmp(label, "High") == 0)     return &humHigh;
    } else if (strcmp(variable, "temp") == 0) {
        if (strcmp(label, "Cold") == 0)     return &tempCold;
        if (strcmp(label, "Moderate") == 0) return &tempMod;
        if (strcmp(label, "Hot") == 0)      return &tempHot;
    }
    return nullptr;
}

FuzzySet* getOutputMF(const char* label) {
    if (strcmp(label, "Off") == 0)      return &outOff;
    if (strcmp(label, "Low") == 0)      return &outLow;
    if (strcmp(label, "Moderate") == 0) return &outModerate;
    if (strcmp(label, "High") == 0)     return &outHigh;
    return nullptr;
}

float defuzzifyCentroid(float* agg, float* zVals, int n) {
    float numerator = 0, denominator = 0;
    for (int i = 0; i < n; i++) {
        numerator += zVals[i] * agg[i];
        denominator += agg[i];
    }
    if (denominator == 0) return 0.0;
    return numerator / denominator;
}

float fuzzyInference(float soil, float hum, float temp) {
    const int N = 201; // 0 to 100 in 0.5 steps
    const float dz = 0.5;
    float zVals[N];
    float agg[N];
    for (int i = 0; i < N; i++) {
        zVals[i] = i * dz;
        agg[i] = 0.0;
    }

    for (int r = 0; r < 27; r++) {
        float muSoil = mfValue(soil, *getInputMF(rules[r][0], "soil"));
        float muHum  = mfValue(hum,  *getInputMF(rules[r][1], "hum"));
        float muTemp = mfValue(temp, *getInputMF(rules[r][2], "temp"));

        float firing = min(muSoil, min(muHum, muTemp));
        if (firing > 0.001) {
            FuzzySet* outMF = getOutputMF(rules[r][3]);
            for (int i = 0; i < N; i++) {
                float muOut = mfValue(zVals[i], *outMF);
                float clipped = min(muOut, firing);
                if (clipped > agg[i]) agg[i] = clipped;
            }
        }
    }
    return defuzzifyCentroid(agg, zVals, N);
}

// ===========================================
// MISTING ACTUATOR CONTROL
// ===========================================

#define MISTING_THRESHOLD 10.0

void controlMisting(float dutyCycle) {
    if (dutyCycle > MISTING_THRESHOLD) {
        RELAY.writeSingleCoil(RELAY_COIL_MISTING_PUMP1, true);
        relayState[RELAY_COIL_MISTING_PUMP1] = true;
        Serial.printf("[fuzzy] MISTING ON (duty: %.1f%%)\n", dutyCycle);
    } else {
        RELAY.writeSingleCoil(RELAY_COIL_MISTING_PUMP1, false);
        relayState[RELAY_COIL_MISTING_PUMP1] = false;
        Serial.printf("[fuzzy] MISTING OFF (duty: %.1f%%)\n", dutyCycle);
    }
}

// ===========================================
// SENSOR READING
// ===========================================

void readSoilSensor() {
    uint8_t result = THCPH.readHoldingRegisters(0x0000, 4);
    if (result == THCPH.ku8MBSuccess) {
        soilHumidity    = THCPH.getResponseBuffer(0x00) / 10.0f;
        soilTemperature = THCPH.getResponseBuffer(0x01) / 10.0f;
        soilEcRaw       = THCPH.getResponseBuffer(0x02);
        soilPh          = THCPH.getResponseBuffer(0x03) / 10.0f;
        soilReadOk = true;
        Serial.printf("[soil] T=%.1fC  H=%.1f%%  EC=%d  pH=%.1f\n",
                      soilTemperature, soilHumidity, soilEcRaw, soilPh);
    } else {
        soilReadOk = false;
        Serial.printf("[soil] Modbus FAILED (code=%d)\n", result);
    }
}

void readEnvSensor() {
    uint8_t result = TARH.readInputRegisters(0x0001, 2);
    if (result == TARH.ku8MBSuccess) {
        envTemperature = TARH.getResponseBuffer(0x00) / 10.0f;
        envHumidity    = TARH.getResponseBuffer(0x01) / 10.0f;
        envReadOk = true;
        Serial.printf("[env]  T=%.1fC  H=%.1f%%\n", envTemperature, envHumidity);
    } else {
        envReadOk = false;
        Serial.printf("[env]  Modbus FAILED (code=%d)\n", result);
    }
}

// ===========================================
// TELEMETRY PAYLOAD BUILDER
// ===========================================

void buildTelemetryPayload(char* payload, size_t maxlen, float mistingDuty) {
    StaticJsonDocument<512> doc;

    char isoTime[30];
    time_t now;
    time(&now);
    struct tm* t = localtime(&now);
    strftime(isoTime, sizeof(isoTime), "%Y-%m-%dT%H:%M:%S%z", t);
    doc["timestamp"] = isoTime;

    JsonObject env = doc.createNestedObject("environment");
    if (envReadOk) {
        env["temperature"] = roundTo1(envTemperature);
        env["humidity"]    = roundTo1(envHumidity);
    } else {
        env["temperature"] = 0.0;
        env["humidity"]    = 0.0;
    }

    JsonObject light = doc.createNestedObject("light");
    light["lux"] = 0;

    if (soilReadOk) {
        JsonArray soilArr = doc.createNestedArray("soil_sensors");
        JsonObject s1 = soilArr.createNestedObject();
        s1["slave_id"]    = "slave01";
        s1["temperature"] = roundTo1(soilTemperature);
        s1["humidity"]    = roundTo1(soilHumidity);
        s1["ph"]          = roundTo1(soilPh);
        s1["ec"]          = soilEcRaw / 1000.0;
    }

    JsonObject ctrl = doc.createNestedObject("control");
    ctrl["misting_duty"] = roundTo1(mistingDuty);
    ctrl["source"] = "fuzzy-logic";

    serializeJson(doc, payload, maxlen);
}

// ===========================================
// MQTT — PUBLISH WITH FAIL-SAFE ROUTING
// ===========================================

void publishTelemetryWithFailSafe(const char* payload) {
    if (WiFi.status() == WL_CONNECTED && mqtt.connected()) {
        if (mqtt.publish(CONFIG_MQTT_PUB_TELEMETRY, payload, false)) {
            Serial.println(F("[mqtt] Telemetry published to broker"));
            // Flush any buffered data from previous disconnections
            flushBuffer();
        } else {
            Serial.println(F("[mqtt] Publish failed, buffering to SD..."));
            saveToBuffer(payload);
        }
    } else {
        Serial.println(F("[mqtt] Offline — buffering to SD Card"));
        saveToBuffer(payload);
    }
}

// ===========================================
// MQTT — RECEIVE COMMANDS
// ===========================================

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
    char payloadStr[8];
    int copyLen = min((unsigned int)7, length);
    memcpy(payloadStr, payload, copyLen);
    payloadStr[copyLen] = '\0';
    int value = atoi(payloadStr);
    bool turnOn = (value != 0);

    Serial.printf("[mqtt] Command: %s = %s\n", topic, payloadStr);

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
        Serial.printf("[mqtt] Malformed topic (%d segments)\n", segCount);
        return;
    }

    int coilIndex = resolveCoilIndex(segments[3], segments[4]);
    if (coilIndex < 0) {
        Serial.printf("[mqtt] Unknown actuator: %s/%s\n", segments[3], segments[4]);
        return;
    }

    setRelay(coilIndex, turnOn);
}

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

void setRelay(int coilIndex, bool turnOn) {
    RELAY.writeSingleCoil(coilIndex, turnOn);
    relayState[coilIndex] = turnOn;

    const char* names[] = { "watering/valve1", "misting/pump1", "misting/pump2" };
    Serial.printf("[relay] %s → %s\n", names[coilIndex], turnOn ? "ON" : "OFF");

    lcd.setCursor(0, 1);
    lcd.printf("W:%s M1:%s M2:%s",
               relayState[RELAY_COIL_WATERING_VALVE1] ? "1" : "0",
               relayState[RELAY_COIL_MISTING_PUMP1]   ? "1" : "0",
               relayState[RELAY_COIL_MISTING_PUMP2]   ? "1" : "0");
}

// ===========================================
// WiFi CONNECTION
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
        if (attempts > 40) {
            Serial.println(F("\n[wifi] Timeout! Restarting..."));
            ESP.restart();
        }
    }
    Serial.printf("\n[wifi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP());
}

// ===========================================
// LCD
// ===========================================

void updateLcd() {
    lcd.clear();
    lcd.setCursor(0, 0);
    if (envReadOk) {
        lcd.printf("E:%.0fC %.0f%%", envTemperature, envHumidity);
    } else {
        lcd.print("E: -- err --");
    }
    if (soilReadOk) {
        lcd.setCursor(11, 0);
        lcd.printf("S:%.0f%%", soilHumidity);
    }
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
