#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
// #include <ESP32Ping.h>
#include "EspMQTTClient.h"
#include "RTClib.h"
#include <SdFat.h>
#include "SPI.h"
#include <ArduinoJson.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);
char buff[512];

#include <ModbusMaster.h>
ModbusMaster  PM_SEN, CH4_SEN, CO2_SEN, RELAY, THCPH, TARH;

#include "config.h"
// WiFi network configuration
const char* ssid = CONFIG_WIFI_SSID;
const char* password = CONFIG_WIFI_PASSWORD;
// MQTT configuration
const char* mqtt_host = CONFIG_MQTT_HOST;
const long mqtt_port = CONFIG_MQTT_PORT;
const char* mqtt_id = CONFIG_MQTT_ID;
const char* mqtt_user = CONFIG_MQTT_USER;
const char* mqtt_pass = CONFIG_MQTT_PASS;
const char* mqtt_pub = CONFIG_MQTT_PUB;
const char* mqtt_sub = CONFIG_MQTT_SUB;
// Time zone and log interval configuration
const int TZdiff = CONFIG_TZdiff;
const char* TZname = CONFIG_TZname;
const unsigned int  postingIntervalMinute = CONFIG_logIntervalMinute;

// Global variables
long lastUpdateTime = 0;
int nowYear = 0;
int nowMonth = 0;
int oldDay = 0;
int oldSecond = 0;
int nowDay = 0;
int nowHour = 0;
int nowMinute = 0;
int dayMinute = 0;
int lastMenit = 0;
int nowSecond = 0;
bool netEn = false;
bool ntpEn = false;
bool sdEn = true;

int intVal, PM25, PM10, CH4, CO2 = 0;

float HU_GH, TA_GH, HU_SO, TA_SO, PH_SO = 0.0;
int EC_SO = 0;

float HU, TA, PH = 0.0;
int EC = 0;

const int digOut = 32;
const int digIn  = 33;
int buttonState;
int buttonValue = 0;

WiFiClient client;
EspMQTTClient MQTTclient;
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP);
RTC_DS3231 rtc;
SdFat sd;
StaticJsonDocument<1024> doc;

void onConnectionEstablished()
{
  MQTTclient.subscribe(mqtt_sub, [](const String & payload) {
    lcd.setCursor(0, 0);
    lcd.print(" MQTT Subscribe ");
    lcd.setCursor(0, 1);
    sprintf(buff, "%04d/%02d/%02d %02d:%02d:%02d %s, ", nowYear, nowMonth, nowDay, nowHour, nowMinute, nowSecond, TZname);
    Serial.print(buff);
    if (payload == "1") {
      lcd.print("Relay turned on ");
      digitalWrite(digOut, HIGH);
      MQTTclient.publish("status", payload, true);
      Serial.println(F("MQTT Subscribe >> Relay turned on"));
    }
    else if (payload == "0") {
      lcd.print("Relay turned off");
      digitalWrite(digOut, LOW);
      MQTTclient.publish("status", payload, true);
      Serial.println(F("MQTT Subscribe >> Relay turned off"));
    }
  });
}

void setup() {
  Serial.begin(9600);
  Serial2.begin(9600);
  RELAY.begin(1, Serial2);
  THCPH.begin(2, Serial2);
  TARH.begin(3, Serial2);
  PM_SEN.begin(6, Serial2);
  CH4_SEN.begin(7, Serial2);
  CO2_SEN.begin(8, Serial2);

  pinMode(digOut, OUTPUT);
  digitalWrite(digOut, LOW);

  lcd.init();
  lcd.clear();
  lcd.backlight();
  lcd.setCursor(0, 0); 
  lcd.print("SiapGrek IoT V.1");
  lcd.setCursor(0, 1);  
  lcd.print(" BRIN-TelU 2026 ");
  delay(1000);
  Serial.println(F(""));
  Serial.println(F("========================================"));
  Serial.println(F("         SiapGrek IoT V1.0 2026         "));
  Serial.println(F("========================================"));

  if (! rtc.begin()) {
    lcd.setCursor(0, 0);
    lcd.print("RTC error!      ");
    lcd.setCursor(0, 1);
    lcd.print("Contact vendor  ");
    Serial.println(F("RTC error!, please contact vendor"));
    while (1) delay(10);
  }

  if (!sd.begin(5, SD_SCK_MHZ(10))) {
    sdEn = false;    
  }

  if (!sdEn) {
    lcd.setCursor(0, 0);
    lcd.print("SD Card failed! ");
    lcd.setCursor(0, 1);
    lcd.print("Logging disable ");
    Serial.println(F("SdCard failed!, logging disable"));
    delay(1000);
  }

  delay(1000);
  connectWifi();
  pinMode(digIn, INPUT_PULLUP);

  DateTime now = rtc.now();
  oldDay = now.day();
  oldSecond = now.second();

  RELAY.setTransmitBuffer(0, 0b00000000);

}

