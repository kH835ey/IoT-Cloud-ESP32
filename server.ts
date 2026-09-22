import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { INITIAL_DEVICES, INITIAL_AUTOMATIONS, generateInitialTelemetryHistory, INITIAL_LOGS } from './src/data/initialData';
import { IoTDevice, VirtualPinId, TelemetryPoint, DeviceLog, AutomationRule } from './src/types';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase Admin
const apps = getApps();
if (!apps.length) {
  try {
    initializeApp({
      projectId: firebaseConfig.projectId
    });
    console.log('✅ Firebase Admin initialized for project:', firebaseConfig.projectId);
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
  }
}

const db = getApps().length ? getFirestore(firebaseConfig.firestoreDatabaseId) : null;
let firestoreAvailable = !!db;

// In-memory persistent database across live session
let devices: IoTDevice[] = JSON.parse(JSON.stringify(INITIAL_DEVICES));
let automations: AutomationRule[] = JSON.parse(JSON.stringify(INITIAL_AUTOMATIONS));
let telemetryHistory: TelemetryPoint[] = generateInitialTelemetryHistory(40);
let logs: DeviceLog[] = JSON.parse(JSON.stringify(INITIAL_LOGS));
let isSimulating = false;
let sseClients: Response[] = [];
const manualPinOverrides = new Map<string, number>(); // key: deviceId:pin -> timestamp

// Helper to broadcast state to all open SSE connections
function broadcastSSE(eventType: string, data: any) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client, idx) => {
    try {
      client.write(payload);
    } catch {
      sseClients.splice(idx, 1);
    }
  });
}

