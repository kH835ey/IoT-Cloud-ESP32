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

const char* wifi_ssid = "SMART-WIFI-B339";        // ដាក់ឈ្មោះ Wi-Fi ផ្ទះ/Hotspot
const char* wifi_password = "5E85D60F"; // ដាក់លេខសម្ងាត់ Wi-Fi

// Telegram Credentials
const String BOT_TOKEN = "8928313450:AAEvmTZMGGDXRJZ-W1ZuE2vc5AlVSQ5oDbY";
const String CHAT_ID   = "5780071626";

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
        <h2>ប្រព័ន្ធគ្រប់គ្រងភ្លើង</h2>
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
    http.begin(url);
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
}