void loop() {
  DateTime now = rtc.now();
  nowYear = now.year();
  nowMonth = now.month();
  nowDay = now.day();
  nowHour = now.hour();
  nowMinute =  now.minute();
  nowSecond =  now.second();

  if (oldDay != nowDay) {
    lcd.setCursor(0, 1);
    lcd.print("--Daily reboot--");
    delay(3000);
    ESP.restart();
  }

  uint8_t result;
  HU_GH, TA_GH, HU_SO, TA_SO, PH_SO = 0.0;
  EC_SO = 0;

  result = THCPH.readHoldingRegisters(0x0000, 4);
  if (result == THCPH.ku8MBSuccess)
  {
    HU_SO = THCPH.getResponseBuffer(0x00) / 10.0f;
    TA_SO = THCPH.getResponseBuffer(0x01) / 10.0f;
    EC_SO = THCPH.getResponseBuffer(0x02);
    PH_SO = THCPH.getResponseBuffer(0x03) / 10.0f;
    lcd.print("Sensor 1A >> OK ");
  } else {lcd.print("Sensor 1A >> BAD");}

  sprintf(buff, "SENSOR Tanah, HU %.1f, TA %.1f, EC %d, PH %.1f", HU_SO, TA_SO, EC_SO, PH_SO);
  Serial.println(buff);

  delay(1000);

  result = TARH.readInputRegisters(0x0001, 2);
  if (result == TARH.ku8MBSuccess)
  {
    TA_GH = TARH.getResponseBuffer(0x00) / 10.0f;
    HU_GH = TARH.getResponseBuffer(0x01) / 10.0f;   
    lcd.print("Sensor 1A >> OK ");
  } else {lcd.print("Sensor 1A >> BAD");}

  sprintf(buff, "SENSOR Udara, TA %.1f, RH %.1f", TA_GH, HU_GH);
  Serial.println(buff);

  delay(1000);
  RELAY.writeSingleCoil(0, true);
  delay(500);
  RELAY.writeSingleCoil(1, true);
  delay(500);


  /*

  if (oldSecond != nowSecond) {
    sprintf(buff, "%04d/%02d/%02d %02d:%02d:%02d %s, ", nowYear, nowMonth, nowDay, nowHour, nowMinute, nowSecond, TZname);
    Serial.print(buff);
    sprintf(buff, "Temp(⁰C)=%04.1f, Humi(%%)=%04.1f, PM2.5(ug/m3)=%04d, PM10(ug/m3)=%04d, CH4(%%LEL)=%03d, CO2(ppm)=%04d", TA, HU, PM25, PM10, CH4, CO2);
    Serial.println(buff);
    oldSecond = nowSecond;
  }

  if (nowMinute % postingIntervalMinute == 0 && nowSecond <= 5) {
    lcd.setCursor(0, 0);
    sprintf(buff, " %02d/%02d/%02d %02d:%02d ", nowYear - 2000, nowMonth, nowDay, nowHour, nowMinute);
    lcd.print(buff);

    sprintf(buff, "%04d/%02d/%02d %02d:%02d:%02d %s, ", nowYear, nowMonth, nowDay, nowHour, nowMinute, nowSecond, TZname);
    Serial.print(buff);

    lcd.setCursor(0, 1);
    if (sdEn) {
      lcd.print(" Log to SD Card ");
      sprintf(buff, "/%04d%02d%02d.csv", nowYear, nowMonth, nowDay);
      Serial.print(F("Log data to SD Card >> "));
      Serial.println(buff);
      logData(buff);
    }
    else {
      lcd.print("Logging disable!");
      Serial.println(F("Log data to SD Card >> disable!"));
    }
    delay(1000);

    doc.clear();
    JsonArray sensorDatas = doc.createNestedArray("sensorDatas");

    JsonObject s1 = sensorDatas.createNestedObject(); // Kecepatan Angin
    s1["flag"] = "REG20003";
    s1["value"] = 0;

    JsonObject s2 = sensorDatas.createNestedObject(); // Arah Angin
    s2["flag"] = "REG20009";
    s2["value"] = 0;

    JsonObject s3 = sensorDatas.createNestedObject(); // Temperatur Udara
    s3["flag"] = "REG20015";
    s3["value"] = TA;

    JsonObject s4 = sensorDatas.createNestedObject(); // Kelembaban Udara
    s4["flag"] = "REG20021";
    s4["value"] = HU;

    JsonObject s5 = sensorDatas.createNestedObject(); // Intensitas Matahari
    s5["flag"] = "REG20027";
    s5["value"] = 0;

    JsonObject s6 = sensorDatas.createNestedObject(); // Curah Hujan
    s6["flag"] = "REG20033";
    s6["value"] = 0;

    JsonObject s7 = sensorDatas.createNestedObject(); // PM2.5
    s7["flag"] = "REG20039";
    s7["value"] = PM25;

    JsonObject s8 = sensorDatas.createNestedObject(); // PM10
    s8["flag"] = "REG20045";
    s8["value"] = PM10;

    JsonObject s9 = sensorDatas.createNestedObject(); // CH4
    s9["flag"] = "REG20051";
    s9["value"] = CH4;

    JsonObject s10 = sensorDatas.createNestedObject(); // CO2
    s10["flag"] = "REG20057";
    s10["value"] = CO2;

    JsonObject s11 = sensorDatas.createNestedObject();
    s11["flag"] = "REG20063";
    s11["value"] = 0;

    JsonObject s12 = sensorDatas.createNestedObject();
    s12["flag"] = "REG20069";
    s12["value"] = 0;

    JsonObject s13 = sensorDatas.createNestedObject();
    s13["flag"] = "REG20075";
    s13["value"] = 0;

    long epochTime = now.unixtime();
    String epochString = String((long)epochTime);
    doc["sensorDatas"];
    doc["time"] = epochString;

    //serializeJson(doc, Serial);
    //Serial.println("");

    serializeJson(doc, buff);
    sendData();
  }

  buttonState = digitalRead(digIn);
  if (buttonState == LOW) {
    buttonValue ++;
    if (buttonValue > 6) (buttonValue = 0);
    delay(500);
  }
  buttonMode();
  MQTTclient.loop();
  */
}

