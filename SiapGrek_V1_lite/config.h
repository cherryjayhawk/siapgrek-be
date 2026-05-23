// ===========================================
// SiapGrek IoT V1 — Configuration
// ===========================================

// --- WiFi ---
#define CONFIG_WIFI_SSID          "WIFIQU"
#define CONFIG_WIFI_PASSWORD      "1234567890"

// --- MQTT ---
// NOTE: Replace with your Docker host IP or domain (siapgrek.duckdns.org).
//       In a local dev setup, this is the machine running docker-compose.
#define CONFIG_MQTT_HOST          "13.250.42.198"
#define CONFIG_MQTT_PORT          1883
#define CONFIG_MQTT_USER          "orchid_device"
#define CONFIG_MQTT_PASS          "Orchid2026"
#define CONFIG_MQTT_CLIENT_ID     "siapgrek_node01"

// --- Device Identity ---
// This must match what the backend expects in topic paths
#define CONFIG_DEVICE_ID          "node01"

// --- MQTT Topic Patterns ---
// Publish:   orchid/{device_id}/telemetry
// Subscribe: orchid/{device_id}/command/+/+
#define CONFIG_MQTT_PUB_TELEMETRY "orchid/" CONFIG_DEVICE_ID "/telemetry"
#define CONFIG_MQTT_SUB_COMMAND   "orchid/" CONFIG_DEVICE_ID "/command/+/+"

// --- Modbus Slave Addresses ---
#define MODBUS_ADDR_RELAY         1   // 8-channel relay module
#define MODBUS_ADDR_THCPH         2   // Soil: Temperature, Humidity, Conductivity, pH
#define MODBUS_ADDR_TARH          3   // Environment: Temperature, Air Relative Humidity

// --- Relay Coil → Actuator Mapping ---
// These indices match the coil addresses on the relay module (0-based).
// The mapping defines which physical coil controls which logical actuator.
//
//  Coil 0 → watering/valve1    (Penyiraman - Valve 1)
//  Coil 1 → misting/pump1     (Misting - Pump 1)
//  Coil 2 → misting/pump2     (Misting - Pump 2)
#define RELAY_COIL_WATERING_VALVE1    0
#define RELAY_COIL_MISTING_PUMP1      1
#define RELAY_COIL_MISTING_PUMP2      2
#define RELAY_NUM_COILS               3

// --- Timing ---
#define CONFIG_TZ_OFFSET_HOURS    7         // UTC+7 (WIB)
#define CONFIG_TZ_NAME            "WIB"
#define CONFIG_TELEMETRY_INTERVAL_MS  60000 // Publish telemetry every 60 seconds
#define CONFIG_MQTT_RECONNECT_MS      5000  // Retry MQTT connection every 5 seconds
#define CONFIG_MODBUS_READ_DELAY_MS   1000  // Delay between Modbus reads for bus stability
#define CONFIG_LCD_SPLASH_MS          2000  // Splash screen display time
