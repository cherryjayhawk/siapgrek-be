// WiFi Network configuration
#define CONFIG_WIFI_SSID "WIFIQU"
#define CONFIG_WIFI_PASSWORD "1234567890"
// MQTT configuration
#define CONFIG_MQTT_HOST "10.54.243.164"
#define CONFIG_MQTT_PORT 1883
#define CONFIG_MQTT_ID "47448ed81"
#define CONFIG_MQTT_USER "orchid_device"
#define CONFIG_MQTT_PASS "Orchid2026"
#define CONFIG_MQTT_PUB "/orchid/node1/telemetry"
#define CONFIG_MQTT_SUB "/orchid/node1/command"
// Time zone and log interval configuration
#define CONFIG_TZdiff 7 //Timezone 0=UTC
#define CONFIG_TZname "WIB"
#define CONFIG_logIntervalMinute 1   // defaul 3 --> Log and Post data every 3 minute.