double round2(double value) {
  return (int)(value * 100 + 0.5) / 100.0;
}

void buttonMode() {
  switch (buttonValue) {
    case 0: {
        lcd.setCursor(0, 0);
        lcd.print("  PM2.5   PM10  ");
        lcd.setCursor(0, 1);
        sprintf(buff, "  %04d    %04d  ", PM25, PM10);
        lcd.print(buff);
      }
      break;
    case 2: {
        lcd.setCursor(0, 0);
        lcd.print("   CH4    CO2   ");
        lcd.setCursor(0, 1);
        sprintf(buff, "   %03d    %04d  ", CH4, CO2);
        lcd.print(buff);
      }
      break;
    case 3: {
        lcd.setCursor(0, 0);
        lcd.print("  TEMP    HUMI  ");
        lcd.setCursor(0, 1);
        sprintf(buff, "  %04.1f    %04.1f  ", TA, HU);
        lcd.print(buff);
      }
      break;
    case 4: {
        sprintf(buff, "   %04d/%02d/%02d   ", nowYear, nowMonth, nowDay);
        lcd.setCursor(0, 0);
        lcd.print(buff);
        sprintf(buff, "  %02d:%02d:%02d %s  ", nowHour, nowMinute, nowSecond, TZname);
        lcd.setCursor(0, 1);
        lcd.print(buff);
      }
      break;
    case 5: {
        lcd.setCursor(0, 0);
        if (!sdEn) {
          lcd.print("SD Card disable!");
        }
        else {
          lcd.print("SD Card enable  ");
        }

        lcd.setCursor(0, 1);
        if (!netEn) {
          lcd.print("Internet disable!");
        }
        else {
          lcd.print("Internet enable  ");
        }
      }
      break;
    case 6: {
        lcd.setCursor(0, 0);
        lcd.print("                 ");
        lcd.setCursor(0, 0);
        sprintf(buff, "SSID:%s", ssid);
        lcd.print(buff);
        lcd.setCursor(0, 1);
        lcd.print("IP:              ");
        lcd.setCursor(3, 1);
        lcd.print(WiFi.localIP());
      }
      break;
  }
}

