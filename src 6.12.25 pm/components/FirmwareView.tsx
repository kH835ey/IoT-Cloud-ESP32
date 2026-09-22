import React, { useState, useEffect, useRef } from 'react';
import { IoTDevice } from '../types';
import {
  Code2,
  Copy,
  Check,
  Download,
  Terminal,
  Cpu,
  Wifi,
  Sparkles,
  BookOpen,
  Info,
  CheckCircle2,
  Settings,
  HelpCircle,
  Play,
  Layers,
  Sliders,
  KeyRound,
  FileCode,
  Radio,
  Send,
  MessageSquare,
  Bot,
  BellRing,
  ExternalLink,
  ShieldAlert,
  Save,
  RotateCcw,
  Power,
  Flame,
  Lightbulb,
  Zap,
  Globe,
  Smartphone,
  Laptop,
  Usb,
  AlertTriangle,
  RefreshCw,
  Edit3
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FirmwareViewProps {
  device: IoTDevice | null;
  lang: 'km' | 'en';
}

export const FirmwareView: React.FC<FirmwareViewProps> = ({ device, lang }) => {
  const [boardType, setBoardType] = useState<
    'esp32_cam' | 'esp32_blynk_lib' | 'esp32_standard' | 'esp8266_nodemcu' | 'esp32_c3' | 'arduino_uno_wifi'
  >('esp32_cam');
  
  // Load saved configuration from localStorage
  const getStored = (key: string, fallback: string) => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key) || fallback;
    }
    return fallback;
  };

  // Blynk Credentials
  const [blynkTemplateId, setBlynkTemplateId] = useState(
    () => getStored('sps_peh_template_id', device?.templateId || 'TMPL_SMART_LAMP_MQ135')
  );
  const [blynkTemplateName, setBlynkTemplateName] = useState(
    () => getStored('sps_peh_template_name', device?.name || 'Smart_Lamp & MQ135')
  );
  const [blynkAuthToken, setBlynkAuthToken] = useState(
    () => getStored('sps_peh_auth_token', device?.authToken || 'YFr7r30K8HV8rRQ7x59hYojzeU0m9wYs')
  );

  // Telegram Credentials
  const [telegramBotToken, setTelegramBotToken] = useState(
    () => getStored('sps_peh_telegram_bot_token', '8928313450:AAEvmTZMGGDXRJZ-W1ZuE2vc5AlVSQ5oDbY')
  );
  const [telegramChatId, setTelegramChatId] = useState(
    () => getStored('sps_peh_telegram_chat_id', '5780071626')
  );
  const [telegramTesting, setTelegramTesting] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);

  const [wifiSsid, setWifiSsid] = useState(
    () => getStored('sps_peh_wifi_ssid', 'SMART-WIFI-B339')
  );
  const [wifiPass, setWifiPass] = useState(
    () => getStored('sps_peh_wifi_pass', '5E85D60F')
  );
  const [serverUrl, setServerUrl] = useState(
    typeof window !== 'undefined' ? window.location.origin : 'https://your-app.run.app'
  );
  const [intervalMs, setIntervalMs] = useState(2000);
  const [lampPin, setLampPin] = useState(
    () => Number(getStored('sps_peh_lamp_pin', '12'))
  );
  const [mq135Pin, setMq135Pin] = useState(
    () => Number(getStored('sps_peh_mq135_pin', '14'))
  );
  const [relayActiveLow, setRelayActiveLow] = useState(true);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedDefines, setCopiedDefines] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'editor' | 'remote' | 'code' | 'telegram' | 'guide' | 'wiring' | 'api'>('editor');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Auto-save all configuration changes into localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sps_peh_template_id', blynkTemplateId);
      localStorage.setItem('sps_peh_template_name', blynkTemplateName);
      localStorage.setItem('sps_peh_auth_token', blynkAuthToken);
      localStorage.setItem('sps_peh_telegram_bot_token', telegramBotToken);
      localStorage.setItem('sps_peh_telegram_chat_id', telegramChatId);
      localStorage.setItem('sps_peh_wifi_ssid', wifiSsid);
      localStorage.setItem('sps_peh_wifi_pass', wifiPass);
      localStorage.setItem('sps_peh_lamp_pin', String(lampPin));
      localStorage.setItem('sps_peh_mq135_pin', String(mq135Pin));
    }
  }, [blynkTemplateId, blynkTemplateName, blynkAuthToken, telegramBotToken, telegramChatId, wifiSsid, wifiPass, lampPin, mq135Pin]);

  const triggerSaveNotification = (message: string) => {
    setSaveToast(message);
    setTimeout(() => {
      setSaveToast(null);
    }, 3000);
  };

  // --- LIVE IN-APP CODE EDITOR STATE ---
  const [customCode, setCustomCode] = useState<string>('');
  const [editorFontSize, setEditorFontSize] = useState<number>(13);
  const [codeSavedNotification, setCodeSavedNotification] = useState(false);
  const [editorTemplatePreset, setEditorTemplatePreset] = useState<
    'esp32_cam_smartlamp' | 'esp32_30pin_alert' | 'esp32_30pin_smartbin' | 'esp32_30pin_irrigation' | 'esp32_30pin_traffic' | 'esp32_direct_webserver' | 'esp32_school_lights'
  >('esp32_school_lights');

  // --- REMOTE CHIP CONTROLLER STATE ---
  const [remoteLampState, setRemoteLampState] = useState<number>(
    device?.pins.V0 ? Number(device.pins.V0.value) : 0
  );
  const [remoteFlashState, setRemoteFlashState] = useState<number>(0);
  const [remoteGasSimState, setRemoteGasSimState] = useState<number>(
    device?.pins.V1 ? Number(device.pins.V1.value) : 0
  );
  const [chipTargetIp, setChipTargetIp] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sps_peh_chip_ip') || device?.ipAddress || '192.168.0.169';
    }
    return device?.ipAddress || '192.168.0.169';
  });
  const [remoteDispatchMode, setRemoteDispatchMode] = useState<'blynk_cloud' | 'local_ip' | 'web_serial'>('blynk_cloud');
  const [remoteStatusMessage, setRemoteStatusMessage] = useState<string | null>(null);
  const [remoteDispatching, setRemoteDispatching] = useState<boolean>(false);

  // Web Serial API state
  const [serialPort, setSerialPort] = useState<any>(null);
  const [serialConnected, setSerialConnected] = useState<boolean>(false);
  const [serialLogs, setSerialLogs] = useState<string[]>([]);
  const [serialInput, setSerialInput] = useState<string>('');
  const serialReaderRef = useRef<any>(null);

  // Sync state if device props update
  useEffect(() => {
    if (device?.pins.V0 !== undefined) {
      setRemoteLampState(Number(device.pins.V0.value));
    }
    if (device?.pins.V1 !== undefined) {
      setRemoteGasSimState(Number(device.pins.V1.value));
    }
  }, [device]);

  // 1. ESP32-CAM AI-Thinker Code with Dual-Mode AP+STA + Captive Portal + Telegram
  const esp32CamSmartLampCode = `/*
 * ==============================================================================
 * Project: Smart_Lamp & MQ135 Air Sensor on ESP32-CAM (Dual-Mode AP+STA)
 * Hardware: ESP32-CAM (AI-Thinker)
 * Wi-Fi: AP (192.168.0.169) + STA (Router) + Captive Portal (Port 53)
 * Telegram Alerts: Enabled (Instant Alert on Lamp Toggle & MQ135 Gas Detection)
 * ==============================================================================
 */

// 1. Blynk Cloud Template Credentials (Must be at the very top)
#define BLYNK_TEMPLATE_ID    "${blynkTemplateId}"
#define BLYNK_TEMPLATE_NAME  "${blynkTemplateName}"
#define BLYNK_AUTH_TOKEN     "${blynkAuthToken}"

#define BLYNK_PRINT Serial
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <UrlEncode.h>
#include <BlynkSimpleEsp32.h>

// ---------------------- 2. WIFI CREDENTIALS & DUAL-MODE SETUP -----------------
const char* ap_ssid = "SmartLamp-ESP32CAM";
const char* ap_pass = "12345678";
IPAddress apIP(192, 168, 0, 169);
IPAddress netMsk(255, 255, 255, 0);

char ssid[] = "${wifiSsid}";
char pass[] = "${wifiPass}";

const char* TELEGRAM_BOT_TOKEN = "${telegramBotToken}";
const char* TELEGRAM_CHAT_ID   = "${telegramChatId}";

// ---------------------- 3. HARDWARE GPIO PIN DEFINITIONS ----------------------
#define SMART_LAMP_PIN       ${lampPin}   // GPIO ${lampPin} for Smart_Lamp Relay (V0)
#define MQ135_PIN            ${mq135Pin}   // GPIO ${mq135Pin} (Digital Input / DO) for MQ-135 (V1)
#define ONBOARD_FLASH_LED     4   // Built-in Flash LED on GPIO 4

WebServer server(80);
DNSServer dnsServer;
BlynkTimer timer;
bool lastAlarmSent = false;
unsigned long lastTgMsgTime = 0;
bool lampState = false;

// ---------------------- 4. TELEGRAM SENDER FUNCTION --------------------------
void sendTelegramAlert(String message) {
  if (WiFi.status() != WL_CONNECTED) return;
  WiFiClientSecure client;
  client.setInsecure(); // Skip SSL certificate check
  HTTPClient https;
  String url = "https://api.telegram.org/bot" + String(TELEGRAM_BOT_TOKEN) + 
               "/sendMessage?chat_id=" + String(TELEGRAM_CHAT_ID) + 
               "&text=" + urlEncode(message) + "&parse_mode=HTML";
  https.begin(client, url);
  https.GET();
  https.end();
}

// ---------------------- 5. HTTP WEB SERVER & CAPTIVE PORTAL ------------------
void handleRoot() {
  String html = "<!DOCTYPE html><html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>";
  html += "<title>ESP32-CAM Smart Lamp Dashboard</title>";
  html += "<style>body{font-family:sans-serif;background:#0f172a;color:#f8fafc;text-align:center;padding:25px;margin:0;}";
  html += ".card{background:#1e293b;border-radius:18px;padding:24px;max-width:440px;margin:auto;border:1px solid #334155;box-shadow:0 10px 25px rgba(0,0,0,0.5);}";
  html += ".btn{display:inline-block;padding:14px 28px;font-size:16px;font-weight:bold;color:#fff;border-radius:12px;text-decoration:none;margin:8px;border:none;cursor:pointer;}";
  html += ".btn-on{background:#10b981;} .btn-off{background:#ef4444;} .status-box{padding:12px;background:#0f172a;border-radius:10px;margin:15px 0;font-size:14px;}</style></head><body>";
  html += "<div class='card'>";
  html += "<h2 style='color:#38bdf8;margin-top:0;'>💡 SPS-PEH Smart Lamp & MQ135</h2>";
  html += "<p style='color:#94a3b8;font-size:13px;'>Dual-Mode: <b>AP (192.168.0.169)</b> + <b>STA Router</b></p>";
  html += "<div class='status-box'>";
  html += "<p style='margin:4px 0;'>Lamp Relay: " + String(lampState ? "<b style='color:#10b981'>ON (បើក)</b>" : "<b style='color:#ef4444'>OFF (បិទ)</b>") + "</p>";
  html += "<p style='margin:4px 0;'>MQ-135 Gas: " + String(digitalRead(MQ135_PIN) == LOW ? "<b style='color:#ef4444'>HAZARD ALERT</b>" : "<b style='color:#10b981'>NORMAL (SAFE)</b>") + "</p>";
  html += "<p style='margin:4px 0;'>WiFi Mode: <b>WIFI_AP_STA (Captive Portal 53)</b></p>";
  html += "</div>";
  html += "<a href='/on' class='btn btn-on'>💡 បើកភ្លើង (TURN ON)</a>";
  html += "<a href='/off' class='btn btn-off'>⭕ បិទភ្លើង (TURN OFF)</a>";
  html += "</div></body></html>";
  server.send(200, "text/html", html);
}

void handleControl() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  if (server.hasArg("val")) {
    int val = server.arg("val").toInt();
    lampState = (val == 1);
    digitalWrite(SMART_LAMP_PIN, ${relayActiveLow ? 'lampState ? LOW : HIGH' : 'lampState ? HIGH : LOW'});
    digitalWrite(ONBOARD_FLASH_LED, lampState ? HIGH : LOW);
    Blynk.virtualWrite(V0, val);
    server.send(200, "application/json", "{\\"success\\":true,\\"lamp\\":" + String(val) + "}");
    return;
  }
  server.send(400, "text/plain", "Missing val parameter");
}

void handleOn() {
  lampState = true;
  digitalWrite(SMART_LAMP_PIN, ${relayActiveLow ? 'LOW' : 'HIGH'});
  digitalWrite(ONBOARD_FLASH_LED, HIGH);
  Blynk.virtualWrite(V0, 1);
  sendTelegramAlert("💡 <b>[ESP32-CAM Smart_Lamp]</b> កុងតាក់ត្រូវបានបើក (ON) ✅");
  handleRoot();
}

void handleOff() {
  lampState = false;
  digitalWrite(SMART_LAMP_PIN, ${relayActiveLow ? 'HIGH' : 'LOW'});
  digitalWrite(ONBOARD_FLASH_LED, LOW);
  Blynk.virtualWrite(V0, 0);
  sendTelegramAlert("💡 <b>[ESP32-CAM Smart_Lamp]</b> កុងតាក់ត្រូវបានបិទ (OFF) ⭕");
  handleRoot();
}

void handleStatus() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String json = "{\\"status\\":\\"online\\",\\"device\\":\\"SmartLamp-ESP32CAM\\",\\"mode\\":\\"WIFI_AP_STA\\",";
  json += "\\"ap_ip\\":\\"" + WiFi.softAPIP().toString() + "\\",";
  json += "\\"sta_ip\\":\\"" + WiFi.localIP().toString() + "\\",";
  json += "\\"lamp\\":" + String(lampState ? 1 : 0) + ",";
  json += "\\"mq135\\":" + String(digitalRead(MQ135_PIN) == LOW ? 1 : 0) + ",";
  json += "\\"rssi\\":" + String(WiFi.RSSI()) + "}";
  server.send(200, "application/json", json);
}

// ---------------------- 6. BLYNK VIRTUAL PIN LISTENERS -----------------------
BLYNK_WRITE(V0) {
  int val = param.asInt();
  lampState = (val == 1);
  digitalWrite(SMART_LAMP_PIN, ${relayActiveLow ? 'lampState ? LOW : HIGH' : 'lampState ? HIGH : LOW'});
  digitalWrite(ONBOARD_FLASH_LED, lampState ? HIGH : LOW);
  String statusMsg = lampState 
    ? "💡 <b>[ESP32-CAM Smart_Lamp]</b> កុងតាក់ត្រូវបានបើក (ON) ✅"
    : "💡 <b>[ESP32-CAM Smart_Lamp]</b> កុងតាក់ត្រូវបានបិទ (OFF) ⭕";
  sendTelegramAlert(statusMsg);
}

// ---------------------- 7. SENSOR TELEMETRY & ALARM SENDER -------------------
void sendMQ135Telemetry() {
  int gasDigital = digitalRead(MQ135_PIN);
  bool isGasAlert = (gasDigital == LOW);
  Blynk.virtualWrite(V1, isGasAlert ? 1 : 0);
  Blynk.virtualWrite(V8, WiFi.RSSI());

  if (isGasAlert) {
    if (!lastAlarmSent || (millis() - lastTgMsgTime > 60000)) {
      lastAlarmSent = true;
      lastTgMsgTime = millis();
      sendTelegramAlert("⚠️ <b>[ESP32-CAM MQ-135 អាសន្នផ្សែងពុល]</b>\\n🚨 រកឃើញមានផ្សែងពុល!\\n📍 ESP32-CAM Pin ${mq135Pin}");
    }
  } else {
    if (lastAlarmSent) {
      lastAlarmSent = false;
      sendTelegramAlert("✅ <b>[ESP32-CAM MQ-135 សុវត្ថិភាពឡើងវិញ]</b>\\n🌿 កម្រិតខ្យល់មានសុវត្ថិភាព!");
    }
  }
}

// ---------------------- 8. SETUP ---------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(SMART_LAMP_PIN, OUTPUT);
  pinMode(MQ135_PIN, INPUT_PULLUP);
  pinMode(ONBOARD_FLASH_LED, OUTPUT);
  digitalWrite(SMART_LAMP_PIN, ${relayActiveLow ? 'HIGH' : 'LOW'});
  digitalWrite(ONBOARD_FLASH_LED, LOW);

  // 1. Dual-Mode Wi-Fi Architecture (WIFI_AP_STA)
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAPConfig(apIP, apIP, netMsk);
  WiFi.softAP(ap_ssid, ap_pass);
  Serial.println("[Wi-Fi] AP Mode Created: " + String(ap_ssid) + " (IP: " + WiFi.softAPIP().toString() + ")");

  // 2. Start Captive Portal DNS Server on Port 53
  dnsServer.start(53, "*", apIP);

  // 3. Connect to Home Router Wi-Fi & Blynk Cloud
  Blynk.begin(BLYNK_AUTH_TOKEN, ssid, pass);

  // 4. Register HTTP Web Server Endpoints
  server.on("/", handleRoot);
  server.on("/control", handleControl);
  server.on("/status", handleStatus);
  server.on("/on", handleOn);
  server.on("/off", handleOff);
  server.onNotFound([]() {
    server.sendHeader("Location", "http://192.168.0.169/", true);
    server.send(302, "text/plain", "Redirecting to Captive Portal");
  });
  server.begin();

  sendTelegramAlert("🚀 <b>[ESP32-CAM]</b> Dual-Mode AP+STA + Captive Portal ដំណើរការជោគជ័យ! ✅\\nIP: 192.168.0.169");
  timer.setInterval(${intervalMs}L, sendMQ135Telemetry);
}

// ---------------------- 9. MAIN LOOP -----------------------------------------
void loop() {
  dnsServer.processNextRequest(); // Handle Captive Portal Redirects
  server.handleClient();          // Handle Direct Web Server Requests
  Blynk.run();                    // Sync with Blynk Cloud
  timer.run();
}
`;

  // 2. Device 1: Alert System (ESP32 30-Pin)
  const esp32AlertSystemCode = `/**********************************************************************************
 * ==============================================================================
 * Smart Environmental Monitoring, Web Dashboard & GSM Alert System
 * Hardware: ESP32 30-Pin (WROOM-32D)
 * Sensors: Ultrasonic (HC-SR04), MQ7 (CO), MQ135 (Air Quality), BMP180
 * Peripherals: SIM900A GSM Module, Buzzer, Red LED
 * ================================== Early Warning System IP ============================================
 **********************************************************************************/

#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <Wire.h>
#include <Adafruit_BMP085.h>
#include <NewPing.h>
#include <UniversalTelegramBot.h>

// Hardware Pin Definitions
#define BUZZER_PIN        19
#define LED_RED_PIN       2
#define TRIG_PIN          5
#define ECHO_PIN          18
#define MQ7_PIN           34  // Analog CO Sensor
#define MQ135_PIN         35  // Analog Air Quality Sensor

// GSM SIM900A Pin Setup (HardwareSerial2)
#define SIM900_RX         16
#define SIM900_TX         17
#define PHONE_NUMBER      "+85593586803"

#define MAX_DISTANCE      400

NewPing sonar(TRIG_PIN, ECHO_PIN, MAX_DISTANCE);
Adafruit_BMP085 bmp;
bool bmpStatus = false;

// Wi-Fi & Telegram Config
const char* ap_ssid       = "Smart Early Warning Sytem ESP32";
const char* ap_password   = "12345678";        
const char* wifi_ssid     = "${wifiSsid || "SPS-PDH"}"; 
const char* wifi_password = "${wifiPass || "SPS@pdh2025"}";

#define BOT_TOKEN "${telegramBotToken || "8928313450:AAEvmTZMGGDXRJZ-W1ZuE2vc5AlVSQ5oDbY"}"
#define CHAT_ID   "${telegramChatId || "5780071626"}"

WiFiClientSecure secClient;
UniversalTelegramBot bot(BOT_TOKEN, secClient);

// Local AP Config (រក្សាទុក 192.168.4.44 សម្រាប់ភ្ជាប់ទូរស័ព្ទដៃផ្ទាល់)
IPAddress ap_local_ip(192, 168, 4, 44);
IPAddress ap_gateway(192, 168, 4, 44);
IPAddress ap_subnet(255, 255, 255, 0);

const byte DNS_PORT = 53;
DNSServer dnsServer;
WebServer server(80);

// Global Variables & Timing Control
bool wifiConnected = false;
unsigned long lastAlertTime      = 0;
unsigned long lastLowAlertTime   = 0;
unsigned long lastGasWarningTime = 0;
unsigned long lastMqWarningTime  = 0;
unsigned long lastHighAlertTime  = 0;
unsigned long lastSensorProcess  = 0;

// Call & Emergency Sequence State Variables
int callStage                    = 0;     // 0 = idle, 1 = called 1st time, 2 = called 2nd time
unsigned long lastCallAttempt    = 0;
bool isWaterEmergencyActive      = false;

// Non-blocking Alert Variables & Manual Controls
unsigned long lastBlinkTime      = 0;
bool alertState                  = false;
int currentAlertMode             = 0;     // 0 = Off, 1 = Standard (500ms), 2 = Fast (250ms)
bool manualBuzzerState           = false; // Manual control toggle

// Dashboard Web UI with Real-time Gauges, Waves & Control Center
const char HTML_CONTENT[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="km">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Smart Alert System Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Battambang:wght@400;700;900&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Battambang', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        body { background-color: #f1f5f9; display: flex; flex-direction: column; align-items: center; min-height: 100vh; padding: 20px; gap: 20px; color: #1e293b; }
        .main-title { font-size: 26px; font-weight: 900; color: #0f172a; margin-top: 10px; text-align: center; }
        .sub-title { font-size: 14px; font-weight: 700; color: #64748b; text-align: center; }
        .mode-badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 800; }
        .mode-online { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
        .mode-offline { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }

        .grid-container { display: flex; flex-wrap: wrap; gap: 20px; max-width: 1100px; width: 100%; justify-content: center; }
        
        .card { background: #ffffff; border-radius: 20px; padding: 20px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); flex: 1 1 240px; max-width: 260px; display: flex; flex-direction: column; align-items: center; justify-content: space-between; border: 1px solid #e2e8f0; }
        .card-header { display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 10px; }
        .card-title { font-size: 15px; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 6px; }
        .status-badge { font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 10px; text-transform: uppercase; }
        .badge-danger { background: #fee2e2; color: #ef4444; border: 1px solid #fca5a5; }
        .badge-warning { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
        .badge-success { background: #dcfce7; color: #22c55e; border: 1px solid #86efac; }
        .badge-info { background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd; }

        .gauge-container { position: relative; width: 180px; height: 100px; margin-top: 10px; }
        .gauge-bg { fill: none; stroke: #e2e8f0; stroke-width: 16; stroke-linecap: round; }
        .gauge-fill { fill: none; stroke-width: 16; stroke-linecap: round; stroke-dasharray: 251.2; stroke-dashoffset: 251.2; transition: stroke-dashoffset 0.8s ease; }
        .gauge-value { position: absolute; bottom: 5px; width: 100%; text-align: center; font-size: 22px; font-weight: 800; color: #0f172a; font-family: 'Segoe UI', sans-serif; }
        .gauge-value span { font-size: 13px; font-weight: 700; color: #64748b; }
        .gauge-labels { display: flex; justify-content: space-between; width: 180px; font-size: 11px; color: #94a3b8; font-weight: 700; font-family: 'Segoe UI', sans-serif; }

        .water-card-container { background: #ffffff; border-radius: 24px; padding: 20px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); flex: 1 1 280px; max-width: 320px; width: 100%; border: 1px solid #e2e8f0; }
        .tank-wrapper { position: relative; width: 100%; height: 320px; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 30px; overflow: hidden; margin-top: 15px; display: flex; flex-direction: column; justify-content: space-between; }
        
        .sensor-icon-container { display: flex; justify-content: center; width: 100%; margin-top: 12px; z-index: 10; }
        .ultrasonic-sensor-hardware { background: #1a1d24; width: 100px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: space-evenly; padding: 0 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.25); border: 1px solid #334155; }
        .sensor-eye { width: 30px; height: 30px; background: radial-gradient(circle, #22252a 40%, #000000 90%); border-radius: 50%; border: 2px solid #333740; box-shadow: inset 0 0 4px rgba(0,0,0,0.8); }

        .tank-levels { position: absolute; top: 0; left: 15px; bottom: 0; display: flex; flex-direction: column; justify-content: space-between; padding: 25px 0; font-size: 12px; font-weight: 700; color: #94a3b8; z-index: 5; pointer-events: none; }
        .percentage-box { position: absolute; top: 45%; left: 50%; transform: translate(-50%, -50%); background: #ffffff; padding: 12px 28px; border-radius: 16px; box-shadow: 0 10px 20px rgba(0, 0, 0, 0.06); font-size: 32px; font-weight: 800; color: #0f172a; z-index: 10; border: 1px solid #f1f5f9; font-family: 'Segoe UI', sans-serif; }

        .ocean-container { position: absolute; bottom: 0; left: 0; width: 100%; height: 0%; background: linear-gradient(180deg, #38bdf8 0%, #0284c7 50%, #0369a1 100%); transition: height 0.8s ease-in-out; z-index: 2; }
        .wave { position: absolute; top: -12px; left: 0; width: 200%; height: 15px; background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M0,0 C150,90 350,-40 500,40 C650,120 900,10 1200,40 L1200,120 L0,120 Z" fill="%2338bdf8"></path></svg>'); background-size: 50% 100%; animation: wave-anim 3s linear infinite; }
        
        @keyframes wave-anim {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }

        /* Interactive Control Panel Styles */
        .controls-section { max-width: 1100px; width: 100%; background: white; border-radius: 24px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .controls-title { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .controls-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
        .btn-ctrl { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 14px 20px; border-radius: 16px; font-size: 15px; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s ease; }
        .btn-ctrl:active { transform: scale(0.97); }
        .btn-danger { background: #ef4444; color: white; box-shadow: 0 4px 12px rgba(239,68,68,0.3); }
        .btn-danger:hover { background: #dc2626; }
        .btn-primary { background: #3b82f6; color: white; box-shadow: 0 4px 12px rgba(59,130,246,0.3); }
        .btn-primary:hover { background: #2563eb; }
        .btn-outline { background: #f8fafc; color: #334155; border: 2px solid #e2e8f0; }
        .btn-outline:hover { background: #f1f5f9; border-color: #cbd5e1; }
        .btn-outline.active { background: #fee2e2; border-color: #ef4444; color: #b91c1c; }
    </style>
</head>
<body>
    <div>
        <div class="main-title">ប្រព័ន្ធផ្តល់សញ្ញាអាសន្ន (Alert System)</div>
        <div class="sub-title">Smart Environmental Monitoring & GSM Early Warning System</div>
        <div style="text-align: center; margin-top: 8px;">
            <span id="mode-badge" class="mode-badge mode-offline">កំពុងពិនិត្យ Mode...</span>
        </div>
    </div>

    <div class="grid-container">
        
        <div class="card">
            <div class="card-header">
                <div><div class="card-title">CO Gas Level</div></div>
                <span id="badge-co" class="status-badge badge-success">NORMAL</span>
            </div>
            <div class="gauge-container">
                <svg width="180" height="100" viewBox="0 0 100 55">
                    <path class="gauge-bg" d="M 10 50 A 40 40 0 0 1 90 50" />
                    <path id="gauge-co" class="gauge-fill" stroke="#ef4444" d="M 10 50 A 40 40 0 0 1 90 50" />
                </svg>
                <div class="gauge-value"><span id="val-co">0</span> <span>ppm</span></div>
            </div>
            <div class="gauge-labels"><span>0</span><span>300</span></div>
        </div>

        <div class="card">
            <div class="card-header">
                <div><div class="card-title">MQ135 Air Quality</div></div>
                <span id="badge-mq135" class="status-badge badge-success">GOOD</span>
            </div>
            <div class="gauge-container">
                <svg width="180" height="100" viewBox="0 0 100 55">
                    <path class="gauge-bg" d="M 10 50 A 40 40 0 0 1 90 50" />
                    <path id="gauge-mq135" class="gauge-fill" stroke="#eab308" d="M 10 50 A 40 40 0 0 1 90 50" />
                </svg>
                <div class="gauge-value"><span id="val-mq135">0</span> <span>ppm</span></div>
            </div>
            <div class="gauge-labels"><span>0</span><span>2000</span></div>
        </div>

        <div class="card">
            <div class="card-header">
                <div><div class="card-title">Air Pressure (BMP180)</div></div>
                <span id="badge-press" class="status-badge badge-success">NORMAL</span>
            </div>
            <div class="gauge-container">
                <svg width="180" height="100" viewBox="0 0 100 55">
                    <path class="gauge-bg" d="M 10 50 A 40 40 0 0 1 90 50" />
                    <path id="gauge-press" class="gauge-fill" stroke="#22c55e" d="M 10 50 A 40 40 0 0 1 90 50" />
                </svg>
                <div class="gauge-value"><span id="val-press">0.0</span> <span>kPa</span></div>
            </div>
            <div class="gauge-labels"><span>0</span><span>120</span></div>
        </div>

        <div class="water-card-container">
            <div class="card-header">
                <div class="card-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.5"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                    Water Level (កម្រិតទឹក)
                </div>
                <span id="badge-water" class="status-badge badge-info">NORMAL LEVEL</span>
            </div>
            
            <div class="tank-wrapper">
                <div class="sensor-icon-container">
                    <div class="ultrasonic-sensor-hardware">
                        <div class="sensor-eye"></div>
                        <div class="sensor-eye"></div>
                    </div>
                </div>

                <div class="tank-levels">
                    <div>100%</div>
                    <div>75%</div>
                    <div>50%</div>
                    <div>25%</div>
                    <div>0%</div>
                </div>

                <div class="percentage-box">
                    <span id="val-water">0</span>%
                </div>

                <div id="ocean-water" class="ocean-container">
                    <div class="wave"></div>
                </div>
            </div>
        </div>

    </div>

    <!-- Interactive Hardware Control Center -->
    <div class="controls-section">
        <div class="controls-title">🎮 ផ្ទាំងបញ្ជា និងសាកល្បងប្រព័ន្ធ (Interactive Control Panel)</div>
        <div class="controls-grid">
            <button id="btn-buzzer" class="btn-ctrl btn-outline" onclick="toggleBuzzer()">
                🚨 <span>ស៊ីរ៉ែន Buzzer / LED</span>: <strong id="txt-buzzer">បិទ (OFF)</strong>
            </button>
            <button class="btn-ctrl btn-danger" onclick="triggerGsmCall()">
                📞 <span>តេស្តខលអាសន្ន GSM (+85593586803)</span>
            </button>
            <button class="btn-ctrl btn-primary" onclick="testTelegramAlert()">
                💬 <span>ផ្ញើសារសាកល្បង Telegram Bot</span>
            </button>
        </div>
    </div>

    <script>
        let currentBuzzer = false;

        function updateGauge(id, val, maxVal) {
            const path = document.getElementById(id);
            if(!path) return;
            const totalLength = 251.2;
            let percentage = Math.min(Math.max(val / maxVal, 0), 1);
            let offset = totalLength * (1 - percentage);
            path.style.strokeDashoffset = offset;
        }

        function fetchSensorData() {
            fetch('/readSensors')
                .then(res => res.json())
                .then(data => {
                    let mBadge = document.getElementById('mode-badge');
                    if (data.is_online) {
                        mBadge.innerText = "ONLINE MODE (ភ្ជាប់អ៊ីនធឺណិត) | AP: 192.168.4.44";
                        mBadge.className = "mode-badge mode-online";
                    } else {
                        mBadge.innerText = "OFFLINE MODE (Direct Hotspot AP: 192.168.4.44)";
                        mBadge.className = "mode-badge mode-offline";
                    }

                    document.getElementById('val-co').innerText = data.co;
                    updateGauge('gauge-co', data.co, 300);
                    let bCo = document.getElementById('badge-co');
                    if (data.co >= 250) { bCo.className = "status-badge badge-danger"; bCo.innerText = "DANGER"; }
                    else if (data.co > 150) { bCo.className = "status-badge badge-warning"; bCo.innerText = "WARNING"; }
                    else { bCo.className = "status-badge badge-success"; bCo.innerText = "NORMAL"; }

                    document.getElementById('val-mq135').innerText = data.mq135;
                    updateGauge('gauge-mq135', data.mq135, 2000);
                    let bMq = document.getElementById('badge-mq135');
                    if (data.mq135 >= 500) { bMq.className = "status-badge badge-danger"; bMq.innerText = "POOR / BAD"; }
                    else if (data.mq135 > 300) { bMq.className = "status-badge badge-warning"; bMq.innerText = "FAIR"; }
                    else { bMq.className = "status-badge badge-success"; bMq.innerText = "GOOD"; }

                    document.getElementById('val-press').innerText = data.press.toFixed(1);
                    updateGauge('gauge-press', data.press, 120);
                    let bPr = document.getElementById('badge-press');
                    if (data.press < 65.0) { bPr.className = "status-badge badge-danger"; bPr.innerText = "STORM ALERT"; }
                    else if (data.press < 80.0) { bPr.className = "status-badge badge-warning"; bPr.innerText = "LOW"; }
                    else { bPr.className = "status-badge badge-success"; bPr.innerText = "NORMAL"; }

                    document.getElementById('val-water').innerText = data.water;
                    document.getElementById('ocean-water').style.height = data.water + '%;
                    let bWt = document.getElementById('badge-water');
                    if (data.water >= 85) { bWt.className = "status-badge badge-danger"; bWt.innerText = "HIGH LEVEL"; }
                    else { bWt.className = "status-badge badge-info"; bWt.innerText = "NORMAL LEVEL"; }

                    if (data.buzzer !== undefined) {
                        currentBuzzer = data.buzzer;
                        let btnB = document.getElementById('btn-buzzer');
                        let txtB = document.getElementById('txt-buzzer');
                        if (currentBuzzer) {
                            btnB.className = "btn-ctrl btn-outline active";
                            txtB.innerText = "កំពុងបើក (ON)";
                        } else {
                            btnB.className = "btn-ctrl btn-outline";
                            txtB.innerText = "បិទ (OFF)";
                        }
                    }
                })
                .catch(err => console.error("Error fetching sensors:", err));
        }

        function toggleBuzzer() {
            currentBuzzer = !currentBuzzer;
            fetch('/controlBuzzer?state=' + (currentBuzzer ? 1 : 0))
                .then(() => fetchSensorData());
        }

        function triggerGsmCall() {
            if(confirm("តើអ្នកចង់ធ្វើតេស្តខលអាសន្នទៅកាន់លេខ +85593586803 ឬទេ?")) {
                fetch('/triggerCall')
                    .then(() => alert("បានបញ្ជាខលអាសន្នតាម SIM900A ជោគជ័យ!"));
            }
        }

        function testTelegramAlert() {
            fetch('/testTelegram')
                .then(() => alert("បានផ្ញើសារសាកល្បងទៅកាន់ Telegram Bot ជោគជ័យ!"));
        }

        setInterval(fetchSensorData, 2000);
        fetchSensorData();
    </script>
</body>
</html>
)rawliteral";

// Helper Functions
void sendTelegram(String message) {
  if (wifiConnected) {
    bot.sendMessage(CHAT_ID, message, "");
  }
}

void executeGSMCall() {
  sendTelegram("📞 ប្រព័ន្ធកំពុងខលទៅកាន់លេខរបស់អ្នក... (" + String(PHONE_NUMBER) + ")");
  
  Serial2.println("AT");
  delay(100);
  Serial2.println("AT+CSQ");
  delay(100);
  Serial2.print("ATD");
  Serial2.print(PHONE_NUMBER);
  Serial2.println(";");
  
  Serial.println("[SIM900A] Emergency call executed!");
}

int getWaterPercentage() {
  unsigned int dist = sonar.ping_cm();
  if (dist >= 5 && dist <= 20) {
    int pct = map(dist, 20, 5, 0, 100);
    return constrain(pct, 0, 100);
  } else if (dist > 0 && dist < 5) {
    return 100;
  }
  return 0;
}

void handleAlertBlink() {
  if (manualBuzzerState) {
    digitalWrite(BUZZER_PIN, HIGH);
    digitalWrite(LED_RED_PIN, HIGH);
    return;
  }

  if (currentAlertMode == 0) {
    digitalWrite(BUZZER_PIN, LOW);
    digitalWrite(LED_RED_PIN, LOW);
    alertState = false;
    return;
  }

  unsigned long interval = (currentAlertMode == 2) ? 250 : 500;

  if (millis() - lastBlinkTime >= interval) {
    lastBlinkTime = millis();
    alertState = !alertState;

    digitalWrite(BUZZER_PIN, alertState ? HIGH : LOW);
    digitalWrite(LED_RED_PIN, alertState ? HIGH : LOW);
  }
}

void processEmergencyCallLogic() {
  unsigned long now = millis();

  if (callStage == 0) {
    executeGSMCall();
    callStage = 1;
    lastCallAttempt = now;
  } 
  else if (callStage == 1 && (now - lastCallAttempt >= 60000)) { // 1mn
    executeGSMCall();
    callStage = 2;
    lastCallAttempt = now;
  } 
  else if (callStage == 2 && (now - lastCallAttempt >= 300000)) { // 5mn
    executeGSMCall();
    callStage = 1;
    lastCallAttempt = now;
  }
}

void processSensors() {
  int rawMQ7 = analogRead(MQ7_PIN);
  int rawMQ135 = analogRead(MQ135_PIN);
  
  int coPpm = map(rawMQ7, 0, 4095, 0, 300);
  int mq135Ppm = map(rawMQ135, 0, 4095, 0, 2000);
  
  unsigned int dist = sonar.ping_cm();
  int waterLevel = getWaterPercentage(); 

  float pressKPa = 101.3;
  if (bmpStatus) {
    pressKPa = bmp.readPressure() / 1000.0F;
  }

  bool isGeneralEmergency = (coPpm >= 250 || mq135Ppm >= 500 || (dist > 0 && dist <= 5) || pressKPa < 65.0);
  bool isCallEmergency = ((dist > 0 && dist <= 5) || pressKPa < 65.0);

  if (isGeneralEmergency) {
    currentAlertMode = 2; 

    if (isCallEmergency) {
      if (!isWaterEmergencyActive) {
        isWaterEmergencyActive = true;
        callStage = 0; 
        executeGSMCall();
      } else {
        processEmergencyCallLogic();
      }
    }

    if (millis() - lastHighAlertTime >= 3000) {
      if (coPpm >= 250) sendTelegram("🚨 អាសន្ន! ឧស្ម័នពុល CO ឡើងខ្ពស់ខ្លាំង (CO: " + String(coPpm) + " ppm)!");
      else if (mq135Ppm >= 500) sendTelegram("🚨 អាសន្ន! គុណភាពខ្យល់ពុល អាក្រក់ខ្លាំង (MQ135: " + String(mq135Ppm) + " ppm)!");
      else if (dist > 0 && dist <= 5) sendTelegram("🚨 អាសន្ន! ទឹកឡើងដល់កម្រិតខ្ពស់ដែលត្រូវប្រុងប្រយ័ត្ន (100%)!");
      else if (pressKPa < 65.0) sendTelegram("🚨 អាសន្ន! សម្ពាធអាកាសធ្លាក់ចុះ នឹងកើតមានខ្យល់ព្យុះ (" + String(pressKPa, 1) + " kPa)!");

      lastHighAlertTime = millis();
    }
  } 
  else {
    isWaterEmergencyActive = false;
    callStage = 0;

    if ((coPpm > 200 && coPpm < 250) || (mq135Ppm > 300 && mq135Ppm < 500) || (dist > 5 && dist <= 8) || (pressKPa >= 65.0 && pressKPa < 80.0)) {
      currentAlertMode = 1;

      if (coPpm > 200 && coPpm < 250 && millis() - lastGasWarningTime >= 3000) {
        sendTelegram("⚠️ ព្រមាន! ឧស្ម័នពុលកើនឡើង (CO: " + String(coPpm) + " ppm)");
        lastGasWarningTime = millis();
      }
      if (mq135Ppm > 300 && mq135Ppm < 500 && millis() - lastMqWarningTime >= 3000) {
        sendTelegram("⚠️ ព្រមាន! គុណភាពខ្យល់ធ្លាក់ចុះ (MQ135: " + String(mq135Ppm) + " ppm)");
        lastMqWarningTime = millis();
      }
      if (dist > 5 && dist <= 8 && millis() - lastLowAlertTime >= 2000) {
        sendTelegram("⚠️ ព្រមាន! កម្រិតទឹកកំពុងឡើង");
        lastLowAlertTime = millis();
      }
      if (pressKPa >= 65.0 && pressKPa < 80.0 && millis() - lastAlertTime >= 3000) {
        sendTelegram("⚠️ ព្រមាន! សម្ពាធអាកាសប្រែប្រួល (" + String(pressKPa, 1) + " kPa)");
        lastAlertTime = millis();
      }
    } 
    else {
      currentAlertMode = 0;
    }
  }

  Serial.printf("[Mode: %s] CO: %d | MQ135: %d | Water: %d%% | Press: %.2f kPa | AlertMode: %d\\n",
                wifiConnected ? "ONLINE" : "OFFLINE", coPpm, mq135Ppm, waterLevel, pressKPa, currentAlertMode);
}

void handleSensorData() {
  int coPpm = map(analogRead(MQ7_PIN), 0, 4095, 0, 300);
  int mq135Ppm = map(analogRead(MQ135_PIN), 0, 4095, 0, 2000);
  float pressureKPa = bmpStatus ? (bmp.readPressure() / 1000.0F) : 101.3;
  int waterPct = getWaterPercentage();

  String json = "{";
  json += "\\"co\\":" + String(coPpm) + ",";
  json += "\\"mq135\\":" + String(mq135Ppm) + ",";
  json += "\\"press\\":" + String(pressureKPa, 1) + ",";
  json += "\\"water\\":" + String(waterPct) + ",";
  json += "\\"buzzer\\":" + String(manualBuzzerState || currentAlertMode > 0 ? "true" : "false") + ",";
  json += "\\"alert_mode\\":" + String(currentAlertMode) + ",";
  json += "\\"is_online\\":" + String(wifiConnected ? "true" : "false");
  json += "}";

  server.send(200, "application/json", json);
}

void handleControlBuzzer() {
  if (server.hasArg("state")) {
    int s = server.arg("state").toInt();
    manualBuzzerState = (s == 1);
  } else {
    manualBuzzerState = !manualBuzzerState;
  }
  digitalWrite(BUZZER_PIN, manualBuzzerState ? HIGH : LOW);
  digitalWrite(LED_RED_PIN, manualBuzzerState ? HIGH : LOW);
  server.send(200, "text/plain", "OK");
}

void handleTriggerCall() {
  executeGSMCall();
  server.send(200, "text/plain", "CALL_EXECUTED");
}

void handleTestTelegram() {
  sendTelegram("🚨 [Manual Test] ការសាកល្បងប្រព័ន្ធផ្តល់សញ្ញាអាសន្ន (Smart Alert System) ដំណើរការប្រក្រតី!");
  server.send(200, "text/plain", "TELEGRAM_SENT");
}

void handleRoot() { 
  server.send_P(200, "text/html; charset=UTF-8", HTML_CONTENT); 
}

void handleNotFound() {
  IPAddress requestedIP = server.client().localIP();
  if (requestedIP != ap_local_ip) {
    server.sendHeader("Location", "http://192.168.4.44/", true);
    server.send(302, "text/plain", "");
    return;
  }
  handleRoot();
}

void setup() {
  Serial.begin(115200);
  
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_RED_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_RED_PIN, LOW);

  secClient.setInsecure(); 

  Wire.begin(21, 22);
  bmpStatus = bmp.begin();
  if(!bmpStatus) {
    Serial.println("[WARN] BMP180 sensor not found!");
  }

  Serial2.begin(9600, SERIAL_8N1, SIM900_RX, SIM900_TX);
  delay(1000);
  Serial2.println("AT+IPR=9600");
  delay(200);
  Serial2.println("AT");
  delay(200);
  Serial2.println("AT+CLIP=1");

  WiFi.mode(WIFI_AP_STA);
  WiFi.softAPConfig(ap_local_ip, ap_gateway, ap_subnet);
  WiFi.softAP(ap_ssid, ap_password);

  Serial.println("Connecting to Wi-Fi...");
  WiFi.begin(wifi_ssid, wifi_password);
  
  unsigned long startAttemptTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 8000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\\n[INFO] Wi-Fi Connected! Running in ONLINE MODE.");
    sendTelegram("Alert System ដំណើរការជោគជ័យ! IP: " + WiFi.localIP().toString() + "\\nDirect AP: http://192.168.4.44");
  } else {
    wifiConnected = false;
    Serial.println("\\n[INFO] Wi-Fi Timeout! Operating in Access Point & GSM Mode.");
  }

  dnsServer.start(DNS_PORT, "*", WiFi.softAPIP());

  // Web Server Routing
  server.on("/", handleRoot);
  server.on("/readSensors", handleSensorData);
  server.on("/controlBuzzer", handleControlBuzzer);
  server.on("/triggerCall", handleTriggerCall);
  server.on("/testTelegram", handleTestTelegram);

  // Captive Portal OS Handlers
  server.on("/generate_204", handleRoot);
  server.on("/gen_204", handleRoot);
  server.on("/hotspot-detect.html", handleRoot);
  server.on("/connecttest.txt", handleRoot);
  server.on("/redirect", handleRoot);

  server.onNotFound(handleNotFound);
  server.begin();
}

void loop() {
  dnsServer.processNextRequest();
  server.handleClient();

  handleAlertBlink();

  if (millis() - lastSensorProcess >= 1500) {
    processSensors();
    lastSensorProcess = millis();
  }

  while (Serial2.available()) {
    Serial.write(Serial2.read());
  }
}
`;

  const esp32SmartBinCode = `/**********************************************************************************
 * គម្រោង៖ ប្រព័ន្ធធុងសំរាមវៃឆ្លាត (Smart Bin System)
 * មុខងារ៖ Ultrasonic Level Detection (Dry & Wet), Servo Open/Sort Lid, GSM SIM900 Call Alert, Telegram, Dual-Mode AP+STA
 * ឧបករណ៍៖ ESP32, Servos (Lid: 25, Sort: 33), LCD 0x27 (21, 22), Ultrasonics (Open: 12/14, Dry: 27/26, Wet: 18/19), IR: 15, Soil: 32, SIM900 (16, 17)
 **********************************************************************************/

#include <ESP32Servo.h>
#include <LiquidCrystal_I2C.h>
#include <HTTPClient.h> 
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <WiFiClientSecure.h>
#include <Wire.h>
#include <Adafruit_BMP085.h>
#include <NewPing.h>
#include <UniversalTelegramBot.h>

// Wi-Fi & Telegram Credentials
const char* ap_ssid       = "SmartBin-ESP32";
const char* ap_password   = "12345678";
const char* wifi_ssid     = "${wifiSsid}";
const char* wifi_password = "${wifiPass}";

const String BOT_TOKEN    = "${telegramBotToken}";
const String CHAT_ID      = "${telegramChatId}";
const String PHONE_NUMBER = "+85593586803"; 

// Static IP Config
IPAddress sta_local_ip(192, 168, 0, 45);
IPAddress sta_gateway(192, 168, 0, 1);
IPAddress sta_subnet(255, 255, 255, 0);
IPAddress sta_dns1(8, 8, 8, 8);

IPAddress ap_local_ip(192, 168, 4, 3);
IPAddress ap_gateway(192, 168, 4, 3);
IPAddress ap_subnet(255, 255, 255, 0);

// Hardware Pin Setup
#define TRIG_OPEN_PIN   12      
#define ECHO_OPEN_PIN   14    
#define TRIG_DRY_PIN    27      
#define ECHO_DRY_PIN    26      
#define TRIG_WET_PIN    18      
#define ECHO_WET_PIN    19    
#define SERVO_LID_PIN   25      
#define SERVO_SORT_PIN  33      
#define IR_SENSOR_PIN   15      
#define SOIL_SENSOR_PIN 32      
#define LED_RUN_PIN     4       
#define LED_STATUS_PIN  13      
#define BUZZER_PIN      2       
#define SIM900_RX       16      
#define SIM900_TX       17      

#define MAX_DISTANCE    400

Servo servoLid;
Servo servoSort;
LiquidCrystal_I2C lcd(0x27, 16, 2);
Adafruit_BMP085 bmp;
NewPing sonarOpen(TRIG_OPEN_PIN, ECHO_OPEN_PIN, MAX_DISTANCE);

WiFiClientSecure secClient;
UniversalTelegramBot bot(BOT_TOKEN, secClient);

const byte DNS_PORT = 53;
DNSServer dnsServer;
WebServer server(80);

// Cloud App Sync
const String SERVER_URL = "${serverUrl}";
const String AUTH_TOKEN = "${blynkAuthToken}";
unsigned long lastCloudSync = 0;

// Global Control Variables
bool wifiConnected = false;
int webButtonState = 0;
bool modeTelegram = true;
bool modeCall = true;

bool isFullAlertActive = false;
bool isCallingNow = false;
unsigned long alertSequenceTimer = 0;
int alertStep = 0;

bool isLidOpen = false; 
unsigned long lidOpenStartTime = 0; 

String wasteType = "Ready";
int currentIRState = HIGH;
int lastIRState = HIGH;

unsigned long lastBlinkTime = 0;
unsigned long lastSensorProcess = 0;

int dryPercentage = 0;
int wetPercentage = 0;
float distDry = 0.0;
float distWet = 0.0;
int globalSoilRawValue = 0;

bool isDryLocked = false;
bool isWetLocked = false;

void syncWithCloudApp() {
  if (WiFi.status() != WL_CONNECTED || SERVER_URL.length() < 10) return;
  HTTPClient http;
  String syncUrl = SERVER_URL + "/api/iot/update?token=" + AUTH_TOKEN +
                   "&v0=" + String(isLidOpen ? 1 : 0) +
                   "&v1=" + String(dryPercentage) +
                   "&v2=" + String(wetPercentage) +
                   "&modeTg=" + String(modeTelegram ? 1 : 0) +
                   "&modeCall=" + String(modeCall ? 1 : 0) +
                   "&ip=" + (wifiConnected ? sta_local_ip.toString() : ap_local_ip.toString());
  http.begin(syncUrl);
  http.GET();
  http.end();
}

// Web UI HTML/CSS
const char HTML_CONTENT[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="km">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Smart Bin Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; font-family: 'Kantumruy Pro', sans-serif; margin: 0; padding: 0; }
        body { background-color: #f4f7f6; padding: 20px; color: #333; }
        .container { max-width: 900px; margin: 0 auto; }
        .card-main { background: white; border-radius: 16px; padding: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 20px; text-align: center; }
        .title { font-size: 22px; font-weight: 700; color: #0f5132; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .bins-container { display: flex; justify-content: center; align-items: flex-end; gap: 40px; margin-bottom: 15px; }
        .bin-wrapper { text-align: center; width: 140px; }
        .bin-outer { width: 100px; height: 180px; border: 4px solid #2e4053; border-radius: 16px; margin: 0 auto 15px; position: relative; overflow: hidden; background: #fff; }
        .bin-fill { position: absolute; bottom: 0; width: 100%; background: #10b981; transition: height 0.5s ease-in-out; }
        
        /* Status Dot Styles */
        .status-dot { width: 18px; height: 18px; border-radius: 50%; margin: 0 auto 5px; transition: background 0.3s ease, box-shadow 0.3s ease; }
        .status-dot.closed { background: #cbd5e1; box-shadow: none; }
        .status-dot.open { background: #00FF00; box-shadow: 0 0 12px #00FF00; }
        .status-dot.orange-blink { background: #f97316; box-shadow: 0 0 12px #f97316; animation: blinker 0.6s linear infinite; }
        
        @keyframes blinker { 50% { opacity: 0.2; } }
        
        .red-system-led { width: 8px; height: 8px; background: #ef4444; border-radius: 50%; margin: 4px auto 0; box-shadow: 0 0 6px #ef4444; }
        
        .status-text { font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 5px; }
        .bin-val { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
        .bin-dist { font-size: 13px; color: #475569; }
        .bin-dist span { color: #0284c7; font-weight: 600; }
        .bin-label { font-size: 12px; color: #94a3b8; margin-top: 4px; }
        .sub-info { font-size: 12px; color: #94a3b8; margin-top: 15px; }
        .controls-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 15px; }
        .ctrl-card { background: white; border-radius: 12px; padding: 15px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; justify-content: space-between; height: 110px; }
        .ctrl-header { display: flex; justify-content: space-between; align-items: center; font-weight: 600; font-size: 15px; }
        .v-tag { font-size: 10px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #64748b; }
        .ctrl-body { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
        .ctrl-status { font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px; color: #64748b; }
        
        /* ពណ៌តាមផ្នែកនីមួយៗ */
        .ctrl-status.servo-active { color: #10b981; }
        .ctrl-status.tg-active { color: #0284c7; } /* ពណ៌ខៀវ Telegram */
        .ctrl-status.call-active { color: #f97316; }
        
        .dot-led { width: 8px; height: 8px; border-radius: 50%; background: #cbd5e1; }
        .dot-led.servo-active { background: #10b981; }
        .dot-led.tg-active { background: #0284c7; } /* ពណ៌ខៀវ Telegram */
        .dot-led.call-active { background: #f97316; }
        
        .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .3s; border-radius: 24px; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; }
        
        input:checked + .slider.servo-bg { background-color: #10b981; }
        input:checked + .slider.tg-bg { background-color: #0284c7; } /* ពណ៌ខៀវ Telegram */
        input:checked + .slider.call-bg { background-color: #f97316; }
        input:checked + .slider:before { transform: translateX(20px); }
    </style>
</head>
<body>
    <div class="container">
        <div class="card-main">
            <div class="title">🗑️ កម្រិតសំរាម</div>
            <div class="bins-container">
                <div class="bin-wrapper">
                    <div class="bin-outer"><div id="wet-fill" class="bin-fill" style="height: 0%;"></div></div>
                    <div class="bin-val" id="wet-percentage">0% Full</div>
                    <div class="bin-dist">Distance: <span id="wet-dist">0.0</span> cm</div>
                    <div class="bin-label">សំរាមសើម</div>
                </div>
                
                <div>
                    <div id="status-dot" class="status-dot closed"></div>
                    <div class="status-text" id="lid-status-text">កំពុងបិទ</div>
                    <div class="red-system-led" title="ធុងសំរាមកំពុងដំណើរការ"></div>
                </div>
                
                <div class="bin-wrapper">
                    <div class="bin-outer"><div id="dry-fill" class="bin-fill" style="height: 0%;"></div></div>
                    <div class="bin-val" id="dry-percentage">0% Full</div>
                    <div class="bin-dist">Distance: <span id="dry-dist">0.0</span> cm</div>
                    <div class="bin-label">សំរាមស្ងួត</div>
                </div>
            </div>
            <div class="sub-info">(Empty: 20cm = 0% • Full: 5cm = 100%)</div>
        </div>

        <div class="controls-grid">
            <div class="ctrl-card">
                <div class="ctrl-header">
                    <span>⏻ បញ្ជាគ្របធុងសំរាម (Servo)</span>
                    <span class="v-tag">V0</span>
                </div>
                <div class="ctrl-body">
                    <div class="ctrl-status" id="lid-ctrl-label"><span class="dot-led" id="lid-dot"></span> បិទ (CLOSED)</div>
                    <label class="switch">
                        <input type="checkbox" id="btn-lid" onchange="toggleControl('lid', this.checked)">
                        <span class="slider servo-bg"></span>
                    </label>
                </div>
            </div>

            <!-- កាត Telegram កែប្រែជាពណ៌ខៀវ -->
            <div class="ctrl-card">
                <div class="ctrl-header">
                    <span>✈ របៀបផ្ដល់ដំណឹង Telegram</span>
                    <span class="v-tag">V2</span>
                </div>
                <div class="ctrl-body">
                    <div class="ctrl-status tg-active" id="tg-ctrl-label"><span class="dot-led tg-active"></span> បើក (ON)</div>
                    <label class="switch">
                        <input type="checkbox" id="btn-tg" checked onchange="toggleControl('telegram', this.checked)">
                        <span class="slider tg-bg"></span>
                    </label>
                </div>
            </div>

            <div class="ctrl-card">
                <div class="ctrl-header">
                    <span>📞 របៀបខលទូរស័ព្ទអាសន្ន</span>
                    <span class="v-tag">V5</span>
                </div>
                <div class="ctrl-body">
                    <div class="ctrl-status call-active" id="call-ctrl-label"><span class="dot-led call-active"></span> បើក (ON)</div>
                    <label class="switch">
                        <input type="checkbox" id="btn-call" checked onchange="toggleControl('call', this.checked)">
                        <span class="slider call-bg"></span>
                    </label>
                </div>
            </div>
        </div>
    </div>

    <script>
        function updateData() {
            fetch('/readSensors')
                .then(res => res.json())
                .then(data => {
                    document.getElementById('wet-percentage').innerText = data.wetPct + '% Full';
                    document.getElementById('wet-dist').innerText = data.wetDist.toFixed(1);
                    document.getElementById('wet-fill').style.height = data.wetPct + '%';

                    document.getElementById('dry-percentage').innerText = data.dryPct + '% Full';
                    document.getElementById('dry-dist').innerText = data.dryDist.toFixed(1);
                    document.getElementById('dry-fill').style.height = data.dryPct + '%';

                    document.getElementById('lid-status-text').innerText = data.isLidOpen ? 'កំពុងបើក' : 'កំពុងបិទ';

                    const dot = document.getElementById('status-dot');
                    
                    if (data.isFull) {
                        dot.className = "status-dot orange-blink";
                    } else if (data.isLidOpen) {
                        dot.className = "status-dot open";
                    } else {
                        dot.className = "status-dot closed";
                    }

                    document.getElementById('btn-lid').checked = data.btnLid;
                    updateLidUI(data.btnLid);

                    document.getElementById('btn-tg').checked = data.modeTg;
                    updateTgUI(data.modeTg);

                    document.getElementById('btn-call').checked = data.modeCall;
                    updateCallUI(data.modeCall);
                });
        }

        function updateLidUI(val) {
            const lbl = document.getElementById('lid-ctrl-label');
            if(val) {
                lbl.className = "ctrl-status servo-active";
                lbl.innerHTML = '<span class="dot-led servo-active"></span> បើក (OPEN)';
            } else {
                lbl.className = "ctrl-status";
                lbl.innerHTML = '<span class="dot-led"></span> បិទ (CLOSED)';
            }
        }

        function updateTgUI(val) {
            const lbl = document.getElementById('tg-ctrl-label');
            if(val) {
                lbl.className = "ctrl-status tg-active";
                lbl.innerHTML = '<span class="dot-led tg-active"></span> បើក (ON)';
            } else {
                lbl.className = "ctrl-status";
                lbl.innerHTML = '<span class="dot-led"></span> បិទ (OFF)';
            }
        }

        function updateCallUI(val) {
            const lbl = document.getElementById('call-ctrl-label');
            if(val) {
                lbl.className = "ctrl-status call-active";
                lbl.innerHTML = '<span class="dot-led call-active"></span> បើក (ON)';
            } else {
                lbl.className = "ctrl-status";
                lbl.innerHTML = '<span class="dot-led"></span> បិទ (OFF)';
            }
        }

        function toggleControl(target, state) {
            fetch(\`/toggle?target=\${target}&state=\${state ? 1 : 0}\`);
            if(target === 'lid') updateLidUI(state);
            if(target === 'telegram') updateTgUI(state);
            if(target === 'call') updateCallUI(state);
        }

        setInterval(updateData, 1000);
    </script>
</body>
</html>
)rawliteral";

long getDistance(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  long duration = pulseIn(echoPin, HIGH, 30000); 
  if (duration == 0) return 20; 
  return (duration * 0.034 / 2);
}

void sendTelegram(String message) {
  if (wifiConnected && modeTelegram) {
    bot.sendMessage(CHAT_ID, message, "");
  }
}

void triggerCallSequence() {
  isCallingNow = true;
  digitalWrite(LED_STATUS_PIN, HIGH);
  
  sendTelegram("📞 ប្រព័ន្ធកំពុងខលទៅកាន់លេខរបស់អ្នក... (" + PHONE_NUMBER + ")");
  
  if (modeCall) {
    Serial2.println("AT"); delay(200);
    Serial2.println("AT+CMGF=1"); delay(200);
    Serial2.println("ATD" + PHONE_NUMBER + ";"); 
    delay(5000);
  }
  
  isCallingNow = false;
}

void handleRoot() { 
  server.send(200, "text/html; charset=UTF-8", HTML_CONTENT); 
}

void handleSensorData() {
  String json = "{";
  json += "\"wetPct\":" + String(wetPercentage) + ",";
  json += "\"wetDist\":" + String(distWet, 1) + ",";
  json += "\"dryPct\":" + String(dryPercentage) + ",";
  json += "\"dryDist\":" + String(distDry, 1) + ",";
  json += "\"isLidOpen\":" + String(isLidOpen ? "true" : "false") + ",";
  json += "\"isFull\":" + String((dryPercentage >= 90 || wetPercentage >= 90) ? "true" : "false") + ",";
  json += "\"btnLid\":" + String(webButtonState) + ",";
  json += "\"modeTg\":" + String(modeTelegram ? "true" : "false") + ",";
  json += "\"modeCall\":" + String(modeCall ? "true" : "false");
  json += "}";
  server.send(200, "application/json", json);
}

void handleToggle() {
  if (server.hasArg("target") && server.hasArg("state")) {
    String target = server.arg("target");
    int state = server.arg("state").toInt();

    if (target == "lid") {
      webButtonState = state;
    } else if (target == "telegram") {
      modeTelegram = (state == 1);
    } else if (target == "call") {
      modeCall = (state == 1);
    }
  }
  server.send(200, "text/plain", "OK");
}

void handleNotFound() {
  server.sendHeader("Location", "http://192.168.4.3/", true);
  server.send(302, "text/plain", "");
}

void handleAlertBlink() {
  if (isCallingNow) return; 

  if (dryPercentage >= 90 || wetPercentage >= 90) {
    if (millis() - lastBlinkTime >= 200) { 
      digitalWrite(LED_STATUS_PIN, !digitalRead(LED_STATUS_PIN));
      digitalWrite(BUZZER_PIN, !digitalRead(BUZZER_PIN));
      lastBlinkTime = millis();
    }
  } else {
    digitalWrite(LED_STATUS_PIN, isLidOpen ? HIGH : LOW);
    digitalWrite(BUZZER_PIN, LOW);
  }
}

void processSensors() {
  distDry = getDistance(TRIG_DRY_PIN, ECHO_DRY_PIN);
  distWet = getDistance(TRIG_WET_PIN, ECHO_WET_PIN);
  
  if (distDry <= 5) isDryLocked = true;
  else if (distDry > 12) isDryLocked = false;
  dryPercentage = isDryLocked ? 100 : map(constrain(distDry, 5, 20), 20, 5, 0, 100);

  if (distWet <= 5) isWetLocked = true;
  else if (distWet > 12) isWetLocked = false;
  wetPercentage = isWetLocked ? 100 : map(constrain(distWet, 5, 20), 20, 5, 0, 100);

  bool isBothFull = (dryPercentage >= 90 && wetPercentage >= 90);
  long distOpen = getDistance(TRIG_OPEN_PIN, ECHO_OPEN_PIN);
  bool handDetected = (distOpen > 0 && distOpen <= 10);

  if (webButtonState == HIGH || (handDetected && !isBothFull)) {
    if (!isLidOpen) {
      for (int pos = 0; pos <= 110; pos++) { servoLid.write(pos); delay(4); } 
      isLidOpen = true;
      lidOpenStartTime = millis();
    } else {
      lidOpenStartTime = millis(); 
    }
  } else if (isLidOpen) {
    if ((millis() - lidOpenStartTime >= 3000)) {
      for (int pos = 110; pos >= 0; pos--) { servoLid.write(pos); delay(8); }
      isLidOpen = false;
    }
  }

  globalSoilRawValue = analogRead(SOIL_SENSOR_PIN);
  currentIRState = digitalRead(IR_SENSOR_PIN);
  if (currentIRState == LOW && lastIRState == HIGH) { 
    delay(500); 
    if (globalSoilRawValue < 2000) { wasteType = "Wet Waste"; servoSort.write(180); } 
    else { wasteType = "Dry Waste"; servoSort.write(0); }
    delay(2000); servoSort.write(90);       
  }
  lastIRState = currentIRState; 

  if (dryPercentage >= 90 || wetPercentage >= 90) {
    String binName = (dryPercentage >= 90) ? "ធុងសំរាមស្ងួត" : "ធុងសំរាមសើម";
    
    if (!isFullAlertActive) {
      isFullAlertActive = true;
      alertStep = 1;
      sendTelegram("⚠️ អាសន្នលើកទី១៖ " + binName + " ពេញហើយ!");
      alertSequenceTimer = millis();
    } 
    else if (alertStep == 1 && (millis() - alertSequenceTimer >= 2000)) { 
      alertStep = 2;
      sendTelegram("⚠️ អាសន្នលើកទី២៖ " + binName + " ពេញហើយ! សូមមកប្រមូល!");
      alertSequenceTimer = millis();
    } 
    else if (alertStep == 2 && (millis() - alertSequenceTimer >= 3000)) { 
      alertStep = 3;
      sendTelegram("⚠️ អាសន្នលើកទី៣៖ " + binName + " នៅតែពេញ!");
      triggerCallSequence(); 
    }
  } else {
    isFullAlertActive = false;
    alertStep = 0;
  }

  lcd.setCursor(0, 0);
  lcd.print("W:"); lcd.print(wetPercentage); lcd.print("% | ");
  lcd.print("D:"); lcd.print(dryPercentage); lcd.print("% ");
  lcd.setCursor(0, 1);
  lcd.print(isLidOpen ? "Lid: OPEN      " : "Lid: CLOSED    ");
}

void setup() {
  Serial.begin(115200);

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_RUN_PIN, OUTPUT);
  pinMode(LED_STATUS_PIN, OUTPUT);
  pinMode(TRIG_OPEN_PIN, OUTPUT); pinMode(ECHO_OPEN_PIN, INPUT);
  pinMode(TRIG_DRY_PIN, OUTPUT);  pinMode(ECHO_DRY_PIN, INPUT);
  pinMode(TRIG_WET_PIN, OUTPUT);  pinMode(ECHO_WET_PIN, INPUT);
  pinMode(IR_SENSOR_PIN, INPUT);
  pinMode(SOIL_SENSOR_PIN, INPUT);

  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_STATUS_PIN, LOW);
  digitalWrite(LED_RUN_PIN, HIGH);

  ESP32PWM::allocateTimer(0);
  servoLid.attach(SERVO_LID_PIN);
  servoSort.attach(SERVO_SORT_PIN);
  servoLid.write(0);   
  servoSort.write(90); 

  Wire.begin(21, 22);
  bmp.begin();
  lcd.init(); lcd.backlight(); lcd.clear();
  lcd.print("SMART BIN PDH");

  Serial2.begin(9600, SERIAL_8N1, SIM900_RX, SIM900_TX);
  delay(1000);
  Serial2.println("AT+IPR=9600");
  delay(500);
  Serial2.println("AT");
  delay(500);
  Serial2.println("AT+CLIP=1");

  secClient.setInsecure();

  // Wi-Fi Static IP Configuration
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAPConfig(ap_local_ip, ap_gateway, ap_subnet);
  WiFi.softAP(ap_ssid, ap_password);

  WiFi.config(sta_local_ip, sta_gateway, sta_subnet, sta_dns1);

  Serial.println("Connecting to Wi-Fi...");
  WiFi.begin(wifi_ssid, wifi_password);
  
  unsigned long startAttemptTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 8000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\n[INFO] Wi-Fi Connected!");
    sendTelegram("ប្រព័ន្ធចាប់ផ្ដើមដំណើរការជោគជ័យ! IP: " + WiFi.localIP().toString());
  } else {
    wifiConnected = false;
    Serial.println("\n[INFO] Operating in Access Point & GSM Mode.");
  }

  dnsServer.start(DNS_PORT, "*", WiFi.softAPIP());

  server.on("/", handleRoot);
  server.on("/readSensors", handleSensorData);
  server.on("/toggle", handleToggle);
  server.onNotFound(handleNotFound);
  server.begin();
}

void loop() {
  dnsServer.processNextRequest();
  server.handleClient();

  handleAlertBlink();

  if (millis() - lastSensorProcess >= 200) {
    processSensors();
    lastSensorProcess = millis();
  }

  if (millis() - lastCloudSync >= 3000) {
    syncWithCloudApp();
    lastCloudSync = millis();
  }

  while (Serial2.available()) {
    Serial.write(Serial2.read());
  }
}
`;

  // 4. Device 3: Smart Agriculture (esp32IrrigationCode)
  const esp32IrrigationCode = `/**********************************************************************************
 * គម្រោង៖ ប្រព័ន្ធ Smart Agriculture (Smart Irrigation, Smart Solar Tracking)
 * មុខងារ៖ Dual Mode (Always AP + Station) + Telegram Notification + Captive Portal
 **************************************SMART AGRICULTURE********************************************/

#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <WiFiClientSecure.h>
#include <UniversalTelegramBot.h>
#include <DHT.h>
#include <ESP32Servo.h>
#include <Wire.h>
#include <BH1750.h>

// --- Config Credentials ---
const char* ap_ssid       = "Smart Agriculture ESP32";
const char* ap_password   = "12345678";

// ប្តូរឈ្មោះ Wi-Fi និង Password តាម Router ដែលអ្នកកំពុងប្រើ
const char* wifi_ssid     = "${wifiSsid}";        
const char* wifi_password = "${wifiPass}"; 

const String BOT_TOKEN    = "${telegramBotToken}";
const String CHAT_ID      = "${telegramChatId}"; 

/* --- Hardware Pin Mapping --- */
#define DHTPIN 19              
#define DHTTYPE DHT22          
#define SOIL_PIN 34            
#define RELAY_PIN 18           
#define LDR_LEFT_PIN 33        
#define LDR_RIGHT_PIN 36       
#define SERVO_PIN 26           
#define BATTERY_PIN 39         
#define SOLAR_RELAY_PIN 16     

const int DryValue = 3200;     
const int WetValue = 1200;     

DHT dht(DHTPIN, DHTTYPE);
BH1750 lightMeter;
Servo solarServo;

// IP សម្រាប់ Offline Mode / Direct Hotspot (192.168.4.5)
IPAddress ap_local_ip(192, 168, 4, 5);
IPAddress ap_gateway(192, 168, 4, 5);
IPAddress ap_subnet(255, 255, 255, 0);

WiFiClientSecure secClient;
UniversalTelegramBot bot(BOT_TOKEN, secClient);

DNSServer dnsServer;
WebServer server(80);

// --- Global Variables ---
bool isOnlineMode = false;     
bool autoMode = false;         
bool pumpStatus = false;       
int servoPosition = 90;        

float currentTemp = 0.0;
float currentAirHum = 0.0;
int currentSoilMoist = 0;
float currentLux = 0.0;

unsigned long lastSystemCheck = 0;
unsigned long lastTrackerCheck = 0;

// --- Web UI HTML/CSS/JS ---
const char HTML_CONTENT[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="km">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>កសិកម្មឌីជីថល - Smart Agriculture</title>
    <link href="https://fonts.googleapis.com/css2?family=Battambang:wght@400;700;900&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { 
            background-color: #f8fafc; 
            padding: 20px; 
            color: #1e293b; 
            font-family: 'Battambang', 'Times New Roman', serif;
        }

        .container { max-width: 1050px; margin: 0 auto; }

        .header-section {
            text-align: center;
            margin-bottom: 25px;
            padding: 20px;
            background: #ffffff;
            border-radius: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.04);
            border: 1px solid #e2e8f0;
            position: relative;
        }

        .header-main {
            font-family: 'Battambang', cursive;
            font-size: 34px;
            font-weight: 900;
            color: #15803d;
            line-height: 1.3;
        }

        .header-sub {
            font-family: 'Times New Roman', serif;
            font-size: 22px;
            font-weight: 700;
            color: #1e3a8a;
            margin-top: 5px;
        }

        .mode-pill {
            display: inline-block;
            margin-top: 10px;
            padding: 4px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 700;
        }

        .mode-online { background: #dcfce7; color: #15803d; }
        .mode-offline { background: #fef3c7; color: #b45309; }

        .en-font {
            font-family: 'Times New Roman', serif !important;
        }

        .grid-top { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 18px; margin-bottom: 20px; }
        .grid-bottom { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 18px; }

        .card { 
            background: white; 
            border-radius: 20px; 
            padding: 22px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.03); 
            border: 1px solid #e2e8f0; 
            display: flex; 
            flex-direction: column; 
            justify-content: space-between; 
            min-height: 210px; 
        }

        .card-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .card-title { font-size: 18px; font-weight: 700; color: #0f172a; }
        .card-sub { font-size: 13px; color: #64748b; font-weight: 700; }
        .badge { font-size: 13px; background: #ecfdf5; color: #10b981; padding: 4px 12px; border-radius: 12px; font-weight: 700; }
        .v-badge { font-size: 14px; color: #94a3b8; font-weight: 700; }

        .gauge-box { position: relative; width: 100%; height: 100px; margin-top: 10px; text-align: center; }
        .gauge-svg { width: 180px; height: 100px; }
        .gauge-bg { fill: none; stroke: #e2e8f0; stroke-width: 14; stroke-linecap: round; }
        .gauge-fill { fill: none; stroke-width: 14; stroke-linecap: round; transition: stroke-dasharray 0.5s ease-in-out; }
        .gauge-val { position: absolute; bottom: 5px; width: 100%; font-size: 32px; font-weight: 700; color: #0f172a; }
        .gauge-minmax { display: flex; justify-content: space-between; font-size: 13px; color: #64748b; font-weight: 700; padding: 0 20px; }

        .lux-container { display: flex; align-items: baseline; gap: 8px; margin-top: 25px; }
        .lux-val { font-size: 48px; font-weight: 700; color: #f59e0b; line-height: 1; }
        .lux-unit { font-size: 22px; font-weight: 700; color: #334155; }
        .lux-footer { font-size: 14px; font-weight: 700; color: #f59e0b; text-align: right; margin-top: auto; }

        .control-card { 
            background: white; 
            border-radius: 20px; 
            padding: 20px 24px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.03); 
            border: 1px solid #e2e8f0; 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
        }
        .control-info { display: flex; align-items: center; gap: 14px; }
        .icon-circle { width: 46px; height: 46px; border-radius: 14px; background: #e0f2fe; display: flex; align-items: center; justify-content: center; font-size: 22px; }
        .control-title { font-size: 17px; font-weight: 700; color: #0f172a; }
        .status-tag { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; margin-top: 2px; }
        .dot { width: 10px; height: 10px; border-radius: 50%; }

        .switch { position: relative; display: inline-block; width: 54px; height: 30px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .3s; border-radius: 34px; }
        .slider:before { position: absolute; content: ""; height: 22px; width: 22px; left: 4px; bottom: 4px; background-color: white; transition: .3s; border-radius: 50%; }
        input:checked + .slider { background-color: #10b981; }
        input:checked + .slider.blue { background-color: #3b82f6; }
        input:checked + .slider:before { transform: translateX(24px); }
    </style>
</head>
<body>
<div class="container">

    <div class="header-section">
        <div class="header-main">កសិកម្មឌីជីថល</div>
        <div class="header-sub">ប្រព័ន្ធ Smart Agriculture ( Smart Irrigation, Smart Solar Tracking )</div>
        <div id="mode-badge" class="mode-pill mode-offline">កំពុងពិនិត្យ Mode...</div>
    </div>

    <div class="grid-top">
        <div class="card">
            <div class="card-header">
                <span class="card-title">សីតុណ្ហភាពបរិយាកាស</span>
            </div>
            <div class="gauge-box">
                <svg class="gauge-svg" viewBox="0 0 100 55">
                    <path class="gauge-bg" d="M 12 50 A 38 38 0 0 1 88 50"></path>
                    <path id="temp-gauge" class="gauge-fill" stroke="#f97316" d="M 12 50 A 38 38 0 0 1 88 50" stroke-dasharray="0 120"></path>
                </svg>
                <div class="gauge-val"><span id="temp-val" class="en-font">--</span><span class="en-font" style="font-size: 18px;"> °C</span></div>
            </div>
            <div class="gauge-minmax"><span class="en-font">15</span><span class="en-font">60</span></div>
        </div>

        <div class="card">
            <div class="card-header">
                <div>
                    <div class="card-title en-font">Soil Moisture</div>
                    <div class="card-sub">សំណើមដី (<span class="en-font">Soil Moisture</span>)</div>
                </div>
                <span class="badge" id="soil-status">--</span>
            </div>
            <div class="gauge-box">
                <svg class="gauge-svg" viewBox="0 0 100 55">
                    <path class="gauge-bg" d="M 12 50 A 38 38 0 0 1 88 50"></path>
                    <path id="soil-gauge" class="gauge-fill" stroke="#10b981" d="M 12 50 A 38 38 0 0 1 88 50" stroke-dasharray="0 120"></path>
                </svg>
                <div class="gauge-val"><span id="soil-val" class="en-font">--</span><span class="en-font" style="font-size: 18px;">%</span></div>
            </div>
            <div class="gauge-minmax"><span class="en-font">0</span><span class="en-font">100</span></div>
        </div>

        <div class="card">
            <div class="card-header">
                <div>
                    <div class="card-title">មុំផ្ទាំងសូឡា</div>
                    <div class="card-sub en-font">Solar Angle Tracking</div>
                </div>
            </div>
            <div class="gauge-box">
                <svg class="gauge-svg" viewBox="0 0 100 55">
                    <path class="gauge-bg" d="M 12 50 A 38 38 0 0 1 88 50"></path>
                    <path id="solar-gauge" class="gauge-fill" stroke="#f59e0b" d="M 12 50 A 38 38 0 0 1 88 50" stroke-dasharray="0 120"></path>
                </svg>
                <div class="gauge-val"><span id="solar-val" class="en-font">--</span><span class="en-font" style="font-size: 18px;">°</span></div>
            </div>
            <div class="gauge-minmax"><span class="en-font">0</span><span class="en-font">180</span></div>
        </div>

        <div class="card">
            <div class="card-header">
                <span class="card-title">កម្រិតពន្លឺព្រះអាទិត្យ</span>
                <span class="v-badge en-font">V4</span>
            </div>
            <div class="lux-container">
                <div class="lux-val en-font" id="lux-val">0</div>
                <div class="lux-unit en-font">Lux</div>
            </div>
            <div class="lux-footer en-font" id="lux-status">Good Light</div>
        </div>
    </div>

    <div class="grid-bottom">
        <div class="control-card">
            <div class="control-info">
                <div class="icon-circle">💧</div>
                <div>
                    <div class="control-title">ម៉ូទ័របូមទឹកកសិកម្ម</div>
                    <div class="status-tag">
                        <div class="dot" id="pump-dot" style="background: #94a3b8;"></div>
                        <span id="pump-status-text">បិទ (<span class="en-font">OFF</span>)</span>
                    </div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="v-badge en-font">V0</span>
                <label class="switch">
                    <input type="checkbox" id="pump-switch" onchange="togglePump(this.checked)">
                    <span class="slider"></span>
                </label>
            </div>
        </div>

        <div class="control-card">
            <div class="control-info">
                <div class="icon-circle" style="background: #eff6ff;">⚙️</div>
                <div>
                    <div class="control-title">មុខងារស្រោចទឹកស្វ័យប្រវត្តិ</div>
                    <div class="status-tag">
                        <div class="dot" id="auto-dot" style="background: #94a3b8;"></div>
                        <span id="auto-status-text">បិទ (<span class="en-font">OFF</span>)</span>
                    </div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="v-badge en-font">V3</span>
                <label class="switch">
                    <input type="checkbox" id="auto-switch" onchange="toggleAuto(this.checked)">
                    <span class="slider blue"></span>
                </label>
            </div>
        </div>
    </div>

</div>

<script>
    function setArcGauge(id, val, min, max) {
        let percent = (val - min) / (max - min);
        if (percent < 0) percent = 0;
        if (percent > 1) percent = 1;
        let totalArc = 119.3;
        let fillLength = percent * totalArc;
        document.getElementById(id).setAttribute("stroke-dasharray", \`\${fillLength} \${totalArc}\`);
    }

    function fetchSensorData() {
        fetch('/readSensors')
            .then(res => res.json())
            .then(data => {
                let modeBadge = document.getElementById('mode-badge');
                if (data.is_online) {
                    modeBadge.innerText = "ONLINE MODE (ភ្ជាប់អ៊ីនធឺណិត) | AP: 192.168.4.5";
                    modeBadge.className = "mode-pill mode-online";
                } else {
                    modeBadge.innerText = "OFFLINE MODE (Direct Hotspot AP: 192.168.4.5)";
                    modeBadge.className = "mode-pill mode-offline";
                }

                document.getElementById('temp-val').innerText = data.temp.toFixed(1);
                setArcGauge('temp-gauge', data.temp, 15, 60);

                document.getElementById('soil-val').innerText = data.soil_moist;
                setArcGauge('soil-gauge', data.soil_moist, 0, 100);
                let soilBadge = document.getElementById('soil-status');

                if (data.soil_moist >= 90) {
                    soilBadge.innerText = "ដីមានសំណើមខ្លាំង";
                    soilBadge.style.background = "#dbeafe";
                    soilBadge.style.color = "#1d4ed8";
                } else if (data.soil_moist >= 65) {
                    soilBadge.innerText = "សំណើមដីគ្រប់គ្រាន់";
                    soilBadge.style.background = "#ecfdf5";
                    soilBadge.style.color = "#10b981";
                } else if (data.soil_moist >= 30) {
                    soilBadge.innerText = "ដីមានសំណើមបន្តិច";
                    soilBadge.style.background = "#fef3c7";
                    soilBadge.style.color = "#d97706";
                } else {
                    soilBadge.innerText = "ដីស្ងួតខ្លាំង";
                    soilBadge.style.background = "#fef2f2";
                    soilBadge.style.color = "#ef4444";
                }

                document.getElementById('solar-val').innerText = data.servo;
                setArcGauge('solar-gauge', data.servo, 0, 180);

                document.getElementById('lux-val').innerText = Math.round(data.lux);
                let luxStatus = document.getElementById('lux-status');
                if(data.lux > 20000) luxStatus.innerText = "Strong Direct Light";
                else if(data.lux > 1000) luxStatus.innerText = "Good Light";
                else luxStatus.innerText = "Low Light";

                document.getElementById('pump-switch').checked = data.pump;
                document.getElementById('auto-switch').checked = data.auto;

                document.getElementById('pump-dot').style.background = data.pump ? "#10b981" : "#94a3b8";
                document.getElementById('pump-status-text').innerHTML = data.pump ? "បើក (<span class='en-font'>ON</span>)" : "បិទ (<span class='en-font'>OFF</span>)";
                document.getElementById('pump-status-text').style.color = data.pump ? "#10b981" : "#64748b";

                document.getElementById('auto-dot').style.background = data.auto ? "#3b82f6" : "#94a3b8";
                document.getElementById('auto-status-text').innerHTML = data.auto ? "ស្វ័យប្រវត្តិ (<span class='en-font'>AUTO</span>)" : "បិទ (<span class='en-font'>OFF</span>)";
                document.getElementById('auto-status-text').style.color = data.auto ? "#3b82f6" : "#64748b";
            })
            .catch(err => console.error("Error fetching data:", err));
    }

    function togglePump(state) {
        fetch('/controlPump?state=' + (state ? 1 : 0)).then(() => fetchSensorData());
    }

    function toggleAuto(state) {
        fetch('/toggleAuto?state=' + (state ? 1 : 0)).then(() => fetchSensorData());
    }

    setInterval(fetchSensorData, 1000);
    fetchSensorData();
</script>
</body>
</html>
)rawliteral";

void controlPump(bool state) {
  digitalWrite(RELAY_PIN, state ? HIGH : LOW);
  pumpStatus = state;
}

void readAllSensors() {
  float lux = lightMeter.readLightLevel();
  if (lux >= 0) currentLux = lux;

  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  if (!isnan(temp)) currentTemp = temp;
  if (!isnan(hum)) currentAirHum = hum;

  int raw_soil = analogRead(SOIL_PIN);
  currentSoilMoist = constrain(map(raw_soil, DryValue, WetValue, 0, 100), 0, 100);

  if (autoMode) {
    if (currentSoilMoist < 65) {
      if (!pumpStatus) controlPump(true);
    } else {
      if (pumpStatus) controlPump(false);
    }
  }
}

void checkSolarTracker() {
  int ldrLeft = analogRead(LDR_LEFT_PIN);   
  int ldrRight = analogRead(LDR_RIGHT_PIN); 
  int diff = ldrLeft - ldrRight;

  if (abs(diff) > 100) { 
    if (diff < 0) { 
      if (servoPosition < 160) servoPosition += 2; 
    } else {        
      if (servoPosition > 20) servoPosition -= 2;  
    }
    solarServo.write(servoPosition); 
  }
}

void handleRoot() {
  server.send(200, "text/html; charset=UTF-8", HTML_CONTENT);
}

void handleSensorData() {
  readAllSensors();

  String json = "{";
  json += "\\"temp\\":" + String(currentTemp, 1) + ",";
  json += "\\"air_hum\\":" + String(currentAirHum, 1) + ",";
  json += "\\"soil_moist\\":" + String(currentSoilMoist) + ",";
  json += "\\"lux\\":" + String(currentLux, 0) + ",";
  json += "\\"servo\\":" + String(servoPosition) + ",";
  json += "\\"pump\\":" + String(pumpStatus ? "true" : "false") + ",";
  json += "\\"auto\\":" + String(autoMode ? "true" : "false") + ",";
  json += "\\"is_online\\":" + String(isOnlineMode ? "true" : "false");
  json += "}";
  server.send(200, "application/json", json);
}

void handleControlPump() {
  if (server.hasArg("state")) {
    int state = server.arg("state").toInt();
    controlPump(state == 1);
  }
  server.send(200, "text/plain", "OK");
}

void handleToggleAuto() {
  if (server.hasArg("state")) {
    int state = server.arg("state").toInt();
    autoMode = (state == 1);
  } else {
    autoMode = !autoMode;
  }

  if (autoMode) {
    readAllSensors();
  } else {
    controlPump(false);
  }

  server.send(200, "text/plain", "OK");
}

// --- Captive Portal Redirect Handler ---
void handleCaptivePortal() {
  IPAddress requestedIP = server.client().localIP();
  if (requestedIP != ap_local_ip) {
    server.sendHeader("Location", "http://192.168.4.5/", true);
    server.send(302, "text/plain", "");
    return;
  }
  handleRoot();
}

void setup() {
  Serial.begin(115200);
  secClient.setInsecure();

  Wire.begin(21, 22); 
  lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE);

  pinMode(RELAY_PIN, OUTPUT);
  pinMode(SOLAR_RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);
  digitalWrite(SOLAR_RELAY_PIN, HIGH);

  ESP32PWM::allocateTimer(0);
  solarServo.setPeriodHertz(50); 
  solarServo.attach(SERVO_PIN, 500, 2400); 
  solarServo.write(servoPosition); 
  dht.begin();

  // ១. កំណត់ Wi-Fi ជា AP + STA Dual Mode
  WiFi.mode(WIFI_AP_STA);
  
  // បើក Access Point Hotspot ជានិច្ច ទោះមាន ឬគ្មាន Router
  WiFi.softAPConfig(ap_local_ip, ap_gateway, ap_subnet);
  WiFi.softAP(ap_ssid, ap_password);
  
  // បើក DNS Server សម្រាប់ Captive Portal ជានិច្ច
  dnsServer.start(53, "*", ap_local_ip);

  // ព្យាយាមភ្ជាប់ទៅកាន់ Wi-Fi Router
  WiFi.begin(wifi_ssid, wifi_password);
  Serial.println("Searching for Wi-Fi Network (5s Timeout)...");

  unsigned long startAttemptTime = millis();

  // ២. រង់ចាំរយះពេល 5 វិនាទី (5000ms) ដើម្បីរក Router
  while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 5000) {
    delay(250);
    Serial.print(".");
  }

  // ៣. ពិនិត្យលទ្ធផលភ្ជាប់ Wi-Fi Router
  if (WiFi.status() == WL_CONNECTED) {
    isOnlineMode = true;
    String connectedIP = WiFi.localIP().toString();
    Serial.println("\\n[ONLINE MODE] Connected to Wi-Fi successfully!");
    Serial.print("Router Local IP Address: ");
    Serial.println(connectedIP);

    String notifyMsg = "Smart Agriculture ដំណើរការជោគជ័យ!\\nIP (Router): http://" + connectedIP + "\\nIP (Direct AP): http://192.168.4.5";
    bot.sendMessage(CHAT_ID, notifyMsg, "");
  } else {
    isOnlineMode = false;
    Serial.println("\\n[OFFLINE MODE] Wi-Fi Router not found within 5 seconds.");
    Serial.print("Running Direct AP Mode. IP: ");
    Serial.println(ap_local_ip);
  }

  // Server Routing ធម្មតា
  server.on("/", handleRoot);
  server.on("/readSensors", handleSensorData);
  server.on("/controlPump", handleControlPump);
  server.on("/toggleAuto", handleToggleAuto);

  // --- បន្ថែម Specific Routes សម្រាប់ទាក់ទាញ Captive Portal OS ផ្សេងៗ ---
  server.on("/generate_204", handleRoot);            // Android
  server.on("/gen_204", handleRoot);                 // Android
  server.on("/hotspot-detect.html", handleRoot);     // iOS / Apple
  server.on("/connecttest.txt", handleRoot);         // Microsoft Windows
  server.on("/redirect", handleRoot);                // Other OS
  
  // ប្រសិនបើចុចលើ Link ឬ Request ផ្សេងទៀត ឱ្យរត់ទៅ Captive Portal
  server.onNotFound(handleCaptivePortal);
  
  server.begin();
}

void loop() {
  // ដំណើរការ DNS Server ជានិច្ច (ទាំង Online និង Offline) ដើម្បីឱ្យ Captive Portal ដើរ
  dnsServer.processNextRequest();

  server.handleClient();

  if (millis() - lastSystemCheck >= 1000) {
    readAllSensors();
    lastSystemCheck = millis();
  }

  if (millis() - lastTrackerCheck >= 50) {
    checkSolarTracker();
    lastTrackerCheck = millis();
  }
}
`;

  // 5. Device 4: Traffic & Parking (ESP32 30-Pin)
  const esp32TrafficParkingCode = `/*
 // Dynamic Smart Traffic & Parking System - DHCP, mDNS & Captive Portal Version
//===========================Smart Traffic & Parking System=============================
#include <ESP32Servo.h>
#include <LiquidCrystal_I2C.h>
#include <HTTPClient.h> 
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <ESPmDNS.h> 
#include <WiFiClientSecure.h>
#include <Wire.h>
#include <UniversalTelegramBot.h>

// --- Wi-Fi & Telegram Credentials ---
const char* ap_ssid       = "Smart Traffic & Parking ESP32";
const char* ap_password   = "12345678";
const char* wifi_ssid     = "\${wifiSsid}"; 
const char* wifi_password = "\${wifiPass}"; 
const String BOT_TOKEN    = "\${telegramBotToken}";
const String CHAT_ID      = "\${telegramChatId}"; 

// --- AP Mode IP Config ---
IPAddress ap_local_ip(192, 168, 4, 2);
IPAddress ap_gateway(192, 168, 4, 2);
IPAddress ap_subnet(255, 255, 255, 0);

WiFiClientSecure secClient;
UniversalTelegramBot bot(BOT_TOKEN, secClient);

const byte DNS_PORT = 53;
DNSServer dnsServer;
WebServer server(80);

// --- Traffic Light Pins (A, B, C, D) ---
#define A_RED    13
#define A_YELLOW 12
#define A_GREEN  14

#define B_RED    27
#define B_YELLOW 25
#define B_GREEN  32

#define C_RED    19
#define C_YELLOW 18
#define C_GREEN  5

#define D_RED    16
#define D_YELLOW 17
#define D_GREEN  2 

// --- IR Sensor Pins ---
#define IR_A_PIN  26
#define IR_B_PIN  35
#define IR_C_PIN  33
#define IR_D_PIN  34

// --- Smart Parking Pins ---
const int IR1         = 4;    // សេនស័រចូល
const int IR2         = 15;   // សេនស័រចេញ
const int SERVO_PIN   = 23;   // ម៉ូទ័រ Servo

LiquidCrystal_I2C lcd(0x27, 16, 2); 
Servo myservo; 

// --- Global Variables ---
bool wifiConnected = false;

// --- Traffic Logic Variables ---
enum IntersectionState { 
  A_LEADING_GREEN, 
  AC_GREEN_PHASE,  
  AC_YELLOW_PHASE, 
  BD_GREEN_PHASE,  
  BD_YELLOW_PHASE  
};

IntersectionState currentState = A_LEADING_GREEN;
unsigned long stateStartTime = 0;
const unsigned long YELLOW_DURATION = 2000;      
const unsigned long LEADING_DURATION = 5000;     

int carCountA = 0, carCountB = 0, carCountC = 0, carCountD = 0;
int carCountAC = 0, carCountBD = 0;
bool lastIrA = HIGH, lastIrB = HIGH, lastIrC = HIGH, lastIrD = HIGH;

// --- Parking Variables ---
int Slot = 3;             // ចំនួនចំណតសរុប 3
int flag1 = 0;            // ស្ថានភាពពិនិត្យឡានចូល
int flag2 = 0;            // ស្ថានភាពពិនិត្យឡានចេញ
int lastDisplayedSlot = -1; 

// --- Web UI HTML/CSS ---
const char HTML_CONTENT[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="km">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Smart Traffic & Parking</title>
    <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; font-family: 'Kantumruy Pro', sans-serif; margin: 0; padding: 0; }
        body { background-color: #f4f7f6; padding: 20px; color: #333; }
        .container { max-width: 900px; margin: 0 auto; }
        .grid-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .card { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: space-between; min-height: 140px; }
        .card-header { display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: #64748b; font-weight: 600; }
        .v-tag { font-size: 11px; background: #f1f5f9; padding: 2px 8px; border-radius: 6px; color: #10b981; font-weight: 700; }
        .card-body { display: flex; align-items: baseline; gap: 10px; margin: 10px 0; }
        .val-num { font-size: 48px; font-weight: 700; line-height: 1; }
        .val-unit { font-size: 14px; color: #64748b; font-weight: 600; }
        .card-footer { font-size: 13px; font-weight: 600; }
        .parking-val { color: #059669; }
        .road-a-val { color: #2563eb; }
        .road-b-val { color: #a855f7; }
        .road-c-val { color: #eab308; }
        .road-d-val { color: #ef4444; }
        .traffic-heavy { color: #ef4444; }
        .traffic-medium { color: #2563eb; }
        .traffic-smooth { color: #a855f7; }
    </style>
</head>
<body>
<div class="container">
    <div class="grid-container">
        <div class="card">
            <div class="card-header"><span>ចំណតយានយន្ត</span><span class="v-tag">V1</span></div>
            <div class="card-body">
                <span class="val-num parking-val" id="parking-slots">3</span>
                <span class="val-unit">កន្លែងទំនេរ</span>
            </div>
        </div>
    </div>
    <div class="grid-container">
        <div class="card">
            <div class="card-header"><span>យានជំនិះលើផ្លូវ A</span><span class="v-tag" style="color: #2563eb;">V2</span></div>
            <div class="card-body"><span class="val-num road-a-val" id="count-a">0</span></div>
            <div class="card-footer traffic-smooth" id="status-a">ចរាចរណ៍ស្រួល</div>
        </div>
        <div class="card">
            <div class="card-header"><span>យានជំនិះលើផ្លូវ B</span><span class="v-tag" style="color: #a855f7;">V3</span></div>
            <div class="card-body"><span class="val-num road-b-val" id="count-b">0</span></div>
            <div class="card-footer traffic-smooth" id="status-b">ចរាចរណ៍ស្រួល</div>
        </div>
        <div class="card">
            <div class="card-header"><span>យានជំនិះលើផ្លូវ C</span><span class="v-tag" style="color: #eab308;">V4</span></div>
            <div class="card-body"><span class="val-num road-c-val" id="count-c">0</span></div>
            <div class="card-footer traffic-smooth" id="status-c">ចរាចរណ៍ស្រួល</div>
        </div>
        <div class="card">
            <div class="card-header"><span>យានជំនិះលើផ្លូវ D</span><span class="v-tag" style="color: #ef4444;">V5</span></div>
            <div class="card-body"><span class="val-num road-d-val" id="count-d">0</span></div>
            <div class="card-footer traffic-smooth" id="status-d">ចរាចរណ៍ស្រួល</div>
        </div>
    </div>
</div>
<script>
    function updateDashboard() {
        fetch('/readSensors')
            .then(res => res.json())
            .then(data => {
                document.getElementById('parking-slots').innerText = data.slot;
                updateRoad('a', data.countA);
                updateRoad('b', data.countB);
                updateRoad('c', data.countC);
                updateRoad('d', data.countD);
            })
            .catch(err => console.error(err));
    }
    function updateRoad(road, count) {
        document.getElementById(\`count-\${road}\`).innerText = count;
        const statusEl = document.getElementById(\`status-\${road}\`);
        if (count >= 3) {
            statusEl.innerText = 'ចរាចរណ៍កកស្ទះ';
            statusEl.className = 'card-footer traffic-heavy';
        } else if (count >= 1) {
            statusEl.innerText = 'ចរាចរណ៍មធ្យម';
            statusEl.className = 'card-footer traffic-medium';
        } else {
            statusEl.innerText = 'ចរាចរណ៍ស្រួល';
            statusEl.className = 'card-footer traffic-smooth';
        }
    }
    setInterval(updateDashboard, 1000);
</script>
</body>
</html>
)rawliteral";

void sendTelegram(String message) {
  if (wifiConnected) {
    bot.sendMessage(CHAT_ID, message, "");
  }
}

unsigned long getSmartDuration(int carCount) {
  if (carCount >= 3) return 12000; 
  if (carCount > 0) return 7000;    
  return 4000;                     
}

void manageTrafficLights() {
  unsigned long currentMillis = millis();
  
  if (digitalRead(IR_A_PIN) == LOW && lastIrA == HIGH) { carCountA++; carCountAC++; }
  lastIrA = digitalRead(IR_A_PIN);

  if (digitalRead(IR_C_PIN) == LOW && lastIrC == HIGH) { carCountC++; carCountAC++; }
  lastIrC = digitalRead(IR_C_PIN);

  if (digitalRead(IR_B_PIN) == LOW && lastIrB == HIGH) { carCountB++; carCountBD++; }
  lastIrB = digitalRead(IR_B_PIN);

  if (digitalRead(IR_D_PIN) == LOW && lastIrD == HIGH) { carCountD++; carCountBD++; }
  lastIrD = digitalRead(IR_D_PIN);

  switch (currentState) {
    case A_LEADING_GREEN:
      digitalWrite(A_GREEN, HIGH); digitalWrite(A_YELLOW, LOW);  digitalWrite(A_RED, LOW);
      digitalWrite(C_GREEN, LOW);  digitalWrite(C_YELLOW, LOW);  digitalWrite(C_RED, HIGH);
      digitalWrite(B_GREEN, LOW);  digitalWrite(B_YELLOW, LOW);  digitalWrite(B_RED, HIGH);
      digitalWrite(D_GREEN, LOW);  digitalWrite(D_YELLOW, LOW);  digitalWrite(D_RED, HIGH);

      if (currentMillis - stateStartTime >= LEADING_DURATION) {
        currentState = AC_GREEN_PHASE;
        stateStartTime = currentMillis;
      }
      break;

    case AC_GREEN_PHASE:
      digitalWrite(A_GREEN, HIGH); digitalWrite(A_YELLOW, LOW);  digitalWrite(A_RED, LOW);
      digitalWrite(C_GREEN, HIGH); digitalWrite(C_YELLOW, LOW);  digitalWrite(C_RED, LOW);
      digitalWrite(B_GREEN, LOW);  digitalWrite(B_YELLOW, LOW);  digitalWrite(B_RED, HIGH);
      digitalWrite(D_GREEN, LOW);  digitalWrite(D_YELLOW, LOW);  digitalWrite(D_RED, HIGH);

      if (currentMillis - stateStartTime >= getSmartDuration(carCountAC)) {
        currentState = AC_YELLOW_PHASE;
        stateStartTime = currentMillis;
      }
      break;

    case AC_YELLOW_PHASE:
      digitalWrite(A_GREEN, LOW);  digitalWrite(A_YELLOW, HIGH); digitalWrite(A_RED, LOW);
      digitalWrite(C_GREEN, LOW);  digitalWrite(C_YELLOW, HIGH); digitalWrite(C_RED, LOW);
      digitalWrite(B_GREEN, LOW);  digitalWrite(B_YELLOW, LOW);  digitalWrite(B_RED, HIGH);
      digitalWrite(D_GREEN, LOW);  digitalWrite(D_YELLOW, LOW);  digitalWrite(D_RED, HIGH);

      if (currentMillis - stateStartTime >= YELLOW_DURATION) {
        currentState = BD_GREEN_PHASE;
        stateStartTime = currentMillis;
        carCountA = 0; carCountC = 0; carCountAC = 0;
      }
      break;

    case BD_GREEN_PHASE:
      digitalWrite(A_GREEN, LOW);  digitalWrite(A_YELLOW, LOW);  digitalWrite(A_RED, HIGH);
      digitalWrite(C_GREEN, LOW);  digitalWrite(C_YELLOW, LOW);  digitalWrite(C_RED, HIGH);
      digitalWrite(B_GREEN, HIGH); digitalWrite(B_YELLOW, LOW); digitalWrite(B_RED, LOW);
      digitalWrite(D_GREEN, HIGH); digitalWrite(D_YELLOW, LOW); digitalWrite(D_RED, LOW);

      if (currentMillis - stateStartTime >= getSmartDuration(carCountBD)) {
        currentState = BD_YELLOW_PHASE;
        stateStartTime = currentMillis;
      }
      break;

    case BD_YELLOW_PHASE:
      digitalWrite(A_GREEN, LOW);  digitalWrite(A_YELLOW, LOW);  digitalWrite(A_RED, HIGH);
      digitalWrite(C_GREEN, LOW);  digitalWrite(C_YELLOW, LOW);  digitalWrite(C_RED, HIGH);
      digitalWrite(B_GREEN, LOW);  digitalWrite(B_YELLOW, HIGH); digitalWrite(B_RED, LOW);
      digitalWrite(D_GREEN, LOW);  digitalWrite(D_YELLOW, HIGH); digitalWrite(D_RED, LOW);

      if (currentMillis - stateStartTime >= YELLOW_DURATION) {
        currentState = A_LEADING_GREEN;
        stateStartTime = currentMillis;
        carCountB = 0; carCountD = 0; carCountBD = 0;
      }
      break;
  }
}

// --- យក Logic គ្រប់គ្រង Parking ពីកូដចាស់មកវិញទាំងស្រុង ---
void manageSmartParking() {
  // --- ផ្នែកឡានចូល (ENTRANCE LOGIC) ---
  if (digitalRead(IR1) == LOW && flag1 == 0) {
    if (Slot > 0) { 
      flag1 = 1;    
      if (flag2 == 0) {
        myservo.write(0);  // បើករបារទ្វារ (0 ដឺក្រេ)
        Slot = Slot - 1;   // ដកចំនួនចំណតសល់
      }
    } else { 
      // បើពេញ (Slot == 0) បង្ហាញសារថាពេញ
      lcd.setCursor(0, 0); lcd.print("    SORRY :(    ");  
      lcd.setCursor(0, 1); lcd.print("  Parking Full  "); 
      delay(1500);
      lcd.clear(); 
      lastDisplayedSlot = -1; 
      return;
    }
  }

  // --- ផ្នែកឡានចេញ (EXIT LOGIC) ---
  if (digitalRead(IR2) == LOW && flag2 == 0) {
    flag2 = 1; 
    if (flag1 == 0) {
      myservo.write(0);    // បើករបារទ្វារឲ្យឡានចេញ (0 ដឺក្រេ)
      Slot = Slot + 1;     // បន្ថែមចំនួនចំណតទំនេរឡើងវិញ
      if (Slot > 3) {
        Slot = 3;          // កុំឱ្យលើសពី 3
      }
    }
  }

  // --- ផ្នែកបិទទ្វារវិញ និង Reset ស្ថានភាព (រង់ចាំ ៣ វិនាទី និងបិទនៅ 90 ដឺក្រេ) ---
  if (flag1 == 1 && flag2 == 1) {
    static unsigned long gM = 0; 
    if (gM == 0) gM = millis(); 
    if (millis() - gM >= 3000) { // រង់ចាំ ៣ វិនាទី
      myservo.write(90);       // បិទរបារទ្វារវិញនៅ 90 ដឺក្រេ
      flag1 = flag2 = 0;             
      gM = 0;
      lcd.clear();           
      lastDisplayedSlot = -1; 
    }
  }

  // --- ផ្នែកបង្ហាញលទ្ធផលធម្មតាលើអេក្រង់ LCD (កំណត់ត្រឹម 3 Slots) ---
  if (flag1 == 0 && flag2 == 0) {
    if (Slot != lastDisplayedSlot) {
      lcd.setCursor(0, 0);
      lcd.print("    WELCOME!    ");
      lcd.setCursor(0, 1);
      lcd.print("Slot Left: ");
      lcd.print(Slot);       
      lcd.print("   ");        
      lastDisplayedSlot = Slot;
    }
  }
}

// --- Web Server Handlers ---
void handleRoot() {
  server.send(200, "text/html; charset=UTF-8", HTML_CONTENT);
}

void handleSensorData() {
  String json = "{";
  json += "\\"slot\\":" + String(Slot) + ",";
  json += "\\"countA\\":" + String(carCountA) + ",";
  json += "\\"countB\\":" + String(carCountB) + ",";
  json += "\\"countC\\":" + String(carCountC) + ",";
  json += "\\"countD\\":" + String(carCountD);
  json += "}";
  server.send(200, "application/json", json);
}

void handleCaptivePortal() {
  IPAddress requestedIP = server.client().localIP();
  if (requestedIP != ap_local_ip) {
    server.sendHeader("Location", "http://192.168.4.2/", true);
    server.send(302, "text/plain", "");
    return;
  }
  handleRoot();
}

void setup() {
  Serial.begin(115200); 
  secClient.setInsecure(); 

  // បន្ថែម delay និង Wire.begin ដូចកូដចាស់
  delay(500);
  Wire.begin(21, 22); 
  
  lcd.init();          
  lcd.backlight(); 
  lcd.clear();

  // បង្ហាញ Startup Screen
  lcd.setCursor(0, 0);
  lcd.print("     SPS-PDH      ");
  lcd.setCursor(0, 1);
  lcd.print(" PARKING SYSTEM ");
  delay(2000);
  lcd.clear();

  // Pins Setup
  pinMode(A_RED, OUTPUT); pinMode(A_YELLOW, OUTPUT); pinMode(A_GREEN, OUTPUT);
  pinMode(B_RED, OUTPUT); pinMode(B_YELLOW, OUTPUT); pinMode(B_GREEN, OUTPUT);
  pinMode(C_RED, OUTPUT); pinMode(C_YELLOW, OUTPUT); pinMode(C_GREEN, OUTPUT);
  pinMode(D_RED, OUTPUT); pinMode(D_YELLOW, OUTPUT); pinMode(D_GREEN, OUTPUT);

  pinMode(IR_A_PIN, INPUT); pinMode(IR_B_PIN, INPUT);
  pinMode(IR_C_PIN, INPUT); pinMode(IR_D_PIN, INPUT);
  pinMode(IR1, INPUT); pinMode(IR2, INPUT);

  ESP32PWM::allocateTimer(0); 
  myservo.setPeriodHertz(50); 
  myservo.attach(SERVO_PIN, 500, 2400); 
  myservo.write(90); 

  // --- Wi-Fi Configuration (Dynamic DHCP) ---
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAPConfig(ap_local_ip, ap_gateway, ap_subnet);
  WiFi.softAP(ap_ssid, ap_password);

  Serial.println("Connecting to Wi-Fi...");
  WiFi.begin(wifi_ssid, wifi_password);
  
  unsigned long startAttemptTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 10000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\\n[INFO] Wi-Fi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());

    if (MDNS.begin("smarttraffic")) {
      Serial.println("[INFO] mDNS responder started: http://smarttraffic.local");
    }

    sendTelegram("Smart Light Control ភ្ជាប់ Wi-Fi ជោគជ័យ!\\nIP: " + WiFi.localIP().toString() + "\\nURL: http://smarttraffic.local");
  } else {
    wifiConnected = false;
    Serial.println("\\n[INFO] Operating in Access Point Mode.");
  }

  dnsServer.start(DNS_PORT, "*", ap_local_ip);

  // Routes
  server.on("/", handleRoot);
  server.on("/readSensors", handleSensorData);
  
  // Captive Portal Routes
  server.on("/generate_204", handleRoot);            
  server.on("/gen_204", handleRoot);                 
  server.on("/hotspot-detect.html", handleRoot);     
  server.on("/connecttest.txt", handleRoot);         
  server.on("/redirect", handleRoot);

  server.onNotFound(handleCaptivePortal);            
  server.begin();
}

void loop() {
  dnsServer.processNextRequest();
  server.handleClient();

  manageTrafficLights(); 
  manageSmartParking(); 
}
`;


  const esp32SchoolLightsCode = `/*
 * ==============================================================================
 * Project: ESP32 30-Pin sovannaphumi school Phsar Dey hoy Lights - Smart Relay System (Dual-Mode AP + Cloud STA)
 * Hardware: ESP32 30-Pin (WROOM-32D)
 * Wi-Fi: AP ("SmartBin-ESP32" 192.168.4.1) + STA ("\${wifiSsid}") with Cloud Polling Sync
 * Actuators: Light sovannaphumi school Phsar Dey hoy (GPIO 19), Building Light (GPIO 21), Playground Light (GPIO 22)
 * Telegram Alerts: Bot "\${telegramBotToken}" -> Chat ID "\${telegramChatId}"
 * ==============================================================================
 */

#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <HTTPClient.h>

// Pin Definitions for ESP32 30-Pin Board
#define LED_SCHOOL_PIN     19  // ភ្លើងសាលាសុវណ្ណភូមិផ្សារដីហុយ
#define LED_BUILDING_PIN   21  // ភ្លើងអគារ
#define LED_PLAYGROUND_PIN 22  // ភ្លើង Playground

// 1. ESP32 Hotspot Credentials
const char* ap_ssid = "SmartBin-ESP32";
const char* ap_password = "12345678";

// 2. Wi-Fi Home/Router Credentials (សម្រាប់ ESP32 ភ្ជាប់អុីនធឺណិត)
const char* wifi_ssid = "${wifiSsid}";        // ដាក់ឈ្មោះ Wi-Fi ផ្ទះ/Hotspot
const char* wifi_password = "${wifiPass}"; // ដាក់លេខសម្ងាត់ Wi-Fi

// Telegram Credentials
const String BOT_TOKEN = "${telegramBotToken}";
const String CHAT_ID   = "${telegramChatId}";

IPAddress local_ip(192, 168, 4, 1);
IPAddress gateway(192, 168, 4, 1);
IPAddress subnet(255, 255, 255, 0);

const byte DNS_PORT = 53;
DNSServer dnsServer;
WebServer server(80);

// HTML Dashboard
const char HTML_CONTENT[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Smart System Dashboard</title>
    <style>
        * { box-sizing: border-box; }
        body {
            background-color: #f4f4f4;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            font-family: Arial, sans-serif;
            user-select: none;
            padding: 20px;
            gap: 20px;
        }
        .card {
            background: #ffffff;
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            text-align: center;
            width: 100%;
            max-width: 480px;
        }
        h2 { color: #333333; margin-top: 0; margin-bottom: 15px; }

        /* Switches UI */
        .status-container { display: flex; gap: 10px; justify-content: space-around; margin-bottom: 15px; }
        .status-title { font-size: 13px; font-weight: bold; color: #222222; width: 33%; }
        .wall-panel {
            background: linear-gradient(145deg, #e0b458, #b88a30);
            padding: 16px;
            border-radius: 12px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .switches-frame {
            display: flex;
            background-color: #1a1a1a;
            border: 4px solid #1a1a1a;
            border-radius: 6px;
            gap: 4px;
            overflow: hidden;
        }
        .switch-rocker {
            width: 90px;
            height: 160px;
            background: linear-gradient(180deg, #c49631, #a3781f);
            position: relative;
            cursor: pointer;
        }
        .led-indicator {
            position: absolute;
            top: 15px;
            left: 20px;
            width: 50px;
            height: 8px;
            border-radius: 4px;
            background-color: #2a2a2a;
        }
        .led-indicator.active {
            background-color: #80ffff;
            box-shadow: 0 0 8px #80ffff, 0 0 15px rgba(128, 255, 255, 0.8);
        }
        .brand-logo { margin-top: 10px; font-size: 14px; font-weight: bold; font-style: italic; color: #5c4310; letter-spacing: 2px; }
        .labels-container { display: flex; gap: 10px; justify-content: space-around; margin-top: 15px; }
        .switch-label { font-size: 12px; font-weight: bold; color: #444444; width: 33%; }
    </style>
</head>
<body>

    <!-- Widget: Switches -->
    <div class="card">
        <h2>ប្រព័ន្ធគ្រប់គ្រងភ្លើង (School Relays)</h2>
        <div class="status-container">
            <div id="status1" class="status-title">សាលា: OFF</div>
            <div id="status2" class="status-title">អគារ: OFF</div>
            <div id="status3" class="status-title">Playground: OFF</div>
        </div>
        <div class="wall-panel">
            <div class="switches-frame">
                <div class="switch-rocker" onclick="toggleLED(1)">
                    <div id="led1" class="led-indicator"></div>
                </div>
                <div class="switch-rocker" onclick="toggleLED(2)">
                    <div id="led2" class="led-indicator"></div>
                </div>
                <div class="switch-rocker" onclick="toggleLED(3)">
                    <div id="led3" class="led-indicator"></div>
                </div>
            </div>
            <div class="brand-logo">SGT</div>
        </div>
        <div class="labels-container">
            <div id="label1" class="switch-label">ភ្លើងសាលាសុវណ្ណភូមិផ្សារដីហុយ</div>
            <div id="label2" class="switch-label">ភ្លើងអគារ</div>
            <div id="label3" class="switch-label">ភ្លើង Playground</div>
        </div>
    </div>

    <script>
        let states = {1: false, 2: false, 3: false};
        const names = {1: "សាលា", 2: "អគារ", 3: "Playground"};

        function toggleLED(num) {
            let stateNow = states[num];
            let endpoint = "/led" + num + (stateNow ? "/off" : "/on");

            fetch(endpoint)
                .then(response => response.text())
                .then(state => {
                    const led = document.getElementById("led" + num);
                    const status = document.getElementById("status" + num);

                    if (state === "1") {
                        led.classList.add("active");
                        status.innerText = names[num] + ": ON";
                        states[num] = true;
                    } else {
                        led.classList.remove("active");
                        status.innerText = names[num] + ": OFF";
                        states[num] = false;
                    }
                });
        }
    </script>
</body>
</html>
)rawliteral";

// URL Encode function for Telegram API
String urlEncode(String str) {
  String encodedString = "";
  char c;
  for (unsigned int i = 0; i < str.length(); i++) {
    c = str.charAt(i);
    if (isalnum(c)) {
      encodedString += c;
    } else {
      char code1 = (c & 0xf) + '0';
      if ((c & 0xf) > 9) code1 = (c & 0xf) - 10 + 'A';
      c = (c >> 4) & 0xf;
      char code2 = c + '0';
      if (c > 9) code2 = c - 10 + 'A';
      encodedString += '%';
      encodedString += code2;
      encodedString += code1;
    }
  }
  return encodedString;
}

// Telegram Alert Function
void sendTelegramMessage(String message) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String encodedMessage = urlEncode(message);
    String url = "https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage?chat_id=" + CHAT_ID + "&text=" + encodedMessage;
    
    WiFiClientSecure client;
    client.setInsecure();
    http.begin(client, url);
    
    http.GET();
    http.end();
  }
}

void handleRoot() { 
  server.send(200, "text/html; charset=UTF-8", HTML_CONTENT); 
}

void handleLed1On()  { digitalWrite(LED_SCHOOL_PIN, HIGH); server.send(200, "text/plain", "1"); }
void handleLed1Off() { digitalWrite(LED_SCHOOL_PIN, LOW);  server.send(200, "text/plain", "0"); }

void handleLed2On()  { digitalWrite(LED_BUILDING_PIN, HIGH); server.send(200, "text/plain", "1"); }
void handleLed2Off() { digitalWrite(LED_BUILDING_PIN, LOW);  server.send(200, "text/plain", "0"); }

void handleLed3On()  { digitalWrite(LED_PLAYGROUND_PIN, HIGH); server.send(200, "text/plain", "1"); }
void handleLed3Off() { digitalWrite(LED_PLAYGROUND_PIN, LOW);  server.send(200, "text/plain", "0"); }

void handleNotFound() {
  server.sendHeader("Location", "http://192.168.4.1/", true);
  server.send(302, "text/plain", "");
}

// Forward real readings / Pull relay commands to/from Web Cloud Dashboard if connected to Wi-Fi
unsigned long lastCloudSync = 0;
void syncWithCloud() {
  if (WiFi.status() == WL_CONNECTED && millis() - lastCloudSync > 1000) {
    lastCloudSync = millis();
    HTTPClient http;
    
    // Polling V1, V2, and V3 relay states from the cloud server
    // Fetches {"v1": 0, "v2": 1, "v3": 0} and applies them locally in real-time
    String url = "${serverUrl}/api/iot/get?token=${blynkAuthToken}";
    
    if (url.startsWith("https://")) {
      WiFiClientSecure client;
      client.setInsecure();
      http.begin(client, url);
    } else {
      http.begin(url);
    }
    
    http.setTimeout(2500);
    int httpCode = http.GET();
    
    if (httpCode == 200) {
      String payload = http.getString();
      
      // Robust JSON parsing (handles spaces or no spaces)
      if (payload.indexOf("\"v1\":1") != -1 || payload.indexOf("\"v1\": 1") != -1) digitalWrite(LED_SCHOOL_PIN, HIGH);
      else if (payload.indexOf("\"v1\":0") != -1 || payload.indexOf("\"v1\": 0") != -1) digitalWrite(LED_SCHOOL_PIN, LOW);
      
      if (payload.indexOf("\"v2\":1") != -1 || payload.indexOf("\"v2\": 1") != -1) digitalWrite(LED_BUILDING_PIN, HIGH);
      else if (payload.indexOf("\"v2\":0") != -1 || payload.indexOf("\"v2\": 0") != -1) digitalWrite(LED_BUILDING_PIN, LOW);
      
      if (payload.indexOf("\"v3\":1") != -1 || payload.indexOf("\"v3\": 1") != -1) digitalWrite(LED_PLAYGROUND_PIN, HIGH);
      else if (payload.indexOf("\"v3\":0") != -1 || payload.indexOf("\"v3\": 0") != -1) digitalWrite(LED_PLAYGROUND_PIN, LOW);
    }
    http.end();
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(LED_SCHOOL_PIN, OUTPUT);
  pinMode(LED_BUILDING_PIN, OUTPUT);
  pinMode(LED_PLAYGROUND_PIN, OUTPUT);

  digitalWrite(LED_SCHOOL_PIN, LOW);
  digitalWrite(LED_BUILDING_PIN, LOW);
  digitalWrite(LED_PLAYGROUND_PIN, LOW);

  WiFi.mode(WIFI_AP_STA);
  WiFi.softAPConfig(local_ip, gateway, subnet);
  WiFi.softAP(ap_ssid, ap_password);

  WiFi.begin(wifi_ssid, wifi_password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 15) {
    delay(500);
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    sendTelegramMessage("WiFi ភ្ជាប់ជោគជ័យ! IP: " + WiFi.localIP().toString());
  }

  dnsServer.start(DNS_PORT, "*", WiFi.softAPIP());

  server.on("/", handleRoot);
  server.on("/led1/on", handleLed1On);
  server.on("/led1/off", handleLed1Off);
  server.on("/led2/on", handleLed2On);
  server.on("/led2/off", handleLed2Off);
  server.on("/led3/on", handleLed3On);
  server.on("/led3/off", handleLed3Off);
  server.onNotFound(handleNotFound);

  server.begin();
}

void loop() {
  dnsServer.processNextRequest();
  server.handleClient();
  syncWithCloud();
}
`;

  // 6. Standalone Direct Web Server (No Blynk Required)
  const esp32DirectWebServerCode = `/*
 * Project: ESP32 Standalone Dual-Mode Web Server & Captive Portal
 * No Blynk Server required - Local AP + Router WiFi Direct Control
 */
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>

const char* ap_ssid = "ESP32-DualMode-Direct";
const char* ap_pass = "12345678";
IPAddress apIP(192, 168, 0, 169);
IPAddress netMsk(255, 255, 255, 0);

const char* ssid = "\${wifiSsid}";
const char* password = "\${wifiPass}";

WebServer server(80);
DNSServer dnsServer;
#define PIN_LAMP \${lampPin}

bool lampState = false;

void handleRoot() {
  String html = "<!DOCTYPE html><html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>";
  html += "<title>ESP32 Direct Controller</title>";
  html += "<style>body{font-family:sans-serif;text-align:center;padding:30px;background:#0f172a;color:#fff;}";
  html += ".card{background:#1e293b;padding:24px;border-radius:18px;max-width:400px;margin:auto;}";
  html += ".btn{display:inline-block;padding:14px 28px;font-size:16px;font-weight:bold;color:#fff;border-radius:12px;text-decoration:none;margin:8px;}";
  html += ".btn-on{background:#10b981;} .btn-off{background:#ef4444;}</style></head><body>";
  html += "<div class='card'>";
  html += "<h2>💡 SPS-PEH Direct Chip Control</h2>";
  html += "<p>Status: " + String(lampState ? "<b style='color:#10b981'>ON</b>" : "<b style='color:#ef4444'>OFF</b>") + "</p>";
  html += "<a href='/on' class='btn btn-on'>TURN ON (បើក)</a> ";
  html += "<a href='/off' class='btn btn-off'>TURN OFF (បិទ)</a>";
  html += "</div></body></html>";
  server.send(200, "text/html", html);
}

void handleControl() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  if (server.hasArg("val")) {
    int val = server.arg("val").toInt();
    lampState = (val == 1);
    digitalWrite(PIN_LAMP, lampState ? HIGH : LOW);
    server.send(200, "application/json", "{\\"success\\":true,\\"lamp\\":" + String(val) + "}");
    return;
  }
  server.send(400, "text/plain", "Missing val");
}

void handleOn() {
  lampState = true;
  digitalWrite(PIN_LAMP, HIGH);
  handleRoot();
}

void handleOff() {
  lampState = false;
  digitalWrite(PIN_LAMP, LOW);
  handleRoot();
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LAMP, OUTPUT);
  digitalWrite(PIN_LAMP, LOW);

  WiFi.mode(WIFI_AP_STA);
  WiFi.softAPConfig(apIP, apIP, netMsk);
  WiFi.softAP(ap_ssid, ap_pass);
  dnsServer.start(53, "*", apIP);

  WiFi.begin(ssid, password);

  server.on("/", handleRoot);
  server.on("/control", handleControl);
  server.on("/on", handleOn);
  server.on("/off", handleOff);
  server.onNotFound([]() {
    server.sendHeader("Location", "http://192.168.0.169/", true);
    server.send(302, "text/plain", "Captive Portal Redirect");
  });
  server.begin();
}

void loop() {
  dnsServer.processNextRequest();
  server.handleClient();
}
`;

  // Initialize custom code editor with the active template if empty
  useEffect(() => {
    const saved = localStorage.getItem('sps_peh_custom_arduino_code');
    if (saved && saved.length > 50) {
      setCustomCode(saved);
    } else {
      setCustomCode(esp32SchoolLightsCode);
    }
  }, []);

  const handleTemplateChange = (preset: 'esp32_cam_smartlamp' | 'esp32_30pin_alert' | 'esp32_30pin_smartbin' | 'esp32_30pin_irrigation' | 'esp32_30pin_traffic' | 'esp32_direct_webserver' | 'esp32_school_lights') => {
    setEditorTemplatePreset(preset);
    let newCode = esp32CamSmartLampCode;
    if (preset === 'esp32_30pin_alert') newCode = esp32AlertSystemCode;
    if (preset === 'esp32_30pin_smartbin') newCode = esp32SmartBinCode;
    if (preset === 'esp32_30pin_irrigation') newCode = esp32IrrigationCode;
    if (preset === 'esp32_30pin_traffic') newCode = esp32TrafficParkingCode;
    if (preset === 'esp32_direct_webserver') newCode = esp32DirectWebServerCode;
    if (preset === 'esp32_school_lights') newCode = esp32SchoolLightsCode;
    setCustomCode(newCode);
    localStorage.setItem('sps_peh_custom_arduino_code', newCode);
  };

  const saveCustomCode = () => {
    localStorage.setItem('sps_peh_custom_arduino_code', customCode);
    setCodeSavedNotification(true);
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.3 } });
    setTimeout(() => setCodeSavedNotification(false), 2500);
  };

  const resetCustomCodeToCurrentTemplate = () => {
    let base = esp32CamSmartLampCode;
    if (editorTemplatePreset === 'esp32_30pin_alert') base = esp32AlertSystemCode;
    if (editorTemplatePreset === 'esp32_30pin_smartbin') base = esp32SmartBinCode;
    if (editorTemplatePreset === 'esp32_30pin_irrigation') base = esp32IrrigationCode;
    if (editorTemplatePreset === 'esp32_30pin_traffic') base = esp32TrafficParkingCode;
    if (editorTemplatePreset === 'esp32_direct_webserver') base = esp32DirectWebServerCode;
    if (editorTemplatePreset === 'esp32_school_lights') base = esp32SchoolLightsCode;
    setCustomCode(base);
    localStorage.setItem('sps_peh_custom_arduino_code', base);
  };

  // Quick insertion helpers for Live Code Editor
  const insertSnippet = (snippet: string) => {
    setCustomCode((prev) => prev + '\n' + snippet);
  };

  // Send Remote Command to Chip (Supports Blynk Cloud REST API, Local IP Webhook, & Web Serial)
  const dispatchChipCommand = async (pin: string, value: number) => {
    setRemoteDispatching(true);
    setRemoteStatusMessage(null);

    try {
      if (pin === 'V0') setRemoteLampState(value);
      if (pin === 'V4') setRemoteFlashState(value);
      if (pin === 'V1') setRemoteGasSimState(value);

      // Web Serial Mode
      if (remoteDispatchMode === 'web_serial' && serialConnected && serialPort) {
        const encoder = new TextEncoder();
        const writer = serialPort.writable.getWriter();
        await writer.write(encoder.encode(`${pin}=${value}\n`));
        writer.releaseLock();
        setRemoteStatusMessage(`[Web Serial] Sent: ${pin}=${value}`);
        return;
      }

      // Backend / Blynk Cloud / Local IP Forwarder
      if (remoteDispatchMode === 'local_ip' && chipTargetIp) {
        // Direct browser-to-chip local HTTP call (bypasses cloud NAT and HTTPS mixed-content blocks)
        try {
          const actionPath = value === 1 ? 'on' : 'off';
          const targetUrl = `http://${chipTargetIp}/${actionPath}?t=${Date.now()}`;

          // 1. Image Beacon (bypasses standard fetch CORS)
          const beacon = new Image();
          beacon.src = targetUrl;

          // 2. Hidden Iframe Dispatch
          let hiddenIframe = document.getElementById('esp_hidden_sender') as HTMLIFrameElement;
          if (!hiddenIframe) {
            hiddenIframe = document.createElement('iframe');
            hiddenIframe.id = 'esp_hidden_sender';
            hiddenIframe.style.display = 'none';
            document.body.appendChild(hiddenIframe);
          }
          hiddenIframe.src = targetUrl;

          // 3. Background fetch attempt
          fetch(`http://${chipTargetIp}/control?pin=${pin.toLowerCase()}&val=${value}`, { mode: 'no-cors' }).catch(() => {});
          fetch(`http://${chipTargetIp}/api/update?${pin.toLowerCase()}=${value}`, { mode: 'no-cors' }).catch(() => {});
        } catch (e) {
          console.error("Local direct dispatch error:", e);
        }
      }

      const response = await fetch('/api/iot/chip/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: device?.id || 'dev_smart_lamp_mq135',
          pin,
          value,
          blynkToken: blynkAuthToken,
          chipIp: remoteDispatchMode === 'local_ip' ? chipTargetIp : undefined,
          sendTelegram: pin === 'V0',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setRemoteStatusMessage(
          lang === 'km'
            ? `✅ បានបញ្ជាទៅ Chip ជោគជ័យ: ${pin} -> ${value === 1 ? 'ON (បើក)' : 'OFF (បិទ)'}`
            : `✅ Dispatched to Chip successfully: ${pin} -> ${value === 1 ? 'ON' : 'OFF'}`
        );
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.5 } });
      } else {
        setRemoteStatusMessage(`❌ Error: ${data.error || 'Failed to dispatch'}`);
      }
    } catch (err: any) {
      setRemoteStatusMessage(`❌ Error: ${err?.message || 'Network dispatch failed'}`);
    } finally {
      setRemoteDispatching(false);
    }
  };

  // Web Serial API connection handler
  const handleConnectWebSerial = async () => {
    if (!('serial' in navigator)) {
      alert(lang === 'km' 
        ? 'កម្មវិធីរុករករបស់អ្នកមិនទាន់គាំទ្រ Web Serial API ទេ (សូមប្រើ Chrome ឬ Edge លើ PC ឬ Android OTG)' 
        : 'Web Serial API not supported in this browser. Please use Chrome/Edge on Desktop or Android OTG.');
      return;
    }

    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });
      setSerialPort(port);
      setSerialConnected(true);
      setSerialLogs((prev) => [...prev, `[Connected] Port opened at 115200 baud`]);

      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      serialReaderRef.current = reader;

      readSerialStream(reader);
    } catch (err: any) {
      console.error(err);
      alert('Serial connection failed: ' + err.message);
    }
  };

  const readSerialStream = async (reader: any) => {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          setSerialLogs((prev) => [...prev.slice(-80), value]);
        }
      }
    } catch (err) {
      console.log('Serial read error:', err);
    }
  };

  const handleDisconnectWebSerial = async () => {
    if (serialReaderRef.current) {
      await serialReaderRef.current.cancel();
    }
    if (serialPort) {
      await serialPort.close();
      setSerialPort(null);
      setSerialConnected(false);
      setSerialLogs((prev) => [...prev, '[Disconnected] Serial port closed']);
    }
  };

  const sendCustomSerialCommand = async () => {
    if (!serialInput.trim() || !serialPort || !serialConnected) return;
    try {
      const encoder = new TextEncoder();
      const writer = serialPort.writable.getWriter();
      await writer.write(encoder.encode(serialInput + '\n'));
      writer.releaseLock();
      setSerialLogs((prev) => [...prev, `> ${serialInput}`]);
      setSerialInput('');
    } catch (err: any) {
      console.error(err);
    }
  };

  const sendTestTelegram = async () => {
    setTelegramTesting(true);
    setTelegramStatus(null);
    try {
      const res = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: telegramBotToken,
          chatId: telegramChatId,
          message: `🔔 <b>[SPS-PEH IoT Cloud Notification]</b>\n\n✅ <b>Smart_Lamp & MQ135 System Online!</b>\n💡 <b>Smart_Lamp Relay:</b> GPIO ${lampPin} (Blynk V0)\n💨 <b>MQ-135 Gas Sensor:</b> GPIO ${mq135Pin} (Blynk V1)\n📶 <b>WiFi Network:</b> ${wifiSsid}\n⏰ <b>Timestamp:</b> ${new Date().toLocaleTimeString()}\n\n<i>សារសាកល្បងនេះត្រូវបានផ្ញើចេញពី SPS-PEH IoT Dashboard ដោយជោគជ័យ។</i>`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTelegramStatus('success');
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.4 } });
      } else {
        setTelegramStatus('error: ' + (data.error || 'Failed to send'));
      }
    } catch (err: any) {
      setTelegramStatus('error: ' + (err.message || 'Network error'));
    } finally {
      setTelegramTesting(false);
    }
  };

  const blynkHeaderSnippet = `// Fill-in information from your Blynk Template here
#define BLYNK_TEMPLATE_ID   "${blynkTemplateId}"
#define BLYNK_TEMPLATE_NAME "${blynkTemplateName}"
#define BLYNK_AUTH_TOKEN    "${blynkAuthToken}"

// Telegram Bot Credentials
#define TELEGRAM_BOT_TOKEN  "${telegramBotToken}"
#define TELEGRAM_CHAT_ID    "${telegramChatId}"`;

  const copyCustomCode = () => {
    navigator.clipboard.writeText(customCode);
    setCopiedCode(true);
    confetti({ particleCount: 40, spread: 70, origin: { y: 0.3 } });
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const copyDefines = () => {
    navigator.clipboard.writeText(blynkHeaderSnippet);
    setCopiedDefines(true);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.25 } });
    setTimeout(() => setCopiedDefines(false), 2500);
  };

  const downloadInoFile = () => {
    const blob = new Blob([customCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Blynk_${blynkTemplateId}_${blynkTemplateName.replace(/[^a-zA-Z0-9]/g, '_')}.ino`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sampleCurl = `curl -X GET "${serverUrl}/api/iot/update?token=${blynkAuthToken}&v0=1&v1=92&v2=29.4&v5=350&v6=68.5"`;

  const copyCurlCmd = () => {
    navigator.clipboard.writeText(sampleCurl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div id="esp32-firmware-studio-view" className="space-y-5">
      {/* 1. Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-white">
                  {lang === 'km' ? 'Blynk IoT & ESP32 Code Studio' : 'Blynk IoT & ESP32 Code Studio'}
                </h1>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  LIVE EDITOR & REMOTE CHIP CONTROL
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'km'
                  ? 'កែសម្រួលកូដ Arduino C++ ផ្ទាល់ក្នុងកម្មវិធី និងបញ្ជាទៅកាន់ Chip (ESP32/ESP32-CAM) ពីគ្រប់ទូរស័ព្ទ កុំព្យូទ័រ ឬ Tablet'
                  : 'Live In-Browser C++ Code Editor with direct cross-device remote control to ESP32 / ESP32-CAM microcontrollers.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="copy-firmware-code-btn"
              onClick={copyCustomCode}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? (lang === 'km' ? 'បានចម្លងកូដ!' : 'Copied Code!') : (lang === 'km' ? 'ចម្លងកូដ' : 'Copy Code')}</span>
            </button>

            <button
              id="download-ino-file-btn"
              onClick={downloadInoFile}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs border border-slate-700 transition"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>{lang === 'km' ? 'ទាញយក .ino' : 'Download .ino'}</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation tabs */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs font-semibold overflow-x-auto pb-1">
          {[
            { key: 'editor', label: 'Live Code Editor', labelKhmer: 'កែសម្រួល & ផ្លាស់ប្តូរកូដភ្លាមៗ', icon: <Edit3 className="w-3.5 h-3.5 text-amber-400" /> },
            { key: 'remote', label: 'Remote Chip Controller', labelKhmer: 'បញ្ជាទៅ Chip ពីគ្រប់ Device', icon: <Radio className="w-3.5 h-3.5 text-emerald-400" /> },
            { key: 'telegram', label: 'Telegram Bot Alerts', labelKhmer: 'ប្រព័ន្ធ Telegram Alert', icon: <Bot className="w-3.5 h-3.5 text-sky-400" /> },
            { key: 'code', label: 'C++ Code View', labelKhmer: 'ទិដ្ឋភាពកូដ C++', icon: <Code2 className="w-3.5 h-3.5" /> },
            { key: 'guide', label: 'Flashing Guide', labelKhmer: 'ការដំឡើង & Flash', icon: <BookOpen className="w-3.5 h-3.5" /> },
            { key: 'wiring', label: 'Hardware Wiring', labelKhmer: 'តារាងតខ្សែ GPIO', icon: <Layers className="w-3.5 h-3.5" /> },
            { key: 'api', label: 'REST API & Webhook', labelKhmer: 'តេស្ត API & cURL', icon: <Terminal className="w-3.5 h-3.5" /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeSubTab === tab.key
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{lang === 'km' ? tab.labelKhmer : tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. PROMINENT BLYNK TEMPLATE CREDENTIALS BOX (#define Snippet) */}
      <div className="bg-slate-900/95 border-2 border-emerald-500/40 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{lang === 'km' ? 'ព័ត៌មានសម្គាល់ Blynk Template (Blynk Device Info)' : 'Blynk Device Info & #define Credentials'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700">
                  TOP 3 LINES
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'km'
                  ? 'អ្នកអាចកែសម្រួល ឬចម្លង ៣បន្ទាត់នេះទៅដាក់លើគេបង្អស់នៃកូដ Arduino IDE'
                  : 'Copy and paste these 3 lines at the very top of your Arduino sketch.'}
              </p>
            </div>
          </div>

          <button
            onClick={copyDefines}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold transition shadow-sm self-start sm:self-auto"
          >
            {copiedDefines ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedDefines ? (lang === 'km' ? 'បានចម្លង 3 បន្ទាត់!' : 'Copied 3 Defines!') : (lang === 'km' ? 'ចម្លង 3 បន្ទាត់ #define' : 'Copy 3 #define Lines')}</span>
          </button>
        </div>

        {/* Input fields to edit template credentials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              #define BLYNK_TEMPLATE_ID
            </label>
            <input
              type="text"
              value={blynkTemplateId}
              onChange={(e) => {
                setBlynkTemplateId(e.target.value);
                setCustomCode((prev) => prev.replace(/#define BLYNK_TEMPLATE_ID\s+"[^"]*"/, `#define BLYNK_TEMPLATE_ID    "${e.target.value}"`));
              }}
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-emerald-400 font-mono text-xs font-bold focus:outline-none"
              placeholder="e.g. TMPL_SMART_LAMP_MQ135"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              #define BLYNK_TEMPLATE_NAME
            </label>
            <input
              type="text"
              value={blynkTemplateName}
              onChange={(e) => {
                setBlynkTemplateName(e.target.value);
                setCustomCode((prev) => prev.replace(/#define BLYNK_TEMPLATE_NAME\s+"[^"]*"/, `#define BLYNK_TEMPLATE_NAME  "${e.target.value}"`));
              }}
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none"
              placeholder="e.g. Smart_Lamp & MQ135"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              #define BLYNK_AUTH_TOKEN
            </label>
            <input
              type="text"
              value={blynkAuthToken}
              onChange={(e) => {
                setBlynkAuthToken(e.target.value);
                setCustomCode((prev) => prev.replace(/#define BLYNK_AUTH_TOKEN\s+"[^"]*"/, `#define BLYNK_AUTH_TOKEN     "${e.target.value}"`));
              }}
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-cyan-400 font-mono text-xs font-bold focus:outline-none"
              placeholder="e.g. YOUR_BLYNK_AUTH_TOKEN"
            />
          </div>
        </div>

        {/* Relay Module Trigger Logic Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-xs font-bold text-white block">
                {lang === 'km' ? 'ប្រភេទ Relay Module (Trigger Logic):' : 'Relay Module Trigger Mode:'}
              </span>
              <span className="text-[11px] text-slate-400">
                {lang === 'km'
                  ? '៩៩% នៃ Relay Module លើទីផ្សារជាប្រភេទ Active LOW (បញ្ជូន LOW ដើម្បីបើក)'
                  : 'Almost all 5V/3.3V Relay modules for Arduino/ESP32 are Active LOW.'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-700 self-start sm:self-auto">
            <button
              onClick={() => {
                setRelayActiveLow(true);
                setCustomCode((prev) =>
                  prev.replace(/digitalWrite\(SMART_LAMP_PIN,\s*lampState\s*==\s*1\s*\?\s*HIGH\s*:\s*LOW\);/, 'digitalWrite(SMART_LAMP_PIN, lampState == 1 ? LOW : HIGH);')
                );
              }}
              className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                relayActiveLow ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Active LOW (Relay Module) ⚡
            </button>
            <button
              onClick={() => {
                setRelayActiveLow(false);
                setCustomCode((prev) =>
                  prev.replace(/digitalWrite\(SMART_LAMP_PIN,\s*lampState\s*==\s*1\s*\?\s*LOW\s*:\s*HIGH\);/, 'digitalWrite(SMART_LAMP_PIN, lampState == 1 ? HIGH : LOW);')
                );
              }}
              className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                !relayActiveLow ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Active HIGH (Direct LED) 💡
            </button>
          </div>
        </div>

        {/* Save Bar for Template Credentials */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-slate-800">
          <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            {lang === 'km' ? 'រក្សាទុកស្វ័យប្រវត្តិក្នង Browser (Auto-saved)' : 'Auto-saved in LocalStorage'}
          </span>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem('sps_peh_template_id', blynkTemplateId);
              localStorage.setItem('sps_peh_template_name', blynkTemplateName);
              localStorage.setItem('sps_peh_auth_token', blynkAuthToken);
              triggerSaveNotification('✅ បានរក្សាទុក Blynk Template Info ជោគជ័យ!');
            }}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{lang === 'km' ? 'រក្សាទុកការកំណត់ (Save All)' : 'Save Configuration'}</span>
          </button>
        </div>

        {/* Live Code Preview snippet */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 relative select-all overflow-x-auto">
          <pre className="text-emerald-400 font-bold">{blynkHeaderSnippet}</pre>
        </div>
      </div>

      {/* ⚠️ PROMINENT HARDWARE TROUBLESHOOTING & RELAY GUIDE */}
      <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm sm:text-base font-extrabold text-amber-300 flex items-center gap-2">
              <span>{lang === 'km' ? '🔧 ហេតុអ្វី Telegram ផ្ញើសារថាបើក តែអំពូលពិត (Relay/LED) មិនទាន់ភ្លឺ?' : '🔧 Why Telegram alerts ON but Physical Lamp / Relay is not lighting up?'}</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {lang === 'km'
                ? 'នៅពេល Telegram ផ្ញើសារបាន នោះបញ្ជាក់ថា Chip ESP32 ទទួលបានបញ្ជាពី Cloud រួចរាល់ ១០០% ហើយ! មូលហេតុចម្បងដែលអំពូលពិតមិនភ្លឺ គឺបណ្ដាលមកពី ៣ ចំណុចខាងក្រោម៖'
                : 'Since Telegram successfully sent the alert, it proves the ESP32 received the command! The hardware not turning on is caused by one of these 3 reasons:'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
          {/* Reason 1 */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-amber-500/30 space-y-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold font-mono">
              មូលហេតុ #១ (៩៥% ជួបញឹកញាប់)
            </span>
            <h4 className="font-bold text-white text-xs">Relay Module ជាប្រភេទ Active LOW</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Relay module ភាគច្រើន ត្រូវបញ្ជូនសញ្ញា <strong>LOW (0)</strong> ទើបវាទាញបើក Relay (Click សំឡេងតាក់) ហើយបញ្ជូន <strong>HIGH (1)</strong> ដើម្បីបិទ។
            </p>
            <div className="p-2 bg-slate-900 rounded font-mono text-[10px] text-amber-400 border border-slate-800">
              digitalWrite(12, LOW); // បើក Relay
            </div>
          </div>

          {/* Reason 2 */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-cyan-500/30 space-y-2">
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold font-mono">
              មូលហេតុ #២ (ការតខ្សែ VCC/GND/IN)
            </span>
            <h4 className="font-bold text-white text-xs">តខ្សែជើង Relay Module</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              • ជើង <strong>VCC</strong> របស់ Relay ត្រូវតទៅ <strong>5V</strong> របស់ ESP32-CAM<br/>
              • ជើង <strong>GND</strong> តទៅ <strong>GND</strong><br/>
              • ជើង <strong>IN</strong> តទៅ <strong>GPIO 12</strong> (ឬ 13, 2, 14)<br/>
              • ខ្សែអំពូលភ្លើងត្រូវកាត់តភ្ជាប់រវាង <strong>COM</strong> និង <strong>NO</strong> (Normally Open)។
            </p>
          </div>

          {/* Reason 3 */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-emerald-500/30 space-y-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold font-mono">
              តេស្ត Flash LED Onboard
            </span>
            <h4 className="font-bold text-white text-xs">Flash LED (GPIO 4) លើ ESP32-CAM</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              យើងបានបន្ថែមឲ្យកូដបើក <strong>Flash LED ពណ៌ស (GPIO 4)</strong> នៅលើ ESP32-CAM ផ្ទាល់ដំណាលគ្នា។ នៅពេលអ្នកចុចបើក V0 ភ្លើង Flash លើបន្ទះ Chip នឹងភ្លឺច្បាស់ភ្លាមៗ!
            </p>
            <button
              onClick={() => dispatchChipCommand('V0', 1)}
              className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition text-[11px]"
            >
              តេស្តចុចបើក V0 ឥឡូវនេះ 💡
            </button>
          </div>
        </div>
      </div>

      {/* SUB TAB 1: LIVE IN-APP CODE EDITOR */}
      {activeSubTab === 'editor' && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Edit3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{lang === 'km' ? 'កន្លែងកែសម្រួល & ផ្លាស់ប្ដូរកូដ Arduino C++ ផ្ទាល់' : 'Live In-App Arduino C++ Code Editor'}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-700">
                    INTERACTIVE IDE
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'km'
                    ? 'អ្នកអាចសរសេរ កែសម្រួល ឬបិទភ្ជាប់កូដ C++ របស់អ្នកនៅទីនេះ ហើយរក្សាទុក ឬទាញយកភ្លាមៗ'
                    : 'Edit, customize, or paste your Arduino C++ code here with live formatting and instant download.'}
                </p>
              </div>
            </div>

            {/* Template Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-400 font-semibold mr-1">{lang === 'km' ? 'ជ្រើសរើស Device Template:' : 'Device Preset:'}</span>
              <button
                onClick={() => handleTemplateChange('esp32_school_lights')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                  editorTemplatePreset === 'esp32_school_lights'
                    ? 'bg-purple-500/25 text-purple-300 border-purple-500/60 shadow-md ring-1 ring-purple-400/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                🏫💡 Dev 7: ESP32 30-Pin sovannaphumi school Phsar Dey hoy Lights
              </button>
              <button
                onClick={() => handleTemplateChange('esp32_cam_smartlamp')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                  editorTemplatePreset === 'esp32_cam_smartlamp'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                📸 Dev 5: ESP32-CAM Smart Lamp
              </button>
              <button
                onClick={() => handleTemplateChange('esp32_30pin_alert')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                  editorTemplatePreset === 'esp32_30pin_alert'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                🚨 Dev 1: ESP32 30-Pin Alert System
              </button>
              <button
                onClick={() => handleTemplateChange('esp32_30pin_smartbin')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                  editorTemplatePreset === 'esp32_30pin_smartbin'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                🗑️ Dev 2: ESP32 30-Pin Smart Bin
              </button>
              <button
                onClick={() => handleTemplateChange('esp32_30pin_irrigation')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                  editorTemplatePreset === 'esp32_30pin_irrigation'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                🌱 Dev 3: ESP32 30-Pin Irrigation
              </button>
              <button
                onClick={() => handleTemplateChange('esp32_30pin_traffic')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                  editorTemplatePreset === 'esp32_30pin_traffic'
                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                🚦 Dev 4: ESP32 30-Pin Traffic
              </button>
              <button
                onClick={() => handleTemplateChange('esp32_direct_webserver')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                  editorTemplatePreset === 'esp32_direct_webserver'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                ⚡ Standalone Direct Web (No Blynk)
              </button>
            </div>
          </div>

          {/* Quick Snippet Injector Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 mr-1">{lang === 'km' ? 'បញ្ចូលរហ័ស:' : 'Insert / Replace:'}</span>
              <button
                onClick={() => {
                  setCustomCode((prev) =>
                    prev.replace(/char ssid\[\] = "[^"]*";/, `char ssid[] = "${wifiSsid}";`)
                        .replace(/char pass\[\] = "[^"]*";/, `char pass[] = "${wifiPass}";`)
                  );
                }}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-[11px] font-mono transition"
              >
                📶 Update WiFi ({wifiSsid})
              </button>
              <button
                onClick={() => {
                  setCustomCode((prev) =>
                    prev.replace(/const char\* TELEGRAM_BOT_TOKEN = "[^"]*";/, `const char\* TELEGRAM_BOT_TOKEN = "${telegramBotToken}";`)
                        .replace(/const char\* TELEGRAM_CHAT_ID   = "[^"]*";/, `const char\* TELEGRAM_CHAT_ID   = "${telegramChatId}";`)
                  );
                }}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-300 rounded-lg text-[11px] font-mono transition"
              >
                🤖 Update Telegram Bot Token
              </button>
              <button
                onClick={() => {
                  insertSnippet(`// Added Custom Virtual Pin\nBLYNK_WRITE(V3) {\n  int val = param.asInt();\n  Serial.println(val);\n}`);
                }}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-300 rounded-lg text-[11px] font-mono transition"
              >
                + Add BLYNK_WRITE(V3)
              </button>
            </div>

            {/* Font Size & Controls */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Size:</span>
              {[12, 13, 14, 16].map((sz) => (
                <button
                  key={sz}
                  onClick={() => setEditorFontSize(sz)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                    editorFontSize === sz ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sz}px
                </button>
              ))}
            </div>
          </div>

          {/* Main Interactive Code Editor Box */}
          <div className="relative rounded-xl border-2 border-slate-800 focus-within:border-emerald-500/70 overflow-hidden bg-slate-950 shadow-inner">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span className="text-slate-300 font-semibold ml-2">firmware.ino (Arduino C++)</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <span>{customCode.split('\n').length} Lines</span>
                <span>{customCode.length} Characters</span>
              </div>
            </div>

            <textarea
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              spellCheck={false}
              className="w-full h-[520px] bg-slate-950 p-4 font-mono text-emerald-400 focus:outline-none resize-y selection:bg-emerald-500/30 leading-relaxed border-none"
              style={{ fontSize: `${editorFontSize}px` }}
            />
          </div>

          {/* Editor Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={saveCustomCode}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition"
              >
                <Save className="w-4 h-4" />
                <span>{codeSavedNotification ? (lang === 'km' ? 'បានរក្សាទុក!' : 'Code Saved!') : (lang === 'km' ? 'រក្សាទុកកូដ (Save)' : 'Save Code')}</span>
              </button>

              <button
                onClick={resetCustomCodeToCurrentTemplate}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                <span>{lang === 'km' ? 'កំណត់ឡើងវិញ (Reset)' : 'Reset to Template'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSubTab('remote')}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20 transition"
              >
                <Radio className="w-4 h-4" />
                <span>{lang === 'km' ? 'តេស្តបញ្ជាទៅ Chip ផ្ទាល់' : 'Test Control Physical Chip'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 2: UNIVERSAL CROSS-DEVICE REMOTE CHIP CONTROLLER */}
      {activeSubTab === 'remote' && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{lang === 'km' ? 'បញ្ជាពីគ្រប់ Device តាមកម្មវិធីទៅកាន់ Chip' : 'Universal Cross-Device Remote Chip Controller'}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700">
                    REAL-TIME SYNC
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'km'
                    ? 'បញ្ជាអំពូល (Smart_Lamp), Flash LED, Sensor ឬ Reboot ESP32 ពីគ្រប់ទូរស័ព្ទ កុំព្យូទ័រ ឬ Tablet តាមរយៈ Blynk Cloud, Local IP ឬ Web Serial'
                    : 'Dispatch commands directly to physical ESP32 / ESP32-CAM via Blynk Cloud REST API, Local WiFi IP, or Web Serial.'}
                </p>
              </div>
            </div>

            {/* Protocol Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setRemoteDispatchMode('blynk_cloud')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  remoteDispatchMode === 'blynk_cloud'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Blynk Cloud API</span>
              </button>
              <button
                onClick={() => setRemoteDispatchMode('local_ip')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  remoteDispatchMode === 'local_ip'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>Local WiFi IP</span>
              </button>
              <button
                onClick={() => setRemoteDispatchMode('web_serial')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  remoteDispatchMode === 'web_serial'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Usb className="w-3.5 h-3.5" />
                <span>Web Serial (USB/OTG)</span>
              </button>
            </div>
          </div>

          {/* Protocol Configuration Box */}
          {remoteDispatchMode === 'blynk_cloud' && (
            <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  {lang === 'km' ? 'ផ្លូវបញ្ជាឆ្លងកាត់ Blynk Cloud (ទូទាំងពិភពលោក):' : 'Blynk Cloud REST API Route (Global Internet):'}
                </span>
                <span className="text-emerald-400 font-mono text-[11px] font-bold">Token: {blynkAuthToken.slice(0, 8)}...</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                {lang === 'km'
                  ? 'រាល់ពេលអ្នកចុចប៊ូតុងខាងក្រោម ប្រព័ន្ធនឹងផ្ញើសំណើ HTTP ទៅកាន់ Blynk Cloud Server ហើយ Chip ESP32 របស់អ្នកនឹងទទួលបញ្ជា BLYNK_WRITE(V0) ភ្លាមៗ!'
                  : 'Every switch action issues an authenticated HTTP PUT/GET to Blynk Cloud, triggering the real physical pin on your ESP32 in under 150ms.'}
              </p>
            </div>
          )}

          {remoteDispatchMode === 'local_ip' && (
            <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/30 rounded-xl text-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <Wifi className="w-4 h-4" />
                    {lang === 'km' ? 'អាសយដ្ឋាន Local IP របស់ ESP32 ក្នុងបណ្តាញ Wi-Fi:' : 'ESP32 Local Network IP Address:'}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {lang === 'km' ? 'រក្សាទុកស្វ័យប្រវត្តិ (Auto-saved into Storage)' : 'Auto-saved in LocalStorage'}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={chipTargetIp}
                      onChange={(e) => {
                        setChipTargetIp(e.target.value);
                        localStorage.setItem('sps_peh_chip_ip', e.target.value);
                      }}
                      placeholder="192.168.0.169"
                      className="bg-slate-950 border border-cyan-500/40 px-3 py-1.5 rounded-lg text-cyan-300 font-mono font-bold text-xs focus:outline-none focus:border-cyan-400 shadow-inner"
                    />
                    <span className="text-[11px] text-slate-400 font-mono">:80</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem('sps_peh_chip_ip', chipTargetIp);
                      triggerSaveNotification(`✅ បានរក្សាទុក IP: ${chipTargetIp} ជោគជ័យ!`);
                    }}
                    className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{lang === 'km' ? 'រក្សាទុក IP (Save)' : 'Save IP'}</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-cyan-500/20">
                <p className="text-slate-300 text-[11px]">
                  {lang === 'km'
                    ? 'បញ្ជាផ្ទាល់ក្នុងបណ្តាញ Wi-Fi ក្នុងផ្ទះ (Sub-10ms Latency) ដោយមិនចាំបាច់ឆ្លងកាត់ Cloud Server'
                    : 'Direct local webhook execution (sub-10ms latency) without requiring internet or third-party servers.'}
                </p>
                {chipTargetIp && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const ifr = (document.getElementById('esp_hidden_sender') as HTMLIFrameElement) || document.createElement('iframe');
                        ifr.id = 'esp_hidden_sender';
                        ifr.style.display = 'none';
                        document.body.appendChild(ifr);
                        ifr.src = `http://${chipTargetIp}/on?t=${Date.now()}`;
                        setRemoteLampState(1);
                        setRemoteStatusMessage('💡 បានបញ្ជូនទៅ IP បើក (ON) ជោគជ័យ!');
                      }}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20"
                    >
                      💡 ចុចបើកភ្លាម (LAN ON)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const ifr = (document.getElementById('esp_hidden_sender') as HTMLIFrameElement) || document.createElement('iframe');
                        ifr.id = 'esp_hidden_sender';
                        ifr.style.display = 'none';
                        document.body.appendChild(ifr);
                        ifr.src = `http://${chipTargetIp}/off?t=${Date.now()}`;
                        setRemoteLampState(0);
                        setRemoteStatusMessage('⭕ បានបញ្ជូនទៅ IP បិទ (OFF) ជោគជ័យ!');
                      }}
                      className="px-3 py-1.5 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-md shadow-rose-500/20"
                    >
                      ⭕ ចុចបិទភ្លាម (LAN OFF)
                    </button>
                    <a
                      href={`http://${chipTargetIp}/on`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-[10px]"
                    >
                      បើក New Tab
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {remoteDispatchMode === 'web_serial' && (
            <div className="p-3.5 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Usb className="w-4 h-4" />
                  {lang === 'km' ? 'ភ្ជាប់ខ្សែ USB / OTG ផ្ទាល់ទៅកាន់ ESP32 (115200 Baud):' : 'Direct USB / OTG Web Serial Connection (115200 Baud):'}
                </span>
                <div>
                  {!serialConnected ? (
                    <button
                      onClick={handleConnectWebSerial}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition text-xs flex items-center gap-1.5"
                    >
                      <Usb className="w-3.5 h-3.5" />
                      <span>{lang === 'km' ? 'ជ្រើសរើស COM Port' : 'Connect COM Port'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleDisconnectWebSerial}
                      className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-lg transition text-xs"
                    >
                      <span>{lang === 'km' ? 'ផ្តាច់ការតភ្ជាប់' : 'Disconnect'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Real-time Serial Monitor */}
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400 h-28 overflow-y-auto space-y-0.5">
                {serialLogs.length === 0 ? (
                  <span className="text-slate-600">{lang === 'km' ? 'រង់ចាំទិន្នន័យពី Serial Port...' : 'Waiting for serial data...'}</span>
                ) : (
                  serialLogs.map((log, idx) => <div key={idx}>{log}</div>)
                )}
              </div>

              {/* Custom Command Sender */}
              {serialConnected && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={serialInput}
                    onChange={(e) => setSerialInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendCustomSerialCommand()}
                    placeholder="e.g. V0=1, V0=0, STATUS, RESTART"
                    className="flex-1 bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-lg text-white font-mono text-xs focus:outline-none"
                  />
                  <button
                    onClick={sendCustomSerialCommand}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs"
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          )}

          {/* INTERACTIVE PHYSICAL CHIP COMMAND CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. SMART LAMP TOGGLE (V0 / GPIO 12) */}
            <div className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
              remoteLampState === 1
                ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/60 shadow-xl shadow-amber-500/10'
                : 'bg-slate-950/70 border-slate-800'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    remoteLampState === 1 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {remoteLampState === 1 ? 'ON (បើក)' : 'OFF (បិទ)'}
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm">Smart_Lamp</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">GPIO {lampPin} (Pin 12 / Virtual Pin V0)</p>
                <p className="text-[10px] text-sky-400 mt-1">
                  {lang === 'km' ? '📢 ផ្ញើសារ Telegram ស្វ័យប្រវត្តិពេលប្តូរ' : '📢 Triggers Telegram notify automatically'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <button
                  disabled={remoteDispatching}
                  onClick={() => dispatchChipCommand('V0', remoteLampState === 1 ? 0 : 1)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                    remoteLampState === 1
                      ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span>{remoteLampState === 1 ? (lang === 'km' ? 'ចុចដើម្បីបិទអំពូល' : 'Turn OFF Lamp') : (lang === 'km' ? 'ចុចដើម្បីបើកអំពូល' : 'Turn ON Lamp')}</span>
                </button>
              </div>
            </div>

            {/* 2. ESP32-CAM FLASH LED (GPIO 4) */}
            <div className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
              remoteFlashState === 1
                ? 'bg-gradient-to-br from-yellow-950/40 via-slate-900 to-slate-950 border-yellow-500/60 shadow-xl shadow-yellow-500/10'
                : 'bg-slate-950/70 border-slate-800'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    remoteFlashState === 1 ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {remoteFlashState === 1 ? 'FLASH ON' : 'STANDBY'}
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm">ESP32-CAM Flash</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">High-Power LED on GPIO 4</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {lang === 'km' ? 'អំពូល Flash សម្រាប់ថតរូបពេលយប់' : 'High brightness illumination'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <button
                  disabled={remoteDispatching}
                  onClick={() => dispatchChipCommand('V4', remoteFlashState === 1 ? 0 : 1)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                    remoteFlashState === 1
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-yellow-500 hover:bg-yellow-400 text-slate-950 shadow-lg shadow-yellow-500/20'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>{remoteFlashState === 1 ? 'Turn OFF Flash' : 'Turn ON Flash'}</span>
                </button>
              </div>
            </div>

            {/* 3. MQ-135 SENSOR HAZARD TEST (Pin 14 / V1) */}
            <div className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
              remoteGasSimState === 1
                ? 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/60 shadow-xl shadow-rose-500/10'
                : 'bg-slate-950/70 border-slate-800'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <Flame className="w-5 h-5" />
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    remoteGasSimState === 1 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {remoteGasSimState === 1 ? 'ALERT (HIGH)' : 'SAFE (NORMAL)'}
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm">MQ-135 Gas Alert</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">GPIO {mq135Pin} Digital Out (V1)</p>
                <p className="text-[10px] text-rose-400 mt-1">
                  {lang === 'km' ? 'សាកល្បងប្រកាសអាសន្នផ្សែង' : 'Test gas hazard safety alarms'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <button
                  disabled={remoteDispatching}
                  onClick={() => dispatchChipCommand('V1', remoteGasSimState === 1 ? 0 : 1)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                    remoteGasSimState === 1
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      : 'bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20'
                  }`}
                >
                  <Flame className="w-4 h-4" />
                  <span>{remoteGasSimState === 1 ? (lang === 'km' ? 'កំណត់ជាធម្មតា (Safe)' : 'Set Normal') : (lang === 'km' ? 'តេស្តអាសន្នផ្សែង (Hazard)' : 'Trigger Gas Alert')}</span>
                </button>
              </div>
            </div>

            {/* 4. CHIP SOFTWARE REBOOT (OTA Reset) */}
            <div className="p-4 rounded-2xl border-2 border-slate-800 bg-slate-950/70 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-800 text-slate-400">
                    ESP.restart()
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm">ESP32 Reboot</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Software Restart Command</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {lang === 'km' ? 'បញ្ជាឱ្យ Microcontroller ចាប់ផ្តើមឡើងវិញ' : 'Send remote reset packet'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <button
                  disabled={remoteDispatching}
                  onClick={() => dispatchChipCommand('REBOOT', 1)}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition"
                >
                  <RefreshCw className="w-4 h-4 text-cyan-400" />
                  <span>{lang === 'km' ? 'Reboot ESP32' : 'Reboot ESP32'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Status Message Display */}
          {remoteStatusMessage && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 flex items-center justify-between">
              <span>{remoteStatusMessage}</span>
              <span className="text-[10px] text-slate-500">{new Date().toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 3: TELEGRAM BOT NOTIFICATION CONFIGURATION */}
      {activeSubTab === 'telegram' && (
        <div className="bg-gradient-to-br from-sky-950/40 via-slate-900 to-slate-950 border border-sky-500/40 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sky-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{lang === 'km' ? 'ការកំណត់ Telegram Bot សម្រាប់ផ្ញើសារដំណឹង' : 'Telegram Bot Alert Integration'}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-700">
                    REAL-TIME ALERTS
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'km'
                    ? 'ផ្ញើសារស្វ័យប្រវត្តទៅ Telegram ពេលកម្រិត MQ135 រកឃើញផ្សែងពុល ឬពេល Smart_Lamp បើក/បិទ'
                    : 'Instant Telegram alerts when MQ-135 detects hazard or when Smart_Lamp toggles.'}
                </p>
              </div>
            </div>

            <button
              onClick={sendTestTelegram}
              disabled={telegramTesting}
              className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold transition shadow-lg shadow-sky-500/20 self-start sm:self-auto"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {telegramTesting
                  ? (lang === 'km' ? 'កំពុងផ្ញើសារ...' : 'Sending...')
                  : (lang === 'km' ? 'តេស្តផ្ញើសារ Telegram' : 'Test Telegram Message')}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                TELEGRAM BOT TOKEN
              </label>
              <input
                type="text"
                value={telegramBotToken}
                onChange={(e) => {
                  setTelegramBotToken(e.target.value);
                  localStorage.setItem('sps_peh_telegram_bot_token', e.target.value);
                }}
                className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl px-3 py-2 text-sky-400 font-mono text-xs font-bold focus:outline-none"
                placeholder="e.g. 8928313450:AAEvmTZMGGDXRJZ-W1ZuE2vc5AlVSQ5oDbY"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                TELEGRAM CHAT ID
              </label>
              <input
                type="text"
                value={telegramChatId}
                onChange={(e) => {
                  setTelegramChatId(e.target.value);
                  localStorage.setItem('sps_peh_telegram_chat_id', e.target.value);
                }}
                className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl px-3 py-2 text-white font-mono text-xs font-bold focus:outline-none"
                placeholder="e.g. 5780071626"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-sky-500/20">
            <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              {lang === 'km' ? 'រក្សាទុកស្វ័យប្រវត្តិក្នង Browser (Auto-saved)' : 'Auto-saved in LocalStorage'}
            </span>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('sps_peh_telegram_bot_token', telegramBotToken);
                localStorage.setItem('sps_peh_telegram_chat_id', telegramChatId);
                triggerSaveNotification('✅ បានរក្សាទុកការកំណត់ Telegram ជោគជ័យ!');
              }}
              className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{lang === 'km' ? 'រក្សាទុកការកំណត់ Telegram' : 'Save Telegram Settings'}</span>
            </button>
          </div>

          {telegramStatus && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              telegramStatus === 'success'
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
            }`}>
              {telegramStatus === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <ShieldAlert className="w-4 h-4 text-rose-400" />}
              <span>
                {telegramStatus === 'success'
                  ? (lang === 'km' ? 'សារ Telegram បានផ្ញើជោគជ័យទៅកាន់ Chat ID ' + telegramChatId : 'Telegram message delivered successfully to Chat ID ' + telegramChatId)
                  : telegramStatus}
              </span>
            </div>
          )}

          {/* Telegram Rules & Logic Info */}
          <div className="p-4 bg-slate-950 rounded-xl border border-sky-500/20 text-xs space-y-2">
            <h4 className="font-bold text-sky-400 flex items-center gap-1.5">
              <BellRing className="w-3.5 h-3.5" />
              <span>{lang === 'km' ? 'លក្ខខណ្ឌដែលប្រព័ន្ធផ្ញើសារទៅ Telegram (Automated Telegram Triggers):' : 'Automated Telegram Alert Triggers:'}</span>
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold mt-0.5">⚠️</span>
                <span><strong>MQ-135 Air Quality Bad (GPIO 0 &gt;= 400 PPM):</strong> ផ្ញើសារប្រកាសអាសន្នខ្យល់ពុល៖ <code>⚠️ អាសន្ន! មានខ្យល់ពុលខ្លាំង (PPM) - សូមប្រុងប្រយ័ត្នចេញក្រៅសូមពាក់ម៉ាស តែបើមិនចាំបាច់សូមនៅក្នុងផ្ទះ ឬកន្លែងដែលមានបរិយាសកាសល្អ!!!</code></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold mt-0.5">🗑️</span>
                <span><strong>សំរាមពេញក្នុងធុង (Level &gt;= 100% / &lt;= 5cm):</strong> ផ្ញើសារប្រកាសអាសន្ន៖ <code>សូមមកប្រមូលសម្រាមជាបន្ទាន់! សម្រាមពេញហើយ!!!</code></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                <span><strong>ពេល ESP32 ភ្ជាប់ WiFi ជោគជ័យ:</strong> ផ្ញើសារ <code>WiFi ភ្ជាប់ជោគជ័យ! IP: 192.168.x.x</code>។</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* SUB TAB 4: READ-ONLY C++ CODE VIEW */}
      {activeSubTab === 'code' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'km' ? 'កូដ Arduino C++ ពេញលេញ' : 'Arduino C++ Code Output'}</span>
            </h3>
            <button
              onClick={copyCustomCode}
              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto text-xs font-mono text-emerald-400 leading-relaxed">
            <pre>{customCode}</pre>
          </div>
        </div>
      )}

      {/* SUB TAB 5: FLASHING GUIDE */}
      {activeSubTab === 'guide' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            {lang === 'km' ? 'ជំហាន Flash កូដទៅ ESP32-CAM តាម Arduino IDE' : 'Flashing Guide for ESP32-CAM via Arduino IDE'}
          </h3>

          <div className="space-y-3 text-slate-300">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <h4 className="font-bold text-white mb-1">១. ដំឡើង Library ចាំបាច់ (Install Required Libraries):</h4>
              <p className="text-slate-400 mb-2">
                បើក Arduino IDE ចូល <strong>Sketch &gt; Include Library &gt; Manage Libraries...</strong> រួចស្វែងរកដំឡើង៖
              </p>
              <ul className="list-disc list-inside space-y-1 font-mono text-emerald-400">
                <li>Blynk by Volodymyr Shymanskyy (v1.3.x+)</li>
                <li>UrlEncode by Masayuki Sugahara (ដើម្បីផ្ញើសារអក្សរខ្មែរទៅ Telegram)</li>
              </ul>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <h4 className="font-bold text-white mb-1">២. ជ្រើសរើស Board & Port សម្រាប់ ESP32-CAM:</h4>
              <p className="text-slate-400 mb-2">ចូល <strong>Tools &gt; Board &gt; ESP32 Arduino</strong> រួចជ្រើសរើស៖</p>
              <ul className="list-disc list-inside space-y-1 font-mono text-cyan-300">
                <li>Board: "AI Thinker ESP32-CAM"</li>
                <li>Upload Speed: "115200"</li>
                <li>Flash Frequency: "40MHz"</li>
                <li>Flash Mode: "QIO"</li>
              </ul>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <h4 className="font-bold text-amber-400 mb-1">⚠️ ចំណាំសំខាន់ពេល Flash ESP32-CAM:</h4>
              <p className="text-slate-300">
                ត្រូវតខ្សែ <strong>GPIO 0 ទៅកាន់ GND</strong> មុនពេលចុចប៊ូតុង Upload។ បន្ទាប់ពី Upload ពេញ ១០០% សូមដកខ្សែ GPIO 0 ចេញពី GND រួចចុចប៊ូតុង <strong>RST / Reset</strong> នៅលើ ESP32-CAM។
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 6: HARDWARE WIRING */}
      {activeSubTab === 'wiring' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            {lang === 'km' ? 'តារាងតខ្សែ GPIO សម្រាប់ ESP32-CAM & ESP32' : 'Hardware Pinout & Wiring Connections'}
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Device / Sensor</th>
                  <th className="py-2.5 px-3">ESP32 Pin</th>
                  <th className="py-2.5 px-3">Blynk Pin</th>
                  <th className="py-2.5 px-3">VCC</th>
                  <th className="py-2.5 px-3">GND</th>
                  <th className="py-2.5 px-3">Wiring Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                <tr>
                  <td className="py-2.5 px-3 font-sans font-bold text-amber-400">Smart_Lamp (Relay / LED)</td>
                  <td className="py-2.5 px-3 text-white font-bold">GPIO {lampPin} (Pin 12)</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">V0</td>
                  <td className="py-2.5 px-3 text-yellow-400">3.3V / 5V</td>
                  <td className="py-2.5 px-3">GND</td>
                  <td className="py-2.5 px-3 font-sans text-slate-400">Relay IN or LED anode via 220Ω resistor</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-sans font-bold text-emerald-400">MQ-135 Gas / Air Quality</td>
                  <td className="py-2.5 px-3 text-white font-bold">GPIO {mq135Pin} (Pin 14 DO)</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">V1</td>
                  <td className="py-2.5 px-3 text-yellow-400">5V (VIN)</td>
                  <td className="py-2.5 px-3">GND</td>
                  <td className="py-2.5 px-3 font-sans text-slate-400">Digital Out (DO) to Pin 14 with INPUT_PULLUP</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-sans font-bold text-yellow-400">Built-in Flash LED</td>
                  <td className="py-2.5 px-3 text-white font-bold">GPIO 4</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">V4</td>
                  <td className="py-2.5 px-3 text-yellow-400">Internal</td>
                  <td className="py-2.5 px-3">Internal</td>
                  <td className="py-2.5 px-3 font-sans text-slate-400">Onboard high brightness LED on ESP32-CAM</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB TAB 7: REST API & CURL TEST */}
      {activeSubTab === 'api' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            {lang === 'km' ? 'តេស្ត REST API ផ្ទាល់ (cURL Command)' : 'Direct REST API & cURL Command Tester'}
          </h3>

          <p className="text-slate-400">
            {lang === 'km'
              ? 'អ្នកអាចសាកល្បងផ្ញើទិន្នន័យពី Terminal ឬ Postman ដូចជា ESP32 ពិតប្រាកដតាមរយៈ cURL ខាងក្រោម៖'
              : 'Test telemetry injection or read pin statuses right from your bash terminal:'}
          </p>

          <div className="space-y-3">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-emerald-400">1. Update Sensors (GET or POST):</span>
                <button
                  onClick={copyCurlCmd}
                  className="flex items-center gap-1 text-slate-400 hover:text-white"
                >
                  {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
                </button>
              </div>
              <code className="block bg-slate-900 p-2 rounded text-cyan-300 font-mono select-all overflow-x-auto">
                {sampleCurl}
              </code>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="mb-1.5">
                <span className="font-semibold text-emerald-400">2. Direct Chip Command Endpoint:</span>
              </div>
              <code className="block bg-slate-900 p-2 rounded text-cyan-300 font-mono select-all overflow-x-auto">
                curl -X POST "{serverUrl}/api/iot/chip/command" -H "Content-Type: application/json" -d '{`{"pin":"V0","value":1,"blynkToken":"${blynkAuthToken}"}`}'
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Floating Save Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-emerald-300 border border-emerald-500/50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold font-sans animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{saveToast}</span>
        </div>
      )}
    </div>
  );
};