// Evaluate automation rules
function evaluateAutomations(device: IoTDevice) {
  const now = Date.now();
  automations.forEach(rule => {
    if (!rule.enabled) return;

    // Only apply greenhouse irrigation automations to greenhouse / irrigation devices
    if (rule.id === 'auto_soil_irrigation' && device.templateId !== 'TMPL_SMART_IRRIGATION') {
      return;
    }
    if (rule.id === 'auto_temp_fan_cooling' && device.templateId !== 'TMPL_SMART_IRRIGATION') {
      return;
    }
    if (rule.id === 'auto_gas_alarm_trigger' && device.templateId !== 'TMPL_ALERT_SYSTEM') {
      return;
    }

    const sourcePinDef = device.pins[rule.sourcePin];
    if (!sourcePinDef) return;

    // Check if target pin is currently under manual override (within 30 seconds)
    const overrideKey = `${device.id}:${rule.targetPin}`;
    const overriddenAt = manualPinOverrides.get(overrideKey);
    if (overriddenAt && now - overriddenAt < 30000) {
      return;
    }

    const currentVal = Number(sourcePinDef.value);
    let triggered = false;

    switch (rule.condition) {
      case 'gt': triggered = currentVal > rule.threshold; break;
      case 'gte': triggered = currentVal >= rule.threshold; break;
      case 'lt': triggered = currentVal < rule.threshold; break;
      case 'lte': triggered = currentVal <= rule.threshold; break;
      case 'eq': triggered = Math.abs(currentVal - rule.threshold) < 0.01; break;
    }

    if (triggered) {
      const targetPinDef = device.pins[rule.targetPin];
      if (targetPinDef && targetPinDef.value !== rule.targetValue) {
        targetPinDef.value = rule.targetValue;
        rule.lastTriggered = new Date().toLocaleTimeString();

        const logMsg: DeviceLog = {
          id: `auto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toLocaleTimeString(),
          level: 'WARN',
          deviceId: device.id,
          message: `[AUTOMATION TRIGGERED] ${rule.name} -> Set ${rule.targetPin} = ${rule.targetValue}`,
          messageKhmer: `ក្បួនស្វ័យប្រវត្តបានបញ្ជា: ${rule.nameKhmer} -> កំណត់ ${rule.targetPin} = ${rule.targetValue}`,
          source: 'AUTOMATION'
        };
        logs.unshift(logMsg);
        if (logs.length > 200) logs.pop();

        broadcastSSE('device_update', { deviceId: device.id, device });
        broadcastSSE('log_added', logMsg);
        broadcastSSE('automation_triggered', { ruleId: rule.id, lastTriggered: rule.lastTriggered });
      }
    }
  });
}

// Background simulation ticker for realistic sensor physics & ESP32 emulation
setInterval(() => {
  if (!isSimulating || devices.length === 0) return;

  devices.forEach(dev => {
    dev.lastSeen = 'Just now';
    dev.status = 'online';

    // 1. Alert System simulation
    if (dev.templateId === 'TMPL_ALERT_SYSTEM') {
      if (dev.pins.V0) {
        let coVal = Number(dev.pins.V0.value);
        coVal += Math.floor((Math.random() - 0.49) * 8);
        dev.pins.V0.value = Math.max(300, Math.min(495, coVal));
      }
      if (dev.pins.V1) {
        let press = Number(dev.pins.V1.value);
        press += (Math.random() - 0.5) * 0.15;
        dev.pins.V1.value = Number(Math.max(98.0, Math.min(108.0, press)).toFixed(2));
      }
      if (dev.pins.V2) {
        let water = Number(dev.pins.V2.value);
        water += Math.round((Math.random() - 0.5) * 2);
        dev.pins.V2.value = Math.max(5, Math.min(95, water));
      }
      if (dev.pins.V12) {
        let light = Number(dev.pins.V12.value);
        light += Math.round((Math.random() - 0.5) * 20);
        dev.pins.V12.value = Math.max(0, Math.min(2000, light));
      }
    }

    // 2. Smart Bin simulation
    if (dev.templateId === 'TMPL_SMART_BIN') {
      if (dev.pins.V1) {
        let dry = Number(dev.pins.V1.value);
        if (Math.random() > 0.7) dry = Math.min(100, Math.max(10, dry + (Math.random() > 0.5 ? 1 : -1)));
        dev.pins.V1.value = dry;
      }
      if (dev.pins.V3) {
        let wet = Number(dev.pins.V3.value);
        if (Math.random() > 0.8) wet = Math.min(100, Math.max(5, wet + (Math.random() > 0.5 ? 1 : -1)));
        dev.pins.V3.value = wet;
      }
      if (dev.pins.V7) {
        let odor = Number(dev.pins.V7.value);
        odor += Math.round((Math.random() - 0.48) * 4);
        dev.pins.V7.value = Math.max(60, Math.min(350, odor));
      }
    }

    // 3. Smart Agriculture simulation
    if (dev.templateId === 'TMPL_SMART_IRRIGATION' || dev.templateId === 'TMPL6BUNdn49f') {
      const pumpOn = Number(dev.pins.V0?.value) === 1;
      if (dev.pins.V1) {
        let soil = Number(dev.pins.V1.value);
        if (pumpOn) {
          soil = Math.min(100, soil + 0.5);
        } else {
          soil = Math.max(20, soil - 0.08);
        }
        dev.pins.V1.value = Number(soil.toFixed(1));
      }
      if (dev.pins.V2) {
        let temp = Number(dev.pins.V2.value);
        temp += (Math.random() - 0.48) * 0.15;
        dev.pins.V2.value = Number(Math.max(22, Math.min(55, temp)).toFixed(1));
      }
      if (dev.pins.V7) {
        let angle = Number(dev.pins.V7.value);
        let lux = Number(dev.pins.V4?.value ?? 500);
        // Move angle towards 90 when light is peak, or just cycle it
        const targetAngle = lux > 500 ? 145 : 45;
        angle += (targetAngle - angle) * 0.05 + (Math.random() - 0.5) * 0.5;
        dev.pins.V7.value = Number(Math.max(0, Math.min(180, angle)).toFixed(1));
      }
      if (dev.pins.V6) {
        let hum = Number(dev.pins.V6.value);
        hum += (Math.random() - 0.5) * 0.25;
        dev.pins.V6.value = Number(Math.max(40, Math.min(90, hum)).toFixed(1));
      }
      if (dev.pins.V4) {
        let light = Number(dev.pins.V4.value);
        light = Math.max(2, Math.min(100, light + Math.round((Math.random() - 0.5) * 2)));
        dev.pins.V4.value = light;
      }
    }

    // 4. Traffic Light & Parking simulation
    if (dev.templateId === 'TMPL_TRAFFIC_PARKING') {
      if (dev.pins.V1 && Math.random() > 0.8) {
        let spots = Number(dev.pins.V1.value);
        spots = Math.max(0, Math.min(3, spots + (Math.random() > 0.5 ? 1 : -1)));
        dev.pins.V1.value = spots;
      }
      if (dev.pins.V2 && Math.random() > 0.75) {
        let carA = Number(dev.pins.V2.value);
        carA = Math.max(0, Math.min(6, carA + (Math.random() > 0.45 ? 1 : -1)));
        dev.pins.V2.value = carA;
      }
      if (dev.pins.V3 && Math.random() > 0.75) {
        let carB = Number(dev.pins.V3.value);
        carB = Math.max(0, Math.min(6, carB + (Math.random() > 0.45 ? 1 : -1)));
        dev.pins.V3.value = carB;
      }
      if (dev.pins.V4 && Math.random() > 0.75) {
        let carC = Number(dev.pins.V4.value);
        carC = Math.max(0, Math.min(6, carC + (Math.random() > 0.45 ? 1 : -1)));
        dev.pins.V4.value = carC;
      }
      if (dev.pins.V5 && Math.random() > 0.75) {
        let carD = Number(dev.pins.V5.value);
        carD = Math.max(0, Math.min(6, carD + (Math.random() > 0.45 ? 1 : -1)));
        dev.pins.V5.value = carD;
      }
    }

    // 5. Smart Lamp & MQ135 Air Quality simulation
    if (dev.templateId === 'TMPL_SMART_LAMP_MQ135') {
      if (dev.pins.V1) {
        let air = Number(dev.pins.V1.value);
        const fanOn = Number(dev.pins.V3?.value) === 1;
        if (fanOn) {
          air = Math.max(80, air - Math.floor(Math.random() * 6 + 2));
        } else {
          air = Math.max(50, Math.min(950, air + Math.floor((Math.random() - 0.45) * 6)));
        }
        dev.pins.V1.value = air;

        // Auto Hazard siren trigger if above 450 ppm
        if (dev.pins.V5) {
          dev.pins.V5.value = air > 450 ? 1 : 0;
        }
        if (dev.pins.V9) {
          dev.pins.V9.value = Math.round(air * 2.2 + 20);
        }
      }
      if (dev.pins.V6) {
        let t = Number(dev.pins.V6.value);
        t += (Math.random() - 0.5) * 0.1;
        dev.pins.V6.value = Number(Math.max(20, Math.min(42, t)).toFixed(1));
      }
      if (dev.pins.V7) {
        let h = Number(dev.pins.V7.value);
        h += (Math.random() - 0.5) * 0.2;
        dev.pins.V7.value = Number(Math.max(30, Math.min(95, h)).toFixed(1));
      }
    }

    // 7. School Light Controls
    if (dev.templateId === 'TMPL_SCHOOL_LIGHTS') {
      // Nothing to simulate here currently, these are just relays
    }

    evaluateAutomations(dev);

    // Sync to Firestore if available
    if (db && firestoreAvailable) {
      db.collection('devices').doc(dev.id).set({
        pins: dev.pins,
        lastSeen: dev.lastSeen,
        status: dev.status,
        rssi: dev.rssi,
        ipAddress: dev.ipAddress
      }, { merge: true }).catch(err => {
        if (err?.code === 7 || err?.message?.includes('PERMISSION_DENIED')) {
          if (firestoreAvailable) {
            console.warn('ℹ️ Firestore Admin sync restricted in local sandbox. Operating in high-speed in-memory database mode.');
            firestoreAvailable = false;
          }
        } else {
          console.error(`Firestore sync error for ${dev.id}:`, err?.message || err);
        }
      });
    }

    // Real-time SSE update for this specific device
    broadcastSSE('device_updated', { deviceId: dev.id, device: dev });
  });

  const primaryDev = devices[0];
  if (primaryDev) {
    const now = Date.now();
    const alertDev = devices.find(d => d.templateId === 'TMPL_ALERT_SYSTEM');
    const c3Dev = devices.find(d => d.templateId === 'TMPL_SMART_BIN');
    const coVal = Number(alertDev?.pins.V0?.value || 306);
    const mq135Val = Number(c3Dev?.pins.V4?.value || c3Dev?.pins.V1?.value || 185);
    const waterVal = Number(alertDev?.pins.V2?.value || 28);
    const pressVal = Number(alertDev?.pins.V1?.value || 103.5);

    const newPoint: TelemetryPoint = {
      timestamp: now,
      timeStr: new Date(now).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      temperature: Number(devices.find(d => d.templateId === 'TMPL_SMART_IRRIGATION')?.pins.V2?.value || alertDev?.pins.V7?.value || 28.5),
      humidity: Number(devices.find(d => d.templateId === 'TMPL_SMART_IRRIGATION')?.pins.V6?.value || 68.0),
      gasCo: coVal,
      coLevel: coVal,
      airQualityMq135: mq135Val,
      waterLevel: waterVal,
      airPressure: pressVal,
      soilMoisture: Number(devices.find(d => d.templateId === 'TMPL_SMART_IRRIGATION')?.pins.V1?.value || 92),
      fanSpeed: Number(primaryDev.pins.V4?.value || 75),
      relay1: Number(primaryDev.pins.V0?.value || 1),
      relay2: Number(primaryDev.pins.V3?.value || 0),
    };

    telemetryHistory.push(newPoint);
    if (telemetryHistory.length > 300) {
      telemetryHistory.shift();
    }

    broadcastSSE('telemetry_tick', { point: newPoint, deviceId: primaryDev.id, pins: primaryDev.pins });
  }
}, 1000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS for external ESP32 / Arduino requests
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-blynk-token');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ 
      status: 'ok', 
      uptime: process.uptime(), 
      time: new Date().toISOString(),
      firebase: !!db
    });
  });

  // Server-Sent Events (SSE) for Real-time browser updates
  app.get('/api/iot/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Send initial handshake
    res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Connected to IoT Cloud Stream', timestamp: Date.now() })}\n\n`);
    sseClients.push(res);

    req.on('close', () => {
      sseClients = sseClients.filter(c => c !== res);
    });
  });

  // GET /api/iot/devices -> List devices
  app.get('/api/iot/devices', (_req: Request, res: Response) => {
    res.json({ success: true, devices });
  });

  // GET /api/iot/device/:token -> Get single device state by token or id
  app.get('/api/iot/device/:token', (req: Request, res: Response) => {
    const tokenOrId = req.params.token;
    const device = devices.find(d => d.authToken === tokenOrId || d.id === tokenOrId);
    if (!device) {
      res.status(404).json({ success: false, error: 'Device not found' });
      return;
    }
    res.json({ success: true, device });
  });

  // BLYNK & REST COMPLIANT UPDATE ENDPOINT:
  // Can be called via GET query: /api/iot/update?token=xxx&v0=25.4&v1=68&v2=1
  // Or GET /api/iot/update?token=xxx&pin=v0&value=25.4
  // Or POST JSON { token, pins: { V0: 25.4, V1: 68 }, rssi: -60, ip: "192.168.1.100" }
  const handleIotUpdate = (req: Request, res: Response) => {
    const query = req.query as Record<string, string>;
    const body = (req.body || {}) as Record<string, any>;

    const token = (query.token || body.token || query.auth || body.auth) as string;
    if (!token) {
      res.status(400).json({ success: false, error: 'Missing auth token. Pass ?token=YOUR_TOKEN' });
      return;
    }

    const device = devices.find(d => d.authToken === token || d.id === token);
    if (!device) {
      res.status(401).json({ success: false, error: 'Invalid Auth Token or unregistered device' });
      return;
    }

    device.lastSeen = 'Just now';
    device.status = 'online';
    if (query.rssi || body.rssi) device.rssi = Number(query.rssi || body.rssi);
    if (query.ip || body.ip) device.ipAddress = String(query.ip || body.ip);

    const prevV0 = device.pins.V0 ? Number(device.pins.V0.value) : undefined;
    let updatedPinsList: string[] = [];

    // Case 1: single pin update (?pin=v0&value=28.5)
    if (query.pin && query.value !== undefined) {
      const pinKey = (query.pin.toUpperCase()) as VirtualPinId;
      if (device.pins[pinKey]) {
        device.pins[pinKey].value = isNaN(Number(query.value)) ? query.value : Number(query.value);
        updatedPinsList.push(`${pinKey}=${query.value}`);
        manualPinOverrides.set(`${device.id}:${pinKey}`, Date.now());
      }
    }

    // Case 2: multi-pin query (?v0=28.5&v1=65&v5=320)
    Object.keys(query).forEach(k => {
      const upper = k.toUpperCase() as VirtualPinId;
      if (upper.startsWith('V') && device.pins[upper]) {
        const val = isNaN(Number(query[k])) ? query[k] : Number(query[k]);
        device.pins[upper].value = val;
        updatedPinsList.push(`${upper}=${val}`);
        manualPinOverrides.set(`${device.id}:${upper}`, Date.now());
      }
    });

    // Case 3: JSON body pins { V0: 28.5, V1: 65 }
    if (body.pins && typeof body.pins === 'object') {
      Object.keys(body.pins).forEach(k => {
        const upper = k.toUpperCase() as VirtualPinId;
        if (device.pins[upper]) {
          const val = isNaN(Number(body.pins[k])) ? body.pins[k] : Number(body.pins[k]);
          device.pins[upper].value = val;
          updatedPinsList.push(`${upper}=${val}`);
          manualPinOverrides.set(`${device.id}:${upper}`, Date.now());
        }
      });
    }

    // Direct body keys (e.g. { v0: 25.4 })
    Object.keys(body).forEach(k => {
      const upper = k.toUpperCase() as VirtualPinId;
      if (upper.startsWith('V') && device.pins[upper]) {
        const val = isNaN(Number(body[k])) ? body[k] : Number(body[k]);
        device.pins[upper].value = val;
        updatedPinsList.push(`${upper}=${val}`);
        manualPinOverrides.set(`${device.id}:${upper}`, Date.now());
      }
    });

    // Forward actuator pin updates (e.g. V0, V3, V4, V6) to Blynk Cloud REST API
    // so physical ESP32 connected to Blynk Cloud receives the BLYNK_WRITE(V0) trigger instantly
    if (device.authToken && device.authToken.length > 8 && updatedPinsList.length > 0) {
      updatedPinsList.forEach(item => {
        const [pinName, pinVal] = item.split('=');
        if (pinName) {
          const blynkPin = pinName.toLowerCase();
          const regionalEndpoints = [
            `https://blynk.cloud/external/api/update?token=${device.authToken}&${blynkPin}=${pinVal}`,
            `https://sgp1.blynk.cloud/external/api/update?token=${device.authToken}&${blynkPin}=${pinVal}`,
            `https://fra1.blynk.cloud/external/api/update?token=${device.authToken}&${blynkPin}=${pinVal}`
          ];
          regionalEndpoints.forEach(url => {
            fetch(url).catch(() => {});
          });
        }
      });
    }

    // Trigger Telegram notification if V0 (Smart_Lamp) was toggled
    const newV0 = device.pins.V0 ? Number(device.pins.V0.value) : undefined;
    if (prevV0 !== undefined && newV0 !== undefined && prevV0 !== newV0) {
      const tgMsg = newV0 === 1 ? '💡 <b>អំពូលកំពុងបើក</b>' : '⭕ <b>អំពូលត្រូវបានបិទ</b>';
      fetch('https://api.telegram.org/bot8928313450:AAEvmTZMGGDXRJZ-W1ZuE2vc5AlVSQ5oDbY/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: '5780071626',
          text: tgMsg,
          parse_mode: 'HTML',
        }),
      }).catch(err => console.error('[Telegram Notify Error]', err));
    }

    // Evaluate automations
    evaluateAutomations(device);

    // Sync state update to Firestore
    if (db && firestoreAvailable) {
      db.collection('devices').doc(device.id).set({
        pins: device.pins,
        lastSeen: device.lastSeen,
        status: device.status,
        rssi: device.rssi,
        ipAddress: device.ipAddress
      }, { merge: true }).catch(err => {
        if (err?.code === 7 || err?.message?.includes('PERMISSION_DENIED')) {
          if (firestoreAvailable) {
            console.warn('ℹ️ Firestore Admin sync restricted in local sandbox. Operating in high-speed in-memory database mode.');
            firestoreAvailable = false;
          }
        } else {
          console.error('Firestore update error:', err?.message || err);
        }
      });
      
      // Log sensor data to historical logs
      db.collection('sensor_logs').add({
        deviceId: device.id,
        pins: device.pins,
        timestamp: FieldValue.serverTimestamp()
      }).catch(err => {
        if (err?.code === 7 || err?.message?.includes('PERMISSION_DENIED')) {
          firestoreAvailable = false;
        } else {
          console.error('Firestore logging error:', err?.message || err);
        }
      });
    }

    // Create log message
    if (updatedPinsList.length > 0) {
      const logEntry: DeviceLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        level: 'DATA',
        deviceId: device.id,
        message: `[ESP32 -> CLOUD] Synced ${updatedPinsList.join(', ')}`,
        messageKhmer: `ទិន្នន័យពី ESP32 បាន Sync: ${updatedPinsList.join(', ')}`,
        source: 'ESP32_FIRMWARE'
      };
      logs.unshift(logEntry);
      if (logs.length > 200) logs.pop();
      broadcastSSE('log_added', logEntry);
    }

    // Broadcast full updated device to frontend
    broadcastSSE('device_update', { deviceId: device.id, device });

    // Respond OK
    res.json({
      success: true,
      message: 'Pins updated successfully',
      updated: updatedPinsList,
      timestamp: Date.now()
    });
  };

  app.get('/api/iot/update', handleIotUpdate);
  app.post('/api/iot/update', handleIotUpdate);

  // Direct Blynk-compatible endpoint: /external/api/update
  app.get('/external/api/update', handleIotUpdate);
  app.post('/external/api/update', handleIotUpdate);

  // Direct Blynk-compatible endpoint: /external/api/get?token=xxx&v0
  // Or /api/iot/get?token=xxx&pin=v0
  const handleIotGet = (req: Request, res: Response) => {
    const token = (req.query.token || req.query.auth) as string;
    if (!token) {
      res.status(400).send('Missing token');
      return;
    }
    const device = devices.find(d => 
      d.authToken === token || 
      d.id === token || 
      (d.templateId === 'TMPL_SCHOOL_LIGHTS' && (token === 'YFr7r30K8HV8rRQ7x59hYojzeU0m9wYs' || token === 'SGT-LIGHT-CTL-89012345678'))
    );
    if (!device) {
      res.status(404).send('Device not found');
      return;
    }

    // Mark device as online on this self-hosted server
    device.status = 'online';
    device.lastSeen = 'Just now';

    // Find requested pin
    const pinParam = (req.query.pin || Object.keys(req.query).find(k => k.toLowerCase().startsWith('v') && k.toLowerCase() !== 'token')) as string;
    if (pinParam) {
      const pinUpper = pinParam.toUpperCase() as VirtualPinId;
      if (device.pins[pinUpper]) {
        const val = device.pins[pinUpper].value;
        // Return raw text format like Blynk API
        res.setHeader('Content-Type', 'text/plain');
        res.send(String(val));
        return;
      }
    }

    // Default: return all pins JSON
    const pinsMap: Record<string, any> = {};
    Object.keys(device.pins).forEach(k => {
      const pk = k as VirtualPinId;
      pinsMap[k.toLowerCase()] = device.pins[pk].value;
    });
    res.json(pinsMap);
  };

  app.get('/external/api/get', handleIotGet);
  app.get('/api/iot/get', handleIotGet);
  app.get('/api/iot/poll', handleIotGet);

  // Direct LED Control Routes for School Lights
  app.get('/led1/on', (_req: Request, res: Response) => {
    const dev = devices.find(d => d.id === 'dev_school_lights' || d.templateId === 'TMPL_SCHOOL_LIGHTS');
    if (dev && dev.pins.V1) {
      dev.pins.V1.value = 1;
      broadcastSSE('device_update', { deviceId: dev.id, device: dev });
    }
    res.setHeader('Content-Type', 'text/plain');
    res.send('1');
  });

  app.get('/led1/off', (_req: Request, res: Response) => {
    const dev = devices.find(d => d.id === 'dev_school_lights' || d.templateId === 'TMPL_SCHOOL_LIGHTS');
    if (dev && dev.pins.V1) {
      dev.pins.V1.value = 0;
      broadcastSSE('device_update', { deviceId: dev.id, device: dev });
    }
    res.setHeader('Content-Type', 'text/plain');
    res.send('0');
  });

  app.get('/led2/on', (_req: Request, res: Response) => {
    const dev = devices.find(d => d.id === 'dev_school_lights' || d.templateId === 'TMPL_SCHOOL_LIGHTS');
    if (dev && dev.pins.V2) {
      dev.pins.V2.value = 1;
      broadcastSSE('device_update', { deviceId: dev.id, device: dev });
    }
    res.setHeader('Content-Type', 'text/plain');
    res.send('1');
  });

  app.get('/led2/off', (_req: Request, res: Response) => {
    const dev = devices.find(d => d.id === 'dev_school_lights' || d.templateId === 'TMPL_SCHOOL_LIGHTS');
    if (dev && dev.pins.V2) {
      dev.pins.V2.value = 0;
      broadcastSSE('device_update', { deviceId: dev.id, device: dev });
    }
    res.setHeader('Content-Type', 'text/plain');
    res.send('0');
  });

  app.get('/led3/on', (_req: Request, res: Response) => {
    const dev = devices.find(d => d.id === 'dev_school_lights' || d.templateId === 'TMPL_SCHOOL_LIGHTS');
    if (dev && dev.pins.V3) {
      dev.pins.V3.value = 1;
      broadcastSSE('device_update', { deviceId: dev.id, device: dev });
    }
    res.setHeader('Content-Type', 'text/plain');
    res.send('1');
  });

  app.get('/led3/off', (_req: Request, res: Response) => {
    const dev = devices.find(d => d.id === 'dev_school_lights' || d.templateId === 'TMPL_SCHOOL_LIGHTS');
    if (dev && dev.pins.V3) {
      dev.pins.V3.value = 0;
      broadcastSSE('device_update', { deviceId: dev.id, device: dev });
    }
    res.setHeader('Content-Type', 'text/plain');
    res.send('0');
  });

  // Direct Smart Agriculture pump control route (/controlPump)
  app.get('/controlPump', (req: Request, res: Response) => {
    const state = req.query.state !== undefined ? Number(req.query.state) : 1;
    const dev = devices.find(d => d.id === 'dev_smart_irrigation' || d.templateId === 'TMPL_SMART_IRRIGATION' || d.templateId === 'TMPL6BUNdn49f');
    if (dev && dev.pins.V0) {
      dev.pins.V0.value = state === 1 ? 1 : 0;
      manualPinOverrides.set(`${dev.id}:V0`, Date.now());
      dev.status = 'online';
      dev.lastSeen = 'Just now';
      dev.lastUpdated = 'Just now';
      broadcastSSE('device_update', { deviceId: dev.id, device: dev });
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/plain');
    res.send('OK');
  });

  // Direct Smart Agriculture auto mode toggle route (/toggleAuto)
  app.get('/toggleAuto', (req: Request, res: Response) => {
    const dev = devices.find(d => d.id === 'dev_smart_irrigation' || d.templateId === 'TMPL_SMART_IRRIGATION' || d.templateId === 'TMPL6BUNdn49f');
    if (dev && dev.pins.V3) {
      let nextState = 0;
      if (req.query.state !== undefined) {
        nextState = Number(req.query.state) === 1 ? 1 : 0;
      } else {
        nextState = Number(dev.pins.V3.value) === 1 ? 0 : 1;
      }
      dev.pins.V3.value = nextState;
      manualPinOverrides.set(`${dev.id}:V3`, Date.now());
      dev.status = 'online';
      dev.lastSeen = 'Just now';
      dev.lastUpdated = 'Just now';
      broadcastSSE('device_update', { deviceId: dev.id, device: dev });
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/plain');
    res.send('OK');
  });

  // Early Warning System Buzzer control route (/controlBuzzer)
  app.get('/controlBuzzer', (req: Request, res: Response) => {
    const dev = devices.find(d => d.id === 'dev_alert_system' || d.templateId === 'TMPL_ALERT_SYSTEM');
    let nextState = 1;
    if (req.query.state !== undefined) {
      nextState = Number(req.query.state) === 1 ? 1 : 0;
    } else if (dev && dev.pins.V6) {
      nextState = Number(dev.pins.V6.value) === 1 ? 0 : 1;
    }
    if (dev) {
      if (dev.pins.V6) {
        dev.pins.V6.value = nextState;
        manualPinOverrides.set(`${dev.id}:V6`, Date.now());
      }
      if (dev.pins.V3) {
        dev.pins.V3.value = nextState;
        manualPinOverrides.set(`${dev.id}:V3`, Date.now());
      }
      dev.status = 'online';
      dev.lastSeen = 'Just now';
      dev.lastUpdated = 'Just now';
      broadcastSSE('device_update', { deviceId: dev.id, device: dev });
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/plain');
    res.send('OK');
  });

  // Early Warning System Strobe control route (/controlStrobe)
  app.get('/controlStrobe', (req: Request, res: Response) => {
    const dev = devices.find(d => d.id === 'dev_alert_system' || d.templateId === 'TMPL_ALERT_SYSTEM');
    const state = req.query.state !== undefined ? Number(req.query.state) : 1;
    if (dev && dev.pins.V3) {
      dev.pins.V3.value = state === 1 ? 1 : 0;
      manualPinOverrides.set(`${dev.id}:V3`, Date.now());
      broadcastSSE('device_update', { deviceId: dev.id, device: dev });
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/plain');
    res.send('OK');
  });

  // Early Warning System Fan control route (/controlFan)
  app.get('/controlFan', (req: Request, res: Response) => {
    const dev = devices.find(d => d.id === 'dev_alert_system' || d.templateId === 'TMPL_ALERT_SYSTEM');
    const speed = req.query.speed !== undefined ? Number(req.query.speed) : 100;
    if (dev && dev.pins.V4) {
      dev.pins.V4.value = Math.max(0, Math.min(100, speed));
      manualPinOverrides.set(`${dev.id}:V4`, Date.now());
      broadcastSSE('device_update', { deviceId: dev.id, device: dev });
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/plain');
    res.send('OK');
  });

  // Early Warning System Emergency GSM Call Trigger (/triggerCall & /triggerEmergencyCall)
  const handleTriggerCallEndpoint = (req: Request, res: Response) => {
    const dev = devices.find(d => d.id === 'dev_alert_system' || d.templateId === 'TMPL_ALERT_SYSTEM');
    if (dev) {
      dev.status = 'online';
      dev.lastSeen = 'Emergency Call Active';
      broadcastSSE('device_update', { deviceId: dev.id, device: dev });
    }
    // Forward alert to Telegram
    fetch('https://api.telegram.org/bot8928313450:AAEvmTZMGGDXRJZ-W1ZuE2vc5AlVSQ5oDbY/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: '5780071626',
        text: '📞 <b>[GSM SIM900A Alert]</b> ប្រព័ន្ធកំពុងខលទៅកាន់លេខទូរស័ព្ទ +85593586803...',
        parse_mode: 'HTML',
      }),
    }).catch(() => {});

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/plain');
    res.send('CALL_EXECUTED');
  };

  app.get('/triggerCall', handleTriggerCallEndpoint);
  app.post('/triggerCall', handleTriggerCallEndpoint);
  app.get('/triggerEmergencyCall', handleTriggerCallEndpoint);
  app.post('/triggerEmergencyCall', handleTriggerCallEndpoint);

  // Smart Bin Generic Toggle route (/toggle)
  const handleSmartBinToggle = (req: Request, res: Response) => {
    const target = req.query.target as string;
    const state = req.query.state !== undefined ? Number(req.query.state) : 1;
    const binDev = devices.find(d => d.id === 'dev_smart_bin' || d.templateId === 'TMPL_SMART_BIN');

    if (binDev) {
      if (target === 'lid') {
        if (binDev.pins.V0) binDev.pins.V0.value = state === 1 ? 1 : 0;
        manualPinOverrides.set(`${binDev.id}:V0`, Date.now());
      } else if (target === 'telegram' || target === 'tg') {
        if (binDev.pins.V2) binDev.pins.V2.value = state === 1 ? 1 : 0;
        manualPinOverrides.set(`${binDev.id}:V2`, Date.now());
      } else if (target === 'call') {
        if (binDev.pins.V5) binDev.pins.V5.value = state === 1 ? 1 : 0;
        manualPinOverrides.set(`${binDev.id}:V5`, Date.now());
      } else if (target === 'sort') {
        if (binDev.pins.V6) binDev.pins.V6.value = state;
        manualPinOverrides.set(`${binDev.id}:V6`, Date.now());
      }
      binDev.status = 'online';
      binDev.lastSeen = 'Just now';
      binDev.lastUpdated = 'Just now';
      broadcastSSE('device_update', { deviceId: binDev.id, device: binDev });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/plain');
    res.send('OK');
  };

  app.get('/toggle', handleSmartBinToggle);
  app.post('/toggle', handleSmartBinToggle);

  // Smart Bin Lid control route (/toggleLid, /controlLid, /open, /close)
  app.get('/toggleLid', (req: Request, res: Response) => {
    const dev = devices.find(d => d.id === 'dev_smart_bin' || d.templateId === 'TMPL_SMART_BIN');
    let nextState = 1;
    if (req.query.state !== undefined) {
      nextState = Number(req.query.state) === 1 ? 1 : 0;
    } else if (dev && dev.pins.V0) {
      nextState = Number(dev.pins.V0.value) === 1 ? 0 : 1;
    }
    if (dev && dev.pins.V0) {
      dev.pins.V0.value = nextState;
      manualPinOverrides.set(`${dev.id}:V0`, Date.now());
      dev.status = 'online';
      dev.lastSeen = 'Just now';
      dev.lastUpdated = 'Just now';
      broadcastSSE('device_update', { deviceId: dev.id, device: dev });
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/plain');
    res.send('OK');
  });

  app.get('/open', (req: Request, res: Response) => {
    const dev = devices.find(d => d.id === 'dev_smart_bin' || d.templateId === 'TMPL_SMART_BIN');
    if (dev && dev.pins.V0) {
      dev.pins.V0.value = 1;
      manualPinOverrides.set(`${dev.id}:V0`, Date.now());
      broadcastSSE('device_update', { deviceId: dev.id, device: dev });
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/plain');
    res.send('OK');
  });

  app.get('/close', (req: Request, res: Response) => {
    const dev = devices.find(d => d.id === 'dev_smart_bin' || d.templateId === 'TMPL_SMART_BIN');
    if (dev && dev.pins.V0) {
      dev.pins.V0.value = 0;
      manualPinOverrides.set(`${dev.id}:V0`, Date.now());
      broadcastSSE('device_update', { deviceId: dev.id, device: dev });
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/plain');
    res.send('OK');
  });

  // Smart Bin Telegram mode toggle (/toggleTelegram)
  app.get('/toggleTelegram', (req: Request, res: Response) => {
    const dev = devices.find(d => d.id === 'dev_smart_bin' || d.templateId === 'TMPL_SMART_BIN');
    const state = req.query.state !== undefined ? Number(req.query.state) : 1;
    if (dev && dev.pins.V2) {
      dev.pins.V2.value = state === 1 ? 1 : 0;
      manualPinOverrides.set(`${dev.id}:V2`, Date.now());
      broadcastSSE('device_update', { deviceId: dev.id, device: dev });
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/plain');
    res.send('OK');
  });

  // Smart Bin Call mode toggle (/toggleCall)
  app.get('/toggleCall', (req: Request, res: Response) => {
    const dev = devices.find(d => d.id === 'dev_smart_bin' || d.templateId === 'TMPL_SMART_BIN');
    const state = req.query.state !== undefined ? Number(req.query.state) : 1;
    if (dev && dev.pins.V5) {
      dev.pins.V5.value = state === 1 ? 1 : 0;
      manualPinOverrides.set(`${dev.id}:V5`, Date.now());
      broadcastSSE('device_update', { deviceId: dev.id, device: dev });
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/plain');
    res.send('OK');
  });

  // Smart Bin Waste Sorting Servo (/sortWaste, /sort)
  app.get('/sortWaste', (req: Request, res: Response) => {
    const dev = devices.find(d => d.id === 'dev_smart_bin' || d.templateId === 'TMPL_SMART_BIN');
    const type = (req.query.type || 'dry') as string;
    let angle = 0; // 0 = Dry, 180 = Wet, 90 = Ready
    if (type === 'wet') angle = 180;
    else if (type === 'ready' || type === 'center') angle = 90;

    if (dev && dev.pins.V6) {
      dev.pins.V6.value = angle;
      manualPinOverrides.set(`${dev.id}:V6`, Date.now());
      broadcastSSE('device_update', { deviceId: dev.id, device: dev });
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/plain');
    res.send(`SORTED_${type.toUpperCase()}`);
  });
  app.get('/sort', (req: Request, res: Response) => {
    const dev = devices.find(d => d.id === 'dev_smart_bin' || d.templateId === 'TMPL_SMART_BIN');
    const type = (req.query.type || 'dry') as string;
    let angle = 0;
    if (type === 'wet') angle = 180;
    else if (type === 'ready' || type === 'center') angle = 90;

    if (dev && dev.pins.V6) {
      dev.pins.V6.value = angle;
      manualPinOverrides.set(`${dev.id}:V6`, Date.now());
      broadcastSSE('device_update', { deviceId: dev.id, device: dev });
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/plain');
    res.send('OK');
  });

  // Early Warning System Test Telegram (/testTelegram)
  const handleTestTelegramEndpoint = (req: Request, res: Response) => {
    const msg = (req.query.msg || req.body?.msg || '🚨 [Manual Test] ការសាកល្បងប្រព័ន្ធផ្តល់សញ្ញាអាសន្ន (Smart Alert System) ដំណើរការប្រក្រតី!') as string;
    fetch('https://api.telegram.org/bot8928313450:AAEvmTZMGGDXRJZ-W1ZuE2vc5AlVSQ5oDbY/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: '5780071626',
        text: msg,
      }),
    }).catch(() => {});

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/plain');
    res.send('TELEGRAM_SENT');
  };

  app.get('/testTelegram', handleTestTelegramEndpoint);
  app.post('/testTelegram', handleTestTelegramEndpoint);

  // Direct sensors route (/readSensors) - Unified support for Early Warning System, Smart Agriculture & Smart Traffic
  app.get('/readSensors', (req: Request, res: Response) => {
    const type = req.query.type as string;
    const agriDev = devices.find(d => d.id === 'dev_smart_irrigation' || d.templateId === 'TMPL_SMART_IRRIGATION' || d.templateId === 'TMPL6BUNdn49f');
    const trafficDev = devices.find(d => d.id === 'dev_traffic_parking' || d.templateId === 'TMPL_TRAFFIC_PARKING');
    const alertDev = devices.find(d => d.id === 'dev_alert_system' || d.templateId === 'TMPL_ALERT_SYSTEM');

    const binDev = devices.find(d => d.id === 'dev_smart_bin' || d.templateId === 'TMPL_SMART_BIN');

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    if (type === 'bin' || type === 'smart_bin') {
      const dryPct = Number(binDev?.pins.V1?.value ?? 60);
      const wetPct = Number(binDev?.pins.V3?.value ?? 18);
      const dryDist = Number((20 - (dryPct / 100) * 15).toFixed(1));
      const wetDist = Number((20 - (wetPct / 100) * 15).toFixed(1));
      const isLidOpen = Number(binDev?.pins.V0?.value ?? 0) === 1;
      const isFull = dryPct >= 90 || wetPct >= 90;
      const modeTg = Number(binDev?.pins.V2?.value ?? 1) === 1;
      const modeCall = Number(binDev?.pins.V5?.value ?? 1) === 1;
      return res.json({
        wetPct,
        wetDist,
        dryPct,
        dryDist,
        isLidOpen,
        isFull,
        btnLid: isLidOpen ? 1 : 0,
        modeTg,
        modeCall,
        is_online: true
      });
    }

    if (type === 'traffic') {
      return res.json({
        slot: Number(trafficDev?.pins.V1?.value ?? 3),
        countA: Number(trafficDev?.pins.V2?.value ?? 0),
        countB: Number(trafficDev?.pins.V3?.value ?? 0),
        countC: Number(trafficDev?.pins.V4?.value ?? 0),
        countD: Number(trafficDev?.pins.V5?.value ?? 0)
      });
    }

    if (type === 'alert' || type === 'early_warning') {
      const co = Number(alertDev?.pins.V0?.value ?? 45);
      const mq135 = Number(alertDev?.pins.V5?.value ?? 180);
      const press = Number(alertDev?.pins.V1?.value ?? 101.3);
      const water = Number(alertDev?.pins.V2?.value ?? 35);
      const buzzer = Number(alertDev?.pins.V6?.value ?? 0) === 1;
      return res.json({
        co,
        mq135,
        press: Number(press.toFixed(1)),
        water,
        buzzer,
        is_online: true
      });
    }

    // Return unified telemetry for all device systems
    const coVal = Number(alertDev?.pins.V0?.value ?? 45);
    const mqVal = Number(alertDev?.pins.V5?.value ?? 180);
    const pressVal = Number(alertDev?.pins.V1?.value ?? 101.3);
    const waterVal = Number(alertDev?.pins.V2?.value ?? 35);
    const buzzerVal = Number(alertDev?.pins.V6?.value ?? 0) === 1;

    res.json({
      // Smart Agriculture
      temp: Number(agriDev?.pins.V2?.value ?? 28.5),
      air_hum: Number(agriDev?.pins.V6?.value ?? 65.0),
      soil_moist: Number(agriDev?.pins.V1?.value ?? 70),
      lux: Number(agriDev?.pins.V4?.value ?? 15000),
      servo: Number(agriDev?.pins.V7?.value ?? 90),
      pump: Number(agriDev?.pins.V0?.value ?? 0) === 1,
      auto: Number(agriDev?.pins.V3?.value ?? 0) === 1,
      // Early Warning System (CO, MQ135, Pressure, Water, Buzzer)
      co: coVal,
      mq135: mqVal,
      press: Number(pressVal.toFixed(1)),
      water: waterVal,
      buzzer: buzzerVal,
      alert: buzzerVal || coVal >= 250 || mqVal >= 500 || waterVal >= 85 || pressVal < 65,
      // Smart Bin (Wet & Dry percentages, distances, lid, alert modes)
      wetPct: Number(binDev?.pins.V3?.value ?? 18),
      wetDist: Number((20 - (Number(binDev?.pins.V3?.value ?? 18) / 100) * 15).toFixed(1)),
      dryPct: Number(binDev?.pins.V1?.value ?? 60),
      dryDist: Number((20 - (Number(binDev?.pins.V1?.value ?? 60) / 100) * 15).toFixed(1)),
      isLidOpen: Number(binDev?.pins.V0?.value ?? 0) === 1,
      isFull: Number(binDev?.pins.V1?.value ?? 60) >= 90 || Number(binDev?.pins.V3?.value ?? 18) >= 90,
      btnLid: Number(binDev?.pins.V0?.value ?? 0),
      modeTg: Number(binDev?.pins.V2?.value ?? 1) === 1,
      modeCall: Number(binDev?.pins.V5?.value ?? 1) === 1,
      // Traffic
      slot: Number(trafficDev?.pins.V1?.value ?? 3),
      countA: Number(trafficDev?.pins.V2?.value ?? 0),
      countB: Number(trafficDev?.pins.V3?.value ?? 0),
      countC: Number(trafficDev?.pins.V4?.value ?? 0),
      countD: Number(trafficDev?.pins.V5?.value ?? 0),
      is_online: true
    });
  });

  // Traffic sensor update endpoint
  app.get('/api/iot/traffic/update', (req: Request, res: Response) => {
    const dev = devices.find(d => d.id === 'dev_traffic_parking' || d.templateId === 'TMPL_TRAFFIC_PARKING');
    if (dev) {
      if (req.query.slot !== undefined && dev.pins.V1) dev.pins.V1.value = Number(req.query.slot);
      if (req.query.countA !== undefined && dev.pins.V2) dev.pins.V2.value = Number(req.query.countA);
      if (req.query.countB !== undefined && dev.pins.V3) dev.pins.V3.value = Number(req.query.countB);
      if (req.query.countC !== undefined && dev.pins.V4) dev.pins.V4.value = Number(req.query.countC);
      if (req.query.countD !== undefined && dev.pins.V5) dev.pins.V5.value = Number(req.query.countD);
      dev.status = 'online';
      dev.lastSeen = 'Just now (Live sync)';
      broadcastSSE('device_update', { deviceId: dev.id, device: dev });
    }
    res.json({ success: true });
  });

  // POST /api/iot/chip/command -> Universal Cross-Device Remote Control to Physical Chip
  app.post('/api/iot/chip/command', async (req: Request, res: Response) => {
    const { deviceId = 'dev_smart_lamp_mq135', pin = 'V0', value = 1, blynkToken, chipIp, sendTelegram = true } = req.body;

    const device = devices.find(d => d.id === deviceId || d.authToken === blynkToken) || devices[0];
    const upperPin = (pin.toUpperCase()) as VirtualPinId;

    if (device && device.pins[upperPin]) {
      const prevVal = device.pins[upperPin].value;
      device.pins[upperPin].value = Number(value);
      manualPinOverrides.set(`${device.id}:${upperPin}`, Date.now());
      device.lastUpdated = 'Just now';

      // Telegram alert on V0 Lamp toggle
      if (sendTelegram && upperPin === 'V0' && prevVal !== Number(value)) {
        const tgMsg = Number(value) === 1 ? '💡 <b>អំពូលកំពុងបើក</b>' : '⭕ <b>អំពូលត្រូវបានបិទ</b>';
        fetch('https://api.telegram.org/bot8928313450:AAEvmTZMGGDXRJZ-W1ZuE2vc5AlVSQ5oDbY/sendMessage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: '5780071626',
            text: tgMsg,
            parse_mode: 'HTML',
          }),
        }).catch(err => console.error('[Telegram Forward Error]', err));
      }

      // Add execution log
      const logEntry: DeviceLog = {
        id: `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        level: 'INFO',
        deviceId: device.id,
        message: `[REMOTE DISPATCH] ${upperPin} -> ${value} sent to physical chip/cloud`,
        messageKhmer: `បានបញ្ជាពីចម្ងាយ: ${upperPin} -> ${value === 1 ? 'ON (បើក)' : 'OFF (បិទ)'} ទៅកាន់ Chip`,
        source: 'CLOUD_API'
      };
      logs.unshift(logEntry);
      if (logs.length > 200) logs.pop();
      broadcastSSE('log_added', logEntry);
      broadcastSSE('device_update', { deviceId: device.id, device });
    }

    // Forward to Blynk Cloud REST API across all regional clusters
    let blynkResult: any = null;
    const tokenToUse = blynkToken || (device ? device.authToken : null);
    if (tokenToUse && tokenToUse.length > 8) {
      const pinLower = pin.toLowerCase();
      const pinUpper = pin.toUpperCase();
      const clusters = [
        `https://sgp1.blynk.cloud/external/api/update?token=${tokenToUse}&${pinLower}=${value}`,
        `https://blynk.cloud/external/api/update?token=${tokenToUse}&${pinLower}=${value}`,
        `https://fra1.blynk.cloud/external/api/update?token=${tokenToUse}&${pinLower}=${value}`,
        `https://ny3.blynk.cloud/external/api/update?token=${tokenToUse}&${pinLower}=${value}`,
        `https://blr1.blynk.cloud/external/api/update?token=${tokenToUse}&${pinLower}=${value}`,
        `https://sgp1.blynk.cloud/external/api/update?token=${tokenToUse}&${pinUpper}=${value}`,
        `https://blynk.cloud/external/api/update?token=${tokenToUse}&${pinUpper}=${value}`
      ];

      const results = await Promise.allSettled(
        clusters.map(url => fetch(url, { method: 'GET' }).then(r => ({ url, status: r.status, ok: r.ok })))
      );

      const successful = results.find(r => r.status === 'fulfilled' && (r.value.ok || r.value.status === 200));
      blynkResult = {
        ok: !!successful,
        details: results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason?.message })
      };
    }

    // Forward to Local IP if specified
    let ipResult: any = null;
    if (chipIp && chipIp.length > 6) {
      try {
        const isTrueState = Number(value) === 1;
        const actionPath = isTrueState ? 'on' : 'off';
        
        let localUrl = `http://${chipIp}/control?pin=${pin.toLowerCase()}&val=${value}`;
        
        // Match specific devices and pins
        if (device && device.id === 'dev_smart_irrigation') {
          if (upperPin === 'V0') {
            localUrl = `http://${chipIp}/controlPump?state=${value}`;
          } else if (upperPin === 'V3') {
            localUrl = `http://${chipIp}/toggleAuto?state=${value}`;
          }
        } else if (device && device.id === 'dev_school_lights') {
          if (upperPin === 'V1') localUrl = `http://${chipIp}/led1/${actionPath}`;
          if (upperPin === 'V2') localUrl = `http://${chipIp}/led2/${actionPath}`;
          if (upperPin === 'V3') localUrl = `http://${chipIp}/led3/${actionPath}`;
        } else if (device && device.id === 'dev_esp32c3_smartbin_dualwall') {
          if (upperPin === 'V2') localUrl = `http://${chipIp}/led1/${actionPath}`;
          if (upperPin === 'V3') localUrl = `http://${chipIp}/led2/${actionPath}`;
        } else if (device && device.id === 'dev_smart_bin') {
          if (upperPin === 'V0') {
            localUrl = `http://${chipIp}/open`;
          }
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const ipRes = await fetch(localUrl, { method: 'GET', signal: controller.signal });
        clearTimeout(timeoutId);
        ipResult = { ok: ipRes.ok, status: ipRes.status, url: localUrl };
      } catch (err: any) {
        ipResult = { ok: false, error: 'Local IP unreachable or timeout' };
      }
    }

    res.json({
      success: true,
      pin: upperPin,
      value: Number(value),
      blynkCloud: blynkResult,
      localIp: ipResult,
      timestamp: Date.now()
    });
  });

  // GET /api/iot/chip/poll-ip?ip=192.168.0.169 -> Read live telemetry & status from physical ESP32
  app.get('/api/iot/chip/poll-ip', async (req: Request, res: Response) => {
    const ip = (req.query.ip as string) || '192.168.0.169';
    const deviceId = req.query.deviceId as string;

    const device = devices.find(d => d.id === deviceId || d.ipAddress === ip) || devices.find(d => d.id === 'dev_smart_irrigation') || devices[0];
    
    // Attempt standard REST telemetry paths on ESP32
    const endpointsToTry = [
      `http://${ip}/readSensors`,
      `http://${ip}/data`,
      `http://${ip}/status`
    ];

    let lastError = '';
    let successData: any = null;

    for (const url of endpointsToTry) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200); // Quick connection timeout
        const espRes = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (espRes.ok) {
          successData = await espRes.json();
          break;
        }
      } catch (err: any) {
        lastError = err?.message || 'Connection timeout';
      }
    }

    if (successData) {
      // 1. Mark device as online
      device.status = 'online';
      device.lastSeen = 'Just now (live IP)';
      device.lastUpdated = 'Just now (live IP)';

      // 2. Map response keys to device pins
      const updatedPins: Record<string, any> = {};

      if (device.id === 'dev_smart_irrigation' || device.templateId === 'TMPL_SMART_FARM') {
        // ESP32 Agriculture keys: temp, air_hum, soil_moist, lux, servo, pump, auto
        if (successData.temp !== undefined && device.pins.V1) {
          device.pins.V1.value = Number(successData.temp);
          updatedPins['v1'] = device.pins.V1.value;
        }
        if (successData.soil_moist !== undefined && device.pins.V2) {
          device.pins.V2.value = Number(successData.soil_moist);
          updatedPins['v2'] = device.pins.V2.value;
        }
        if (successData.lux !== undefined && device.pins.V4) {
          device.pins.V4.value = Number(successData.lux);
          updatedPins['v4'] = device.pins.V4.value;
        }
        if (successData.servo !== undefined && device.pins.V5) {
          device.pins.V5.value = Number(successData.servo);
          updatedPins['v5'] = device.pins.V5.value;
        }
        if (successData.pump !== undefined && device.pins.V0) {
          device.pins.V0.value = (successData.pump === true || successData.pump === 1 || successData.pump === 'true') ? 1 : 0;
          updatedPins['v0'] = device.pins.V0.value;
        }
        if (successData.auto !== undefined && device.pins.V3) {
          device.pins.V3.value = (successData.auto === true || successData.auto === 1 || successData.auto === 'true') ? 1 : 0;
          updatedPins['v3'] = device.pins.V3.value;
        }
        if (successData.air_hum !== undefined && device.pins.V6) {
          device.pins.V6.value = Number(successData.air_hum);
          updatedPins['v6'] = device.pins.V6.value;
        }
      } else if (device.id === 'dev_smart_bin') {
        // ESP32 Smart Bin keys: distance, level, ppm, airBad, led1, led2
        if (successData.level !== undefined && device.pins.V0) {
          device.pins.V0.value = Number(successData.level);
          updatedPins['v0'] = device.pins.V0.value;
        }
        if ((successData.distance !== undefined || successData.dist !== undefined) && device.pins.V1) {
          device.pins.V1.value = Number(successData.distance ?? successData.dist);
          updatedPins['v1'] = device.pins.V1.value;
        }
        if (successData.ppm !== undefined && device.pins.V4) {
          device.pins.V4.value = Number(successData.ppm);
          updatedPins['v4'] = device.pins.V4.value;
        }
        if (successData.airBad !== undefined && device.pins.V5) {
          device.pins.V5.value = (successData.airBad === true || successData.airBad === 1 || successData.airBad === 'true') ? 1 : 0;
          updatedPins['v5'] = device.pins.V5.value;
        }
        if (successData.led1 !== undefined && device.pins.V2) {
          device.pins.V2.value = (successData.led1 === true || successData.led1 === 1 || successData.led1 === 'true') ? 1 : 0;
          updatedPins['v2'] = device.pins.V2.value;
        }
        if (successData.led2 !== undefined && device.pins.V3) {
          device.pins.V3.value = (successData.led2 === true || successData.led2 === 1 || successData.led2 === 'true') ? 1 : 0;
          updatedPins['v3'] = device.pins.V3.value;
        }
      } else if (device.id === 'dev_school_lights' || device.templateId === 'TMPL_SCHOOL_LIGHTS') {
        // School lights keys: led1, led2, led3
        if (successData.led1 !== undefined && device.pins.V1) {
          device.pins.V1.value = (successData.led1 === true || successData.led1 === 1 || successData.led1 === 'true' || successData.led1 === 'on') ? 1 : 0;
          updatedPins['v1'] = device.pins.V1.value;
        }
        if (successData.led2 !== undefined && device.pins.V2) {
          device.pins.V2.value = (successData.led2 === true || successData.led2 === 1 || successData.led2 === 'true' || successData.led2 === 'on') ? 1 : 0;
          updatedPins['v2'] = device.pins.V2.value;
        }
        if (successData.led3 !== undefined && device.pins.V3) {
          device.pins.V3.value = (successData.led3 === true || successData.led3 === 1 || successData.led3 === 'true' || successData.led3 === 'on') ? 1 : 0;
          updatedPins['v3'] = device.pins.V3.value;
        }
      } else if (device.id === 'dev_traffic_parking' || device.templateId === 'TMPL_TRAFFIC_PARKING') {
        // Traffic lights & parking keys: slot/parking (V1), countA/road_a (V2), countB/road_b (V3), countC/road_c (V4), countD/road_d (V5)
        const slotVal = successData.slot ?? successData.parking;
        if (slotVal !== undefined && device.pins.V1) {
          device.pins.V1.value = Number(slotVal);
          updatedPins['v1'] = device.pins.V1.value;
        }
        const countAVal = successData.countA ?? successData.road_a;
        if (countAVal !== undefined && device.pins.V2) {
          device.pins.V2.value = Number(countAVal);
          updatedPins['v2'] = device.pins.V2.value;
        }
        const countBVal = successData.countB ?? successData.road_b;
        if (countBVal !== undefined && device.pins.V3) {
          device.pins.V3.value = Number(countBVal);
          updatedPins['v3'] = device.pins.V3.value;
        }
        const countCVal = successData.countC ?? successData.road_c;
        if (countCVal !== undefined && device.pins.V4) {
          device.pins.V4.value = Number(countCVal);
          updatedPins['v4'] = device.pins.V4.value;
        }
        const countDVal = successData.countD ?? successData.road_d;
        if (countDVal !== undefined && device.pins.V5) {
          device.pins.V5.value = Number(countDVal);
          updatedPins['v5'] = device.pins.V5.value;
        }
      }

      // 3. Trigger telemetry logging & history tick if we have sensor changes
      if (Object.keys(updatedPins).length > 0) {
        const tickData: Record<string, any> = {};
        Object.keys(device.pins).forEach(pk => {
          tickData[pk] = { value: device.pins[pk as VirtualPinId].value };
        });

        // Generate telemetry history point
        const telemetryPoint: TelemetryPoint = {
          timestamp: Date.now(),
          timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          temperature: Number(device.pins.V1?.value ?? 25),
          humidity: Number(device.pins.V6?.value ?? 60),
          gasCo: Number(device.pins.V4?.value ?? 0),
          coLevel: Number(device.pins.V4?.value ?? 0),
          airQualityMq135: Number(device.pins.V4?.value ?? 0),
          waterLevel: Number(device.pins.V0?.value ?? 0),
          soilMoisture: Number(device.pins.V2?.value ?? 0),
          fanSpeed: Number(device.pins.V5?.value ?? 0),
          relay1: Number(device.pins.V0?.value ?? 0),
          relay2: Number(device.pins.V3?.value ?? 0),
        };
        telemetryHistory.push(telemetryPoint);
        if (telemetryHistory.length > 500) telemetryHistory.shift();

        // Broadcast Tick
        broadcastSSE('telemetry_tick', {
          deviceId: device.id,
          point: telemetryPoint,
          pins: tickData
        });

        // Add telemetry trace in Terminal logs
        const logEntry: DeviceLog = {
          id: `poll_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toLocaleTimeString(),
          level: 'SUCCESS',
          deviceId: device.id,
          message: `[ROUTER IP POLL] Read live telemetry from IP: ${ip} | Keys: ${Object.keys(updatedPins).join(', ')}`,
          messageKhmer: `[អានទិន្នន័យ IP] ទទួលបានទិន្នន័យពី IP: ${ip} | ព័ត៌មាន: ${Object.keys(updatedPins).map(k => `${k.toUpperCase()}=${updatedPins[k]}`).join(', ')}`,
          source: 'ESP32_FIRMWARE'
        };
        logs.unshift(logEntry);
        if (logs.length > 200) logs.pop();
        broadcastSSE('log_added', logEntry);
      }

      // Save and broadcast full device update to React
      broadcastSSE('device_update', { deviceId: device.id, device });

      res.json({ success: true, data: successData, ip });
      return;
    }

    res.json({ success: false, error: lastError || 'Device did not return a valid response', ip });
  });

  // POST /api/iot/device/update-ip -> Update IP address of any device
  app.post('/api/iot/device/update-ip', (req: Request, res: Response) => {
    const { deviceId, ipAddress } = req.body;
    const dev = devices.find(d => d.id === deviceId);
    if (!dev) {
      res.status(404).json({ success: false, error: 'Device not found' });
      return;
    }
    dev.ipAddress = ipAddress || '192.168.0.169';
    dev.lastUpdated = 'Just now';
    broadcastSSE('device_update', { deviceId: dev.id, device: dev });
    res.json({ success: true, device: dev });
  });

  // GET /api/iot/get?token=xxx&pin=v2 -> Microcontroller reads a single pin (e.g. Relay ON/OFF status)
  app.get('/api/iot/get', (req: Request, res: Response) => {
    const token = (req.query.token || req.query.auth) as string;
    const pin = (req.query.pin || req.query.v) as string;

    if (!token || !pin) {
      res.status(400).send('ERR_PARAM');
      return;
    }

    const device = devices.find(d => d.authToken === token || d.id === token);
    if (!device) {
      res.status(404).send('ERR_AUTH');
      return;
    }

    const upper = pin.toUpperCase() as VirtualPinId;
    const pinDef = device.pins[upper];
    if (!pinDef) {
      res.status(404).send('ERR_PIN');
      return;
    }

    // Return pure scalar for ultra-lightweight ESP32 reading
    res.setHeader('Content-Type', 'text/plain');
    res.send(String(pinDef.value));
  });

  // GET /api/iot/all?token=xxx -> Microcontroller reads all pin states at once
  app.get('/api/iot/all', (req: Request, res: Response) => {
    const token = (req.query.token || req.query.auth) as string;
    if (!token) {
      res.status(400).json({ error: 'Missing token' });
      return;
    }

    const device = devices.find(d => d.authToken === token || d.id === token);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    const pinValues: Record<string, any> = {};
    Object.keys(device.pins).forEach(p => {
      pinValues[p] = device.pins[p as VirtualPinId].value;
    });

    res.json({
      success: true,
      deviceId: device.id,
      pins: pinValues,
      timestamp: Date.now()
    });
  });

  // GET /api/iot/history -> Telemetry chart data points
  app.get('/api/iot/history', (req: Request, res: Response) => {
    const range = (req.query.range as string) || 'live';
    let data = [...telemetryHistory];

    if (range === 'live') {
      data = data.slice(-30);
    } else if (range === '1h') {
      data = data.slice(-60);
    } else if (range === '6h') {
      data = data.slice(-120);
    }

    res.json({ success: true, count: data.length, points: data });
  });

  // GET /api/iot/logs -> System Logs
  app.get('/api/iot/logs', (_req: Request, res: Response) => {
    res.json({ success: true, logs });
  });

  // POST /api/iot/logs/clear -> Clear terminal logs
  app.post('/api/iot/logs/clear', (_req: Request, res: Response) => {
    logs = [];
    broadcastSSE('logs_cleared', {});
    res.json({ success: true });
  });

  // POST /api/telegram/send -> Send real Telegram message using Bot Token & Chat ID
  app.post('/api/telegram/send', async (req: Request, res: Response) => {
    const { botToken = '8928313450:AAEvmTZMGGDXRJZ-W1ZuE2vc5AlVSQ5oDbY', chatId = '5780071626', message, parseMode = 'HTML' } = req.body;

    if (!message) {
      res.status(400).json({ success: false, error: 'Missing message body' });
      return;
    }

    try {
      const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: parseMode,
        }),
      });

      const data = await response.json() as { ok: boolean; description?: string; result?: any };
      if (!data.ok) {
        res.status(400).json({ success: false, error: data.description || 'Telegram API error' });
        return;
      }

      // Add log
      const logEntry: DeviceLog = {
        id: `tg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        level: 'INFO',
        deviceId: 'dev_smart_lamp_mq135',
        message: `[TELEGRAM SENT] -> Chat ID ${chatId}: ${message.slice(0, 60)}...`,
        messageKhmer: `សារ Telegram បានផ្ញើជោគជ័យទៅកាន់ ID ${chatId}`,
        source: 'TELEGRAM_BOT'
      };
      logs.unshift(logEntry);
      if (logs.length > 200) logs.pop();
      broadcastSSE('log_added', logEntry);

      res.json({ success: true, result: data.result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to send Telegram message' });
    }
  });

  // POST /api/iot/automations -> Save automation rules
  app.get('/api/iot/automations', (_req: Request, res: Response) => {
    res.json({ success: true, automations });
  });

  app.post('/api/iot/automations', (req: Request, res: Response) => {
    const newRules = req.body.automations as AutomationRule[];
    if (Array.isArray(newRules)) {
      automations = newRules;
      broadcastSSE('automations_updated', automations);
      res.json({ success: true, automations });
      return;
    }
    res.status(400).json({ success: false, error: 'Expected array of automations' });
  });

  // POST /api/iot/simulate/toggle -> Toggle simulation
  app.post('/api/iot/simulate/toggle', (req: Request, res: Response) => {
    if (req.body.enabled !== undefined) {
      isSimulating = Boolean(req.body.enabled);
    } else {
      isSimulating = !isSimulating;
    }
    broadcastSSE('simulation_status', { isSimulating });
    res.json({ success: true, isSimulating });
  });

  // POST /api/iot/device/create -> Add custom device
  app.post('/api/iot/device/create', (req: Request, res: Response) => {
    const { name, nameKhmer, templateId, orgId } = req.body;
    const newId = `dev_esp32_${Date.now().toString(36)}`;
    const randomHex = Math.random().toString(16).substring(2, 8);
    const newAuthToken = `blynk_esp32_${randomHex}_${Date.now().toString(36)}`;

    const newDevice: IoTDevice = {
      id: newId,
      name: name || 'ESP32 Custom Node',
      nameKhmer: nameKhmer || 'ESP32 ឧបករណ៍ថ្មី',
      authToken: newAuthToken,
      orgId: orgId || 'ORG-KHMER-IOT-01',
      templateId: templateId || 'TMPL_GENERIC_ESP32',
      status: 'online',
      ipAddress: `192.168.1.${Math.floor(Math.random() * 150 + 100)}`,
      macAddress: `24:6F:28:${randomHex.slice(0, 2).toUpperCase()}:${randomHex.slice(2, 4).toUpperCase()}:${randomHex.slice(4, 6).toUpperCase()}`,
      rssi: -55 - Math.floor(Math.random() * 20),
      firmwareVersion: 'v2.4.1',
      hardware: 'ESP32-WROOM-32',
      lastSeen: 'Just created',
      lastUpdated: '1 minute ago',
      owner: 'Admin (You)',
      location: 'Custom Station',
      pins: JSON.parse(JSON.stringify(INITIAL_DEVICES[0].pins))
    };

    devices.push(newDevice);
    broadcastSSE('device_created', newDevice);
    res.json({ success: true, device: newDevice });
  });

  // POST /api/iot/device/regenerate-token
  app.post('/api/iot/device/regenerate-token', (req: Request, res: Response) => {
    const { deviceId } = req.body;
    const device = devices.find(d => d.id === deviceId);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }
    const randomHex = Math.random().toString(16).substring(2, 10);
    device.authToken = `blynk_esp32_${randomHex}_${Date.now().toString(36)}`;
    broadcastSSE('device_update', { deviceId: device.id, device });
    res.json({ success: true, authToken: device.authToken });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ Blynk IoT Cloud Console Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
