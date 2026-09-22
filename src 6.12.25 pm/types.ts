export type VirtualPinId =
  | 'V0'
  | 'V1'
  | 'V2'
  | 'V3'
  | 'V4'
  | 'V5'
  | 'V6'
  | 'V7'
  | 'V8'
  | 'V9'
  | 'V10'
  | 'V11'
  | 'V12'
  | 'V13'
  | 'V14'
  | 'V15';

export type PinType =
  | 'sensor_temperature'
  | 'sensor_humidity'
  | 'sensor_gas'
  | 'sensor_soil'
  | 'sensor_voltage'
  | 'sensor_pressure'
  | 'sensor_light'
  | 'sensor_distance'
  | 'relay'
  | 'slider_pwm'
  | 'rgb_light'
  | 'status_led'
  | 'counter'
  | 'generic';

export interface PinDefinition {
  pin: VirtualPinId;
  label: string;
  labelKhmer: string;
  type: PinType;
  unit?: string;
  min: number;
  max: number;
  value: number | string;
  gpioPin?: number;
  color: string;
  iconName: string;
  history?: number[];
}

export interface IoTDevice {
  id: string;
  name: string;
  nameKhmer: string;
  authToken: string;
  orgId: string;
  templateId: string;
  owner: string;
  status: 'online' | 'offline' | 'inactive' | 'warning';
  ipAddress: string;
  macAddress: string;
  rssi: number; // dBm (-30 to -90)
  firmwareVersion: string;
  hardware: string;
  lastSeen: string;
  lastUpdated: string;
  location: string;
  pins: Record<VirtualPinId, PinDefinition>;
}

export interface TelemetryPoint {
  timestamp: number;
  timeStr: string;
  temperature: number; // V0 / V7
  humidity: number;    // V1 / V6
  gasCo: number;       // V0 CO Level / Smoke
  coLevel?: number;    // CO Level (V0)
  airQualityMq135?: number; // MQ-135 Air Quality / NH3 / CO2 / Alcohol (ppm)
  waterLevel?: number; // Water Level % (V2)
  airPressure?: number;// Air Pressure kPa (V1)
  ambientLight?: number; // BH1750 Ambient Light (V12)
  soilMoisture: number;// V7
  fanSpeed: number;    // V4
  relay1: number;      // V2
  relay2: number;      // V3
}

export interface AutomationRule {
  id: string;
  name: string;
  nameKhmer: string;
  enabled: boolean;
  sourcePin: VirtualPinId;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  targetPin: VirtualPinId;
  targetValue: number;
  cooldownSeconds: number;
  lastTriggered?: string;
  actionDescription: string;
}

export interface DeviceLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'DATA';
  deviceId: string;
  message: string;
  messageKhmer?: string;
  source: 'ESP32_FIRMWARE' | 'CLOUD_API' | 'AUTOMATION' | 'SIMULATOR' | 'TELEGRAM_BOT';
}

export type TimeFilter = 'live' | '1h' | '3h' | '6h' | '12h' | '1d' | '3d' | '1w' | '1mo' | '1y';

export type NavigationTab = 'dashboard' | 'widget_builder' | 'devices' | 'analytics' | 'automations' | 'logs' | 'firmware' | 'simulator';