void dateTime(uint16_t* date, uint16_t* time) {
  DateTime now = rtc.now();
  *date = FAT_DATE(now.year(), now.month(), now.day());
  *time = FAT_TIME(now.hour(), now.minute(), now.second());
}

void logData(const char *fname) {
  SdFile::dateTimeCallback(dateTime);
  FsFile myFile = sd.open(fname, O_WRITE | O_CREAT | O_APPEND);
  if (myFile)
  {
    if (myFile.fileSize() == 0)
    {
      myFile.println("HH;MM;SS;TEMP;HUMI;PM2.5;PM10;CO2;CH4");
    }
    sprintf(buff, "%02d;%02d;%02d;%04.1f;%04.1f;%04d;%04d;%04d;%03d;", nowHour, nowMinute, nowSecond, TA, HU, PM25, PM10, CO2, CH4);
    myFile.println(buff);
    myFile.close();
  }
  else
  {
    Serial.println("Failed to open log file!");
  }
}

void sendData() {
  if (!netEn) {
    connectWifi();
  } else {
    netEn = false;
    netEn = Ping.ping("www.google.com");
    if (netEn) {
      // Publish MQTT
      if (MQTTclient.isConnected()) {
        Serial.println(F("Publish data to MQTT Broker"));
        lcd.setCursor(0, 1);
        //lcd.print("Log data to MQTT");
        lcd.print("  Publish MQTT  ");
        MQTTclient.publish(mqtt_pub, buff, true);
        delay(1000);
      }
    }
  }
}

void connectWifi() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi ");
  lcd.setCursor(0, 1);
  sprintf(buff, "SSID:%s", ssid);
  lcd.print(buff);
  sprintf(buff, "\nConnecting to WiFi SSID:%s, please wait", ssid);
  Serial.println(buff);
  delay(1000);
  int maxConnecting = 0;
  while (WiFi.status() != WL_CONNECTED) {
    maxConnecting++;
    WiFi.begin(ssid, password);
    if (maxConnecting > 5) {
      lcd.setCursor(0, 0);
      lcd.print("timeout!        ");
      delay(1000);
      break;
    }
    delay(2500);
  }
  lcd.setCursor(0, 0);
  lcd.print("                ");
  lcd.setCursor(0, 0);
  lcd.print(WiFi.localIP());
  Serial.print(F("IP address "));
  Serial.println(WiFi.localIP());
  netEn = Ping.ping("www.google.com");
  if (!netEn) {
    lcd.setCursor(0, 1);
    lcd.print("Internet disable!");
    Serial.println(F("Internet is currently unavailable!"));
    delay(1000);
    lcd.clear();
  }
  else {
    //MQTTclient.enableDebuggingMessages();
    MQTTclient.setMaxPacketSize(512);
    MQTTclient.setWifiCredentials(ssid, password);
    MQTTclient.setMqttClientName(mqtt_id);
    MQTTclient.setMqttServer(mqtt_host, mqtt_user, mqtt_pass, mqtt_port);
    if (!ntpEn) {
      timeClient.begin();
      timeClient.setTimeOffset(TZdiff * 3600);
      while (!timeClient.update()) {
        timeClient.forceUpdate();
      }
      String formattedDate = timeClient.getFormattedDate();
      int splitT = formattedDate.indexOf("T");
      String dayStamp = formattedDate.substring(0, splitT);
      int xyear  = dayStamp.substring(0, 4).toInt();
      int xmonth = dayStamp.substring(5, 7).toInt();
      int xday   = dayStamp.substring(8, 10).toInt();
      rtc.adjust(DateTime(xyear, xmonth, xday, timeClient.getHours(), timeClient.getMinutes(), timeClient.getSeconds()));
      timeClient.end();
      ntpEn = true;
    }
  }
}
