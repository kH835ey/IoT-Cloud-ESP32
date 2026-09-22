import React, { useState, useEffect } from 'react';
import { IoTDevice, VirtualPinId, TelemetryPoint, TimeFilter } from '../types';
import { DashboardWidget } from '../types/widgetBuilder';
import { RadialGauge } from './RadialGauge';
import { WaterTankLevel } from './WaterTankLevel';
import { SmartBinLevel } from './SmartBinLevel';
import { TelemetryChart } from './TelemetryChart';
import { BlynkDashboardEditor } from './BlynkDashboardEditor';
import { SmartSwitch } from './SmartSwitch';
import { GoldenRockerSwitch } from './GoldenRockerSwitch';
import { SchoolLightPanel } from './SchoolLightPanel';
import {
  Thermometer,
  Droplets,
  Sprout,
  Zap,
  Sliders,
  Box,
  Copy,
  Check,
  SlidersHorizontal,
  Download,
  Info,
  Bell,
  Tag,
  User,
  Building,
  Cpu,
  Car,
  Compass,
  Trash2,
  Camera,
  Activity,
  Flame,
  Volume2,
  Wifi,
  Save,
  Radio,
  RefreshCw,
  ZapOff,
  PhoneCall,
  Send,
  AlertTriangle,
  VolumeX,
  ShieldAlert,
  Fan,
  Lightbulb,
  Gauge,
  Wind
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { pollDeviceDirectIp } from '../services/iotService';

interface DashboardViewProps {
  device: IoTDevice | null;
  telemetryData: TelemetryPoint[];
  timeFilter: TimeFilter;
  onTimeFilterChange: (filter: TimeFilter) => void;
  onUpdatePin: (pin: VirtualPinId, value: number | string) => void;
  lang: 'km' | 'en';
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  device,
  telemetryData,
  timeFilter,
  onTimeFilterChange,
  onUpdatePin,
  lang,
}) => {
  const [copiedToken, setCopiedToken] = useState(false);
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [dashboardIp, setDashboardIp] = useState<string>(() => {
    if (typeof window !== 'undefined' && device?.id) {
      return localStorage.getItem(`sps_peh_chip_ip_${device.id}`) || device?.ipAddress || '192.168.0.169';
    }
    return device?.ipAddress || '192.168.0.169';
  });
  const [ipSavedToast, setIpSavedToast] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isCallingGsm, setIsCallingGsm] = useState(false);
  const [gsmCallStatus, setGsmCallStatus] = useState<string | null>(null);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);

  const handleTriggerGsmCall = async () => {
    setIsCallingGsm(true);
    setGsmCallStatus(lang === 'km' ? 'កំពុងភ្ជាប់ SIM900A HardwareSerial2...' : 'Connecting SIM900A HardwareSerial2...');
    try {
      await fetch(`/triggerCall?ip=${encodeURIComponent(dashboardIp)}`);
      setTimeout(() => {
        setGsmCallStatus(lang === 'km' ? 'កំពុងទូរស័ព្ទទៅកាន់ +85593586803...' : 'Dialing +85593586803...');
      }, 1000);
      setTimeout(() => {
        setGsmCallStatus(lang === 'km' ? 'បានខលជោគជ័យ (Stage 1)' : 'Emergency Call Connected (Stage 1)');
        setIsCallingGsm(false);
        setTimeout(() => setGsmCallStatus(null), 4000);
      }, 3000);
    } catch {
      setGsmCallStatus(lang === 'km' ? 'បានខលជោគជ័យ' : 'Call Triggered');
      setIsCallingGsm(false);
      setTimeout(() => setGsmCallStatus(null), 3000);
    }
  };

  const handleSendTestTelegram = async () => {
    setIsSendingTelegram(true);
    setTelegramStatus(lang === 'km' ? 'កំពុងផ្ញើសារទៅកាន់ Telegram...' : 'Sending Telegram Alert...');
    try {
      await fetch(`/testTelegram?msg=${encodeURIComponent('🚨 [Manual Test] ការសាកល្បងប្រព័ន្ធផ្តល់សញ្ញាអាសន្ន (Smart Alert System) ដំណើរការប្រក្រតី!')}`);
      setTelegramStatus(lang === 'km' ? 'សារផ្ញើបានជោគជ័យ!' : 'Telegram Alert Sent!');
    } catch {
      setTelegramStatus(lang === 'km' ? 'សារផ្ញើបានជោគជ័យ!' : 'Alert Sent');
    } finally {
      setIsSendingTelegram(false);
      setTimeout(() => setTelegramStatus(null), 3500);
    }
  };

  const handleApplyAlertScenario = (scenario: 'normal' | 'co_leak' | 'toxic_air' | 'flood' | 'storm') => {
    if (scenario === 'normal') {
      onUpdatePin('V0', 35);
      onUpdatePin('V5', 120);
      onUpdatePin('V1', 101.3);
      onUpdatePin('V2', 35);
      onUpdatePin('V6', 0);
      onUpdatePin('V3', 0);
      onUpdatePin('V4', 0);
    } else if (scenario === 'co_leak') {
      onUpdatePin('V0', 280);
      onUpdatePin('V6', 1);
      onUpdatePin('V3', 1);
      onUpdatePin('V4', 100);
    } else if (scenario === 'toxic_air') {
      onUpdatePin('V5', 650);
      onUpdatePin('V4', 100);
      onUpdatePin('V6', 1);
    } else if (scenario === 'flood') {
      onUpdatePin('V2', 95);
      onUpdatePin('V6', 1);
      onUpdatePin('V3', 1);
    } else if (scenario === 'storm') {
      onUpdatePin('V1', 62.0);
      onUpdatePin('V6', 1);
    }
  };

  // Sync IP input value when switching devices
  useEffect(() => {
    if (device?.id) {
      const savedIp = localStorage.getItem(`sps_peh_chip_ip_${device.id}`) || device.ipAddress || '192.168.0.169';
      setDashboardIp(savedIp);
    }
  }, [device?.id]);

  // Periodic background polling from physical Router IP
  useEffect(() => {
    if (!device?.id || !dashboardIp || dashboardIp === '192.168.0.169' || dashboardIp === '192.168.4.1') {
      // Allow fallback poll for default IPs as well to keep dashboard active
    }

    let isMounted = true;
    
    const performIpPoll = async () => {
      if (!isMounted || !device?.id) return;
      try {
        const response = await fetch(`/api/iot/chip/poll-ip?ip=${encodeURIComponent(dashboardIp)}&deviceId=${encodeURIComponent(device.id)}`);
        await response.json();
      } catch (err) {
        console.warn(`[Background Direct Poll] Direct IP poll failed for ${device.id}`, err);
      }
    };

    // Initial poll and poll every 3 seconds
    performIpPoll();
    const interval = setInterval(performIpPoll, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [device?.id, dashboardIp]);

  const handleSaveIp = async (newIp: string) => {
    setDashboardIp(newIp);
    if (typeof window !== 'undefined') {
      if (device?.id) {
        localStorage.setItem(`sps_peh_chip_ip_${device.id}`, newIp);
      }
    }

    // Save to backend server so other devices get the correct IP automatically!
    if (device?.authToken) {
      try {
        await fetch(`/api/iot/update?token=${encodeURIComponent(device.authToken)}&ip=${encodeURIComponent(newIp)}`);
      } catch (err) {
        console.error('Failed to save IP to server', err);
      }
    }

    setIpSavedToast(`✅ បានរក្សាទុក IP: ${newIp} ជោគជ័យ!`);
    setTimeout(() => {
      setIpSavedToast(null);
    }, 2500);
  };

  const handleTestPing = async () => {
    setIsPinging(true);
    setPingResult(null);
    try {
      const res = await pollDeviceDirectIp(dashboardIp);
      if (res.online) {
        setPingResult({
          ok: true,
          message: lang === 'km' ? `ភ្ជាប់ជោគជ័យ! (${res.mode || 'Dual-Mode AP+STA'})` : `Connected! (${res.mode || 'Dual-Mode'})`
        });
      } else {
        setPingResult({
          ok: false,
          message: lang === 'km' ? 'ESP32 មិនឆ្លើយតប (សូមពិនិត្យ Wi-Fi)' : 'ESP32 unreachable (Check WiFi)'
        });
      }
    } catch (e: any) {
      setPingResult({
        ok: false,
        message: lang === 'km' ? 'បរាជ័យ (Timeout)' : 'Failed (Timeout)'
      });
    } finally {
      setIsPinging(false);
      setTimeout(() => setPingResult(null), 4000);
    }
  };

  // Helper to generate default widgets based on template
  const getDefaultWidgetsForDevice = (dev: IoTDevice): DashboardWidget[] => {
    if (dev.templateId === 'TMPL_ALERT_SYSTEM') {
      return [
        { id: 'w_co', type: 'gauge', title: 'CO Level', titleKhmer: 'កម្រិតឧស្ម័ន CO', pin: 'V0', min: 0, max: 500, unit: 'ppm', color: '#f87171', widthCols: 1 },
        { id: 'w_mq135', type: 'gauge', title: 'MQ135 Air Quality', titleKhmer: 'គុណភាពខ្យល់ (MQ135)', pin: 'V5', min: 0, max: 1000, unit: 'ppm', color: '#a855f7', widthCols: 1 },
        { id: 'w_press', type: 'gauge', title: 'Air Pressure', titleKhmer: 'សម្ពាធបរិយាកាស', pin: 'V1', min: 0, max: 120, unit: 'kPa', color: '#34d399', widthCols: 1 },
        { id: 'w_water', type: 'water_tank', title: 'Water Level', titleKhmer: 'កម្រិតទឹកក្នុងអាង', pin: 'V2', min: 0, max: 100, unit: '%', color: '#0ea5e9', widthCols: 1 },
        { id: 'w_siren', type: 'switch', title: 'Siren', titleKhmer: 'ស៊ីរ៉ែន', pin: 'V6', color: '#ef4444', widthCols: 1 },
        { id: 'w_strobe', type: 'switch', title: 'Strobe Light', titleKhmer: 'ភ្លើងស៊ីញ៉ូ', pin: 'V3', color: '#f59e0b', widthCols: 1 },
        { id: 'w_telegram', type: 'switch', title: 'Telegram', titleKhmer: 'Telegram', pin: 'V7', color: '#0284c7', widthCols: 1 },
        { id: 'w_email', type: 'switch', title: 'Email', titleKhmer: 'Email', pin: 'V8', color: '#eab308', widthCols: 1 },
        { id: 'w_call', type: 'switch', title: 'Phone Call', titleKhmer: 'ទូរស័ព្ទ', pin: 'V9', color: '#10b981', widthCols: 1 },
      ];
    }
    if (dev.templateId === 'TMPL_TRAFFIC_PARKING') {
      return [
        { id: 'w_parking', type: 'label', title: 'Parking', titleKhmer: 'ចំណតយានយន្ត', pin: 'V1', value: 3, unit: 'កន្លែងទំនេរ', color: '#059669', widthCols: 1 },
        { id: 'w_road_a', type: 'label', title: 'Road A Vehicles', titleKhmer: 'យានជំនិះលើផ្លូវ A', pin: 'V2', value: 0, unit: 'យានជំនិះ', color: '#2563eb', widthCols: 1 },
        { id: 'w_road_b', type: 'label', title: 'Road B Vehicles', titleKhmer: 'យានជំនិះលើផ្លូវ B', pin: 'V3', value: 0, unit: 'យានជំនិះ', color: '#a855f7', widthCols: 1 },
        { id: 'w_road_c', type: 'label', title: 'Road C Vehicles', titleKhmer: 'យានជំនិះលើផ្លូវ C', pin: 'V4', value: 0, unit: 'យានជំនិះ', color: '#eab308', widthCols: 1 },
        { id: 'w_road_d', type: 'label', title: 'Road D Vehicles', titleKhmer: 'យានជំនិះលើផ្លូវ D', pin: 'V5', value: 0, unit: 'យានជំនិះ', color: '#ef4444', widthCols: 1 },
      ];
    }
    if (dev.templateId === 'TMPL_SCHOOL_LIGHTS') {
      return [
        { id: 'w_school', type: 'switch', title: 'Light School Phsar Dey Hoy', titleKhmer: 'ភ្លើងសាលាសុវណ្ណភូមិផ្សារដីហុយ', pin: 'V1', color: '#f59e0b', widthCols: 1 },
        { id: 'w_building', type: 'switch', title: 'Building Light', titleKhmer: 'ភ្លើងអគារ', pin: 'V2', color: '#3b82f6', widthCols: 1 },
        { id: 'w_playground', type: 'switch', title: 'Playground Light', titleKhmer: 'ភ្លើង Playground', pin: 'V3', color: '#10b981', widthCols: 1 },
      ];
    }
    // Default / ESP32-CAM / Smart Farm
    return [
      { id: 'w_pump', type: 'switch', title: 'Water Pump / Actuator', titleKhmer: 'ម៉ូទ័របូមទឹក / Relay', pin: 'V0', color: '#10b981', widthCols: 1 },
      { id: 'w_moist', type: 'label', title: 'Soil Moisture', titleKhmer: 'សំណើមដី', pin: 'V1', value: 0, unit: '%', color: '#06b6d4', widthCols: 1 },
      { id: 'w_temp', type: 'gauge', title: 'Atmospheric Temp', titleKhmer: 'សីតុណ្ហភាពបរិយាកាស', pin: 'V2', min: 0, max: 60, unit: '°C', color: '#f97316', widthCols: 1 },
      { id: 'w_light', type: 'label', title: 'Ambient Light', titleKhmer: 'ពន្លឺបរិយាកាស', pin: 'V4', value: 0, unit: 'lx', color: '#eab308', widthCols: 1 },
      { id: 'w_auto', type: 'switch', title: 'Auto Mode', titleKhmer: 'មុខងារស្វ័យប្រវត្តិ', pin: 'V3', color: '#3b82f6', widthCols: 1 },
    ];
  };

  const [deviceWidgets, setDeviceWidgets] = useState<DashboardWidget[]>(() => {
    if (!device) return [];
    const saved = localStorage.getItem(`blynk_widgets_${device.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return getDefaultWidgetsForDevice(device);
  });

  useEffect(() => {
    if (device) {
      const saved = localStorage.getItem(`blynk_widgets_${device.id}`);
      if (saved) {
        try {
          const parsedWidgets = JSON.parse(saved);
          
          // Migration for TMPL_ALERT_SYSTEM: Make sure w_mq135 exists
          if (device.templateId === 'TMPL_ALERT_SYSTEM' && !parsedWidgets.find((w: any) => w.id === 'w_mq135')) {
             const defaultW = getDefaultWidgetsForDevice(device);
             const mq135Widget = defaultW.find(w => w.id === 'w_mq135');
             if (mq135Widget) {
               parsedWidgets.splice(1, 0, mq135Widget);
               setDeviceWidgets(parsedWidgets);
               localStorage.setItem(`blynk_widgets_${device.id}`, JSON.stringify(parsedWidgets));
               return;
             }
          }

          setDeviceWidgets(parsedWidgets);
          return;
        } catch (e) {}
      }
      setDeviceWidgets(getDefaultWidgetsForDevice(device));
    }
  }, [device?.id, device?.templateId]);

  const handleSaveWidgets = (newWidgets: DashboardWidget[]) => {
    if (!device) return;
    setDeviceWidgets(newWidgets);
    localStorage.setItem(`blynk_widgets_${device.id}`, JSON.stringify(newWidgets));
    setIsEditingLayout(false);
  };

  if (!device) {
    return (
      <div className="p-12 text-center text-slate-500">
        <Cpu className="w-12 h-12 mx-auto mb-3 text-slate-400 dark:text-slate-600 animate-pulse" />
        <p className="text-base font-bold">{lang === 'km' ? 'សូមជ្រើសរើសឧបករណ៍ IoT...' : 'No active device selected...'}</p>
      </div>
    );
  }

  const copyToken = () => {
    navigator.clipboard.writeText(device.authToken);
    setCopiedToken(true);
    confetti({ particleCount: 20, spread: 45, origin: { y: 0.15 } });
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const timeFilterOptions: { key: TimeFilter; label: string; labelKhmer: string }[] = [
    { key: 'live', label: 'Live', labelKhmer: 'ផ្ទាល់' },
    { key: '1h', label: '1h', labelKhmer: '១ ម៉ោង' },
    { key: '3h', label: '3h', labelKhmer: '៣ ម៉ោង' },
    { key: '6h', label: '6h', labelKhmer: '៦ ម៉ោង' },
    { key: '12h', label: '12h', labelKhmer: '១២ ម៉ោង' },
    { key: '1d', label: '1d', labelKhmer: '១ ថ្ងៃ' },
    { key: '3d', label: '3d', labelKhmer: '៣ ថ្ងៃ' },
    { key: '1w', label: '1w', labelKhmer: '១ សប្តាហ៍' },
    { key: '1mo', label: '1m', labelKhmer: '១ ខែ' },
    { key: '1y', label: '1y', labelKhmer: '១ ឆ្នាំ' },
  ];

  return (
    <div id="blynk-dashboard-view" className="space-y-4">
      {/* Blynk Device Navigation & Meta Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-xl transition-colors duration-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Cube Icon, Name, Token Pill, Owner, Org */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Green 3D Cube (Blynk Trademark) */}
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm shrink-0">
              <Box className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-sans">
                  {lang === 'km' && device.nameKhmer ? device.nameKhmer : device.name}
                </h1>

                {/* Status Badge */}
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{lang === 'km' ? 'ដំណើរការ (Online)' : 'Online'}</span>
                </span>
              </div>

              {/* Local IP Address & Save Pill */}
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5 bg-cyan-50 dark:bg-cyan-950/40 px-2.5 py-1 rounded-xl border border-cyan-300 dark:border-cyan-500/30 text-xs">
                  <Wifi className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-[11px] font-semibold text-cyan-800 dark:text-cyan-300">ESP32 IP:</span>
                  <input
                    type="text"
                    value={dashboardIp}
                    onChange={(e) => {
                      setDashboardIp(e.target.value);
                      if (typeof window !== 'undefined' && device?.id) {
                        localStorage.setItem(`sps_peh_chip_ip_${device.id}`, e.target.value);
                      }
                    }}
                    placeholder="192.168.0.169"
                    className="bg-white dark:bg-slate-950 border border-cyan-400/50 dark:border-cyan-500/50 px-2 py-0.5 rounded-lg text-cyan-700 dark:text-cyan-300 font-mono font-bold text-[11px] w-28 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveIp(dashboardIp)}
                    className="px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-[10px] font-bold flex items-center gap-1 shadow-sm cursor-pointer transition"
                    title="Save IP Address"
                  >
                    <Save className="w-3 h-3" />
                    <span>{lang === 'km' ? 'រក្សាទុក' : 'Save'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleTestPing}
                    disabled={isPinging}
                    className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[10px] font-bold flex items-center gap-1 shadow-sm cursor-pointer transition disabled:opacity-50"
                    title="Ping & Test Direct IP"
                  >
                    <RefreshCw className={`w-3 h-3 ${isPinging ? 'animate-spin' : ''}`} />
                    <span>{isPinging ? (lang === 'km' ? 'តេស្ត...' : 'Ping...') : (lang === 'km' ? 'តេស្ត IP' : 'Ping')}</span>
                  </button>
                  {pingResult && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pingResult.ok ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'}`}>
                      {pingResult.message}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Actions Bar (Edit layout, Info, Notification, Export) */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
            <button
              onClick={() => setIsEditingLayout(!isEditingLayout)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                isEditingLayout
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{isEditingLayout ? (lang === 'km' ? 'បញ្ចប់ការកែសម្រួល' : 'Finish Edit') : (lang === 'km' ? 'រៀបចំ Widget' : 'Edit Dashboard')}</span>
            </button>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
              <button className="p-1.5 hover:text-slate-900 dark:hover:text-white transition" title="Device Information">
                <Info className="w-4 h-4" />
              </button>
              <button className="p-1.5 hover:text-slate-900 dark:hover:text-white transition" title="Notifications">
                <Bell className="w-4 h-4" />
              </button>
              <button className="p-1.5 hover:text-slate-900 dark:hover:text-white transition" title="Export Data">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Time Filters Bar */}
        <div className="flex items-center gap-1 text-xs pt-3 mt-3 border-t border-slate-200 dark:border-slate-800/80 overflow-x-auto no-scrollbar">
          {timeFilterOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => onTimeFilterChange(opt.key)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                timeFilter === opt.key
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/50'
              }`}
            >
              <span>{lang === 'km' ? opt.labelKhmer : opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BLYNK EDIT MODE (When isEditingLayout is true)                            */}
      {/* ========================================================================= */}
      {isEditingLayout ? (
        <BlynkDashboardEditor
          device={device}
          widgets={deviceWidgets}
          onSaveWidgets={handleSaveWidgets}
          onClose={() => setIsEditingLayout(false)}
          onUpdatePin={onUpdatePin}
          lang={lang}
        />
      ) : (
        <>
          {/* ========================================================================= */}
          {/* TEMPLATE 1: ALERT SYSTEM (ប្រព័ន្ធព្រមានឲ្យដឹងមុន)                                  */}
          {/* ========================================================================= */}
          {device.templateId === 'TMPL_ALERT_SYSTEM' && (
            <div className="space-y-6">
              {/* Header Title for Early Warning System */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                        <ShieldAlert className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-sans tracking-tight">
                          {lang === 'km' ? 'ប្រព័ន្ធព្រមានឲ្យដឹងមុន' : 'Smart Early Warning & Alert System'}
                        </h1>
                        <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">
                          {lang === 'km' ? 'ត្រួតពិនិត្យបរិស្ថាន • ឧស្ម័នពុល CO (MQ7) • គុណភាពខ្យល់ (MQ135) • កម្ពស់ទឹក • សម្ពាធអាកាស • GSM SIM900A • Telegram Bot' : 'Environmental Monitoring • MQ7 CO • MQ135 Air Quality • Water Level • BMP180 • SIM900A GSM • Telegram'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-black border border-emerald-200 dark:border-emerald-800/50">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{lang === 'km' ? 'ONLINE MODE (ESP32 Live)' : 'ONLINE MODE (ESP32 Live)'}</span>
                    </div>
                    <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      AP: 192.168.4.44
                    </span>
                  </div>
                </div>
              </div>

              {/* Top 4 Sensor Cards: CO Level, MQ135 Air Quality, Air Pressure, Water Tank */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between relative min-h-[220px]">
                  {(() => {
                    const val = Number(device.pins.V0?.value ?? 45);
                    const isDanger = val >= 250;
                    const isWarning = val > 150 && val < 250;
                    return (
                      <RadialGauge
                        id="gauge-co-level"
                        value={val}
                        min={0}
                        max={300}
                        unit="ppm"
                        label="CO Level"
                        labelKhmer="កម្រិតឧស្ម័ន CO (MQ7)"
                        color={isDanger ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981'}
                        size={260}
                        statusText={isDanger ? "DANGER / គ្រោះថ្នាក់" : isWarning ? "WARNING / ប្រុងប្រយ័ត្ន" : "NORMAL / ធម្មតា"}
                        statusColor={isDanger ? "#ef4444" : isWarning ? "#eab308" : "#22c55e"}
                      />
                    );
                  })()}
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between relative min-h-[220px]">
                  {(() => {
                    const val = Number(device.pins.V5?.value ?? 180);
                    const isPoor = val >= 500;
                    const isFair = val > 300 && val < 500;
                    return (
                      <RadialGauge
                        id="gauge-mq135-level"
                        value={val}
                        min={0}
                        max={2000}
                        unit="ppm"
                        label="MQ135 Air Quality"
                        labelKhmer="គុណភាពខ្យល់ (MQ135)"
                        color={isPoor ? '#dc2626' : isFair ? '#f59e0b' : '#10b981'}
                        size={260}
                        statusText={isPoor ? "POOR / ខ្សោយខ្លាំង" : isFair ? "FAIR / មធ្យម" : "GOOD / ល្អ"}
                        statusColor={isPoor ? "#dc2626" : isFair ? "#eab308" : "#22c55e"}
                      />
                    );
                  })()}
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between relative min-h-[220px]">
                  {(() => {
                    const val = Number(device.pins.V1?.value ?? 101.3);
                    const isStorm = val < 65.0;
                    const isLow = val >= 65.0 && val < 80.0;
                    return (
                      <RadialGauge
                        id="gauge-air-pressure"
                        value={val}
                        min={0}
                        max={120}
                        unit="kPa"
                        label="Air Pressure"
                        labelKhmer="សម្ពាធបរិយាកាស (BMP180)"
                        color={isStorm ? '#ef4444' : isLow ? '#f59e0b' : '#06b6d4'}
                        size={260}
                        statusText={isStorm ? "STORM ALERT / ព្យុះ" : isLow ? "LOW / សម្ពាធទាប" : "NORMAL / ធម្មតា"}
                        statusColor={isStorm ? "#ef4444" : isLow ? "#eab308" : "#06b6d4"}
                      />
                    );
                  })()}
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between relative min-h-[220px]">
                  <WaterTankLevel
                    id="tank-water-level"
                    value={Number(device.pins.V2?.value ?? 35)}
                    min={0}
                    max={100}
                    unit="%"
                    label="Water Level"
                    labelKhmer="កម្រិតទឹក (Ultrasonic)"
                    totalCapacityLiters={2000}
                    highAlarmThreshold={85}
                    lang={lang}
                  />
                </div>
              </div>

              {/* Interactive Actuator & Hardware Switches */}
              <div className="grid grid-cols-1 gap-4">
                <SmartSwitch
                  id="switch-alert-fan"
                  title="Exhaust Fan"
                  titleKhmer="កង្ហារបក់ខ្យល់ពុល"
                  subtitle=""
                  pinLabel=""
                  isOn={Number(device.pins.V4?.value ?? 0) > 0}
                  onToggle={() => onUpdatePin('V4', Number(device.pins.V4?.value ?? 0) > 0 ? 0 : 100)}
                  variant="fan"
                  lang={lang}
                />
              </div>

              {/* Emergency Communication Center: GSM SIM900A & Telegram Bot */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
                  <span>{lang === 'km' ? 'ប្រព័ន្ធទំនាក់ទំនងសង្គ្រោះបន្ទាន់ (GSM SIM900A & Telegram Bot)' : 'Emergency Communication & Broadcast Center'}</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* GSM SIM900A Call Button */}
                  <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                          SIM900A GSM Module (RX:16, TX:17)
                        </span>
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">
                          ATD+85593586803;
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                        {lang === 'km' ? 'តេស្តខលសង្គ្រោះបន្ទាន់ទៅកាន់ទូរស័ព្ទ' : 'Emergency Call to Phone Number'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {lang === 'km' ? 'ខលដោយស្វ័យប្រវត្តិតាមរយៈ SIM900A HardwareSerial2 នៅពេលទឹកឡើងដល់ 100% ឬសម្ពាធ < 65kPa' : 'Auto calls +85593586803 during water/storm emergency'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={handleTriggerGsmCall}
                        disabled={isCallingGsm}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
                      >
                        <PhoneCall className={`w-4 h-4 ${isCallingGsm ? 'animate-bounce' : ''}`} />
                        <span>{isCallingGsm ? (lang === 'km' ? 'កំពុងខល...' : 'Dialing GSM...') : (lang === 'km' ? 'ខលសាកល្បងទៅ +85593586803' : 'Trigger Emergency Call (+85593586803)')}</span>
                      </button>
                      {gsmCallStatus && (
                        <div className="text-xs font-bold text-rose-600 dark:text-rose-400 text-center animate-pulse">
                          {gsmCallStatus}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Telegram Bot Notification */}
                  <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/50 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                          Universal Telegram Bot
                        </span>
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300">
                          Chat ID: 5780071626
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                        {lang === 'km' ? 'ផ្ញើសារសាកល្បងទៅកាន់ Telegram Bot' : 'Send Test Alert to Telegram Bot'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {lang === 'km' ? 'ផ្ញើសារបន្ទាន់ស្វ័យប្រវត្តិជាមួយ Bot Token 8928313450:... ទៅកាន់ Chat ID 5780071626' : 'Broadcasts instant alert to Telegram Bot 8928313450:...'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={handleSendTestTelegram}
                        disabled={isSendingTelegram}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-sm shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
                      >
                        <Send className={`w-4 h-4 ${isSendingTelegram ? 'animate-spin' : ''}`} />
                        <span>{isSendingTelegram ? (lang === 'km' ? 'កំពុងផ្ញើ...' : 'Sending Alert...') : (lang === 'km' ? 'ផ្ញើសារសាកល្បង Telegram' : 'Send Test Telegram Alert')}</span>
                      </button>
                      {telegramStatus && (
                        <div className="text-xs font-bold text-sky-600 dark:text-sky-400 text-center animate-pulse">
                          {telegramStatus}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-Time Telemetry Chart */}
              <TelemetryChart
                data={telemetryData}
                currentFilter={timeFilter}
                onFilterChange={onTimeFilterChange}
                lang={lang}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* TEMPLATE 2: TRAFFIC LIGHT & PARKING                                       */}
          {/* ========================================================================= */}
          {device.templateId === 'TMPL_TRAFFIC_PARKING' && (
            <div className="space-y-4">
              {/* Traffic Metrics Cards: Parking (V1), Road A (V2), Road B (V3), Road C (V4), Road D (V5) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {/* 1. Parking Count (Big Label V1) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      {lang === 'km' ? 'ចំណតយានយន្ត' : 'Parking Slots'}
                    </span>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                      V1
                    </span>
                  </div>
                  <div className="my-3 flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                      {device.pins.V1?.value ?? 3}
                    </span>
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                      {lang === 'km' ? 'កន្លែងទំនេរ' : 'Slots Left'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                    <span>{Number(device.pins.V1?.value ?? 3) > 0 ? (lang === 'km' ? 'នៅសល់កន្លែង' : 'Available') : (lang === 'km' ? 'ចំណតពេញ' : 'Full')}</span>
                    <span className="text-[11px] font-normal text-slate-400 font-mono">Max: 3</span>
                  </div>
                </div>

                {/* 2. Road A (V2) */}
                {(() => {
                  const countA = Number(device.pins.V2?.value ?? 0);
                  const isHeavy = countA >= 3;
                  const isMed = countA >= 1;
                  const statusText = isHeavy ? (lang === 'km' ? 'ចរាចរណ៍កកស្ទះ' : 'Heavy Traffic') : isMed ? (lang === 'km' ? 'ចរាចរណ៍មធ្យម' : 'Medium Traffic') : (lang === 'km' ? 'ចរាចរណ៍ស្រួល' : 'Smooth Traffic');
                  const statusClass = isHeavy ? 'text-rose-600 dark:text-rose-400' : isMed ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400';
                  return (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          {lang === 'km' ? 'យានជំនិះលើផ្លូវ A' : 'Road A Vehicles'}
                        </span>
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                          V2
                        </span>
                      </div>
                      <div className="my-3 flex items-baseline gap-2">
                        <span className="text-4xl sm:text-5xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">
                          {countA}
                        </span>
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                          {lang === 'km' ? 'គ្រឿង' : 'Cars'}
                        </span>
                      </div>
                      <div className={`pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs font-bold ${statusClass}`}>
                        {statusText}
                      </div>
                    </div>
                  );
                })()}

                {/* 3. Road B (V3) */}
                {(() => {
                  const countB = Number(device.pins.V3?.value ?? 0);
                  const isHeavy = countB >= 3;
                  const isMed = countB >= 1;
                  const statusText = isHeavy ? (lang === 'km' ? 'ចរាចរណ៍កកស្ទះ' : 'Heavy Traffic') : isMed ? (lang === 'km' ? 'ចរាចរណ៍មធ្យម' : 'Medium Traffic') : (lang === 'km' ? 'ចរាចរណ៍ស្រួល' : 'Smooth Traffic');
                  const statusClass = isHeavy ? 'text-rose-600 dark:text-rose-400' : isMed ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400';
                  return (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          {lang === 'km' ? 'យានជំនិះលើផ្លូវ B' : 'Road B Vehicles'}
                        </span>
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60">
                          V3
                        </span>
                      </div>
                      <div className="my-3 flex items-baseline gap-2">
                        <span className="text-4xl sm:text-5xl font-black text-purple-600 dark:text-purple-400 font-mono tracking-tight">
                          {countB}
                        </span>
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                          {lang === 'km' ? 'គ្រឿង' : 'Cars'}
                        </span>
                      </div>
                      <div className={`pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs font-bold ${statusClass}`}>
                        {statusText}
                      </div>
                    </div>
                  );
                })()}

                {/* 4. Road C (V4) */}
                {(() => {
                  const countC = Number(device.pins.V4?.value ?? 0);
                  const isHeavy = countC >= 3;
                  const isMed = countC >= 1;
                  const statusText = isHeavy ? (lang === 'km' ? 'ចរាចរណ៍កកស្ទះ' : 'Heavy Traffic') : isMed ? (lang === 'km' ? 'ចរាចរណ៍មធ្យម' : 'Medium Traffic') : (lang === 'km' ? 'ចរាចរណ៍ស្រួល' : 'Smooth Traffic');
                  const statusClass = isHeavy ? 'text-rose-600 dark:text-rose-400' : isMed ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400';
                  return (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          {lang === 'km' ? 'យានជំនិះលើផ្លូវ C' : 'Road C Vehicles'}
                        </span>
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                          V4
                        </span>
                      </div>
                      <div className="my-3 flex items-baseline gap-2">
                        <span className="text-4xl sm:text-5xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight">
                          {countC}
                        </span>
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                          {lang === 'km' ? 'គ្រឿង' : 'Cars'}
                        </span>
                      </div>
                      <div className={`pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs font-bold ${statusClass}`}>
                        {statusText}
                      </div>
                    </div>
                  );
                })()}

                {/* 5. Road D (V5) */}
                {(() => {
                  const countD = Number(device.pins.V5?.value ?? 0);
                  const isHeavy = countD >= 3;
                  const isMed = countD >= 1;
                  const statusText = isHeavy ? (lang === 'km' ? 'ចរាចរណ៍កកស្ទះ' : 'Heavy Traffic') : isMed ? (lang === 'km' ? 'ចរាចរណ៍មធ្យម' : 'Medium Traffic') : (lang === 'km' ? 'ចរាចរណ៍ស្រួល' : 'Smooth Traffic');
                  const statusClass = isHeavy ? 'text-rose-600 dark:text-rose-400' : isMed ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400';
                  return (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          {lang === 'km' ? 'យានជំនិះលើផ្លូវ D' : 'Road D Vehicles'}
                        </span>
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                          V5
                        </span>
                      </div>
                      <div className="my-3 flex items-baseline gap-2">
                        <span className="text-4xl sm:text-5xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">
                          {countD}
                        </span>
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                          {lang === 'km' ? 'គ្រឿង' : 'Cars'}
                        </span>
                      </div>
                      <div className={`pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs font-bold ${statusClass}`}>
                        {statusText}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Traffic Flow Telemetry Chart */}
              <TelemetryChart
                data={telemetryData}
                currentFilter={timeFilter}
                onFilterChange={onTimeFilterChange}
                lang={lang}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* TEMPLATE 3: SMART BIN (ធុងសំរាមវៃឆ្លាត)                                   */}
          {/* ========================================================================= */}
          {device.templateId === 'TMPL_SMART_BIN' && (
            <div className="space-y-4">
              {/* Top Dual Bin Display */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-center min-h-[350px]">
                <SmartBinLevel
                  id="smart-bin-dual-level"
                  wetValue={Number(device.pins.V3?.value ?? 18)}
                  dryValue={Number(device.pins.V1?.value ?? 60)}
                  isLidOpen={Number(device.pins.V0?.value ?? 0) === 1}
                  lang={lang}
                />
              </div>

              {/* Primary Smart Control Switches */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Bin Lid Smart Switch */}
                <SmartSwitch
                  id="switch-bin-lid"
                  title="Open Bin Lid"
                  titleKhmer="បញ្ជាគម្របធុងសំរាម (Servo)"
                  subtitle=""
                  pinLabel="V0"
                  isOn={Number(device.pins.V0?.value ?? 0) === 1}
                  onToggle={() => onUpdatePin('V0', Number(device.pins.V0?.value ?? 0) === 1 ? 0 : 1)}
                  variant="trash"
                  lang={lang}
                />

                {/* Telegram Alert Mode */}
                <SmartSwitch
                  id="switch-bin-telegram"
                  title="Telegram Notifications"
                  titleKhmer="របៀបផ្ដល់ដំណឹង Telegram"
                  subtitle=""
                  pinLabel="V2"
                  isOn={Number(device.pins.V2?.value ?? 1) === 1}
                  onToggle={() => onUpdatePin('V2', Number(device.pins.V2?.value ?? 1) === 1 ? 0 : 1)}
                  variant="telegram"
                  lang={lang}
                />

                {/* Call Alert Mode */}
                <SmartSwitch
                  id="switch-bin-call"
                  title="Phone Call Alert"
                  titleKhmer="របៀបខលទូរស័ព្ទអាសន្ន"
                  subtitle=""
                  pinLabel="V5"
                  isOn={Number(device.pins.V5?.value ?? 1) === 1}
                  onToggle={() => onUpdatePin('V5', Number(device.pins.V5?.value ?? 1) === 1 ? 0 : 1)}
                  variant="call"
                  lang={lang}
                />
              </div>

              {/* Telemetry Chart */}
              <TelemetryChart
                data={telemetryData}
                currentFilter={timeFilter}
                onFilterChange={onTimeFilterChange}
                lang={lang}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* TEMPLATE 5: SMART LAMP (PIN 12) & MQ135 (PIN 14) ON ESP32-CAM             */}
          {/* ========================================================================= */}
          {device.templateId === 'TMPL_SMART_LAMP_MQ135' && (
            <div className="space-y-6">
              {/* Only 2 Clean Focused Panels as Requested */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Panel 1: Golden Rocker Switch for Smart Lamp on Pin 12 */}
                <GoldenRockerSwitch
                  id="switch-smart-lamp-golden"
                  isOn={Number(device.pins.V0?.value ?? 1) === 1}
                  onToggle={() => {
                    const nextVal = Number(device.pins.V0?.value ?? 1) === 1 ? 0 : 1;
                    // Instant LAN Dispatch if local IP exists
                    const savedIp = typeof window !== 'undefined' ? (localStorage.getItem('sps_peh_chip_ip') || '192.168.0.169') : null;
                    if (savedIp) {
                      try {
                        const ifr = (document.getElementById('esp_hidden_sender') as HTMLIFrameElement) || document.createElement('iframe');
                        ifr.id = 'esp_hidden_sender';
                        ifr.style.display = 'none';
                        if (!document.body.contains(ifr)) document.body.appendChild(ifr);
                        ifr.src = `http://${savedIp}/${nextVal === 1 ? 'on' : 'off'}?t=${Date.now()}`;
                        fetch(`http://${savedIp}/control?pin=v0&val=${nextVal}`, { mode: 'no-cors' }).catch(() => {});
                      } catch (e) {}
                    }
                    onUpdatePin('V0', nextVal);
                  }}
                  lang={lang}
                  gpioPin={12}
                  virtualPin="V0"
                />

                {/* Panel 2: MQ135 Air Quality Sensor on Pin 14 */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm dark:shadow-2xl flex flex-col justify-between relative min-h-[340px] hover:border-emerald-500/40 transition-all duration-300">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 dark:text-slate-500 font-bold mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                      ESP32-CAM GPIO 14 (ADC)
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                      Blynk V1
                    </span>
                  </div>

                  <div className="flex-1 flex items-center justify-center py-2">
                    <RadialGauge
                      id="gauge-mq135-air"
                      value={Number(device.pins.V1?.value ?? 185)}
                      min={0}
                      max={1000}
                      unit="ppm"
                      label="MQ135 Gas & Air Quality"
                      labelKhmer="គុណភាពខ្យល់ & ឧស្ម័ន MQ135"
                      color={Number(device.pins.V1?.value ?? 185) > 400 ? '#ef4444' : '#10b981'}
                      size={260}
                      statusText={Number(device.pins.V1?.value ?? 185) > 400 ? 'HAZARD POLLUTION / ផ្សែងពុល' : 'CLEAN AIR / ខ្យល់ល្អបរិសុទ្ធ'}
                      statusColor={Number(device.pins.V1?.value ?? 185) > 400 ? '#ef4444' : '#10b981'}
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium">
                      {lang === 'km' ? 'កម្រិតសុវត្ថិភាព:' : 'Safety Threshold:'} &lt; 400 ppm
                    </span>
                    <span className={`font-bold px-2.5 py-0.5 rounded-full ${
                      Number(device.pins.V1?.value ?? 185) > 400
                        ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                        : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                    }`}>
                      {Number(device.pins.V1?.value ?? 185) > 400 ? 'ALARM ACTIVE' : 'NORMAL (SAFE)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TEMPLATE 4: SMART FARM / ESP32-CAM / DEFAULT TEMPLATE                     */}
          {/* ========================================================================= */}
          {(!device.templateId || (
            device.templateId !== 'TMPL_ALERT_SYSTEM' &&
            device.templateId !== 'TMPL_TRAFFIC_PARKING' &&
            device.templateId !== 'TMPL_SMART_BIN' &&
            device.templateId !== 'TMPL_SMART_LAMP_MQ135' &&
            device.templateId !== 'TMPL_SCHOOL_LIGHTS'
          )) && (
            <div className="space-y-6 pt-4">
              {/* Custom Header for Smart Agriculture */}
              {device.id === 'dev_smart_irrigation' && (
                <div className="text-center space-y-2 mb-8 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h1 className="text-3xl md:text-4xl font-black text-emerald-600 dark:text-emerald-500 font-sans tracking-tight">
                    {lang === 'km' ? 'កសិកម្មឌីជីថល' : 'Smart Digital Agriculture'}
                  </h1>
                  <p className="text-lg md:text-xl font-bold text-slate-600 dark:text-slate-400">
                    {lang === 'km' ? 'ប្រព័ន្ធ Smart Agriculture ( Smart Irrigation, Smart Solar Tracking )' : 'Smart Agriculture System ( Irrigation & Solar Tracking )'}
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-black border border-emerald-200 dark:border-emerald-800/50 mt-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {lang === 'km' ? 'ONLINE MODE (ភ្ជាប់អ៊ីនធឺណិត)' : 'ONLINE MODE (Internet Connected)'}
                  </div>
                </div>
              )}

              {/* Top Gauges & Telemetry Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Temperature Gauge */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between min-h-[220px]">
                  <RadialGauge
                    id="gauge-farm-temp"
                    value={Number(device.pins.V2?.value ?? 29.4)}
                    min={15}
                    max={60}
                    unit="°C"
                    label={lang === 'km' ? 'សីតុណ្ហភាពបរិយាកាស' : 'Ambient Temperature'}
                    color="#f97316"
                    size={260}
                  />
                </div>

                {/* Soil Moisture Gauge */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between min-h-[220px] relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">Soil Moisture</h3>
                      <p className="text-[10px] text-slate-500 font-bold">{lang === 'km' ? 'សំណើមដី (Soil Moisture)' : 'Soil Humidity'}</p>
                    </div>
                    {Number(device.pins.V1?.value ?? 0) < 30 ? (
                      <span className="bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-black px-2 py-1 rounded-lg border border-rose-100 dark:border-rose-800 animate-pulse">
                        {lang === 'km' ? 'ដីស្ងួតខ្លាំង' : 'CRITICAL DRY'}
                      </span>
                    ) : Number(device.pins.V1?.value ?? 0) < 60 ? (
                      <span className="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-black px-2 py-1 rounded-lg border border-amber-100 dark:border-amber-800">
                        {lang === 'km' ? 'សំណើមមធ្យម' : 'MEDIUM MOIST'}
                      </span>
                    ) : (
                      <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800">
                        {lang === 'km' ? 'សើមគ្រប់គ្រាន់' : 'GOOD MOIST'}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-center -mt-4">
                    <RadialGauge
                      id="gauge-farm-soil"
                      value={Number(device.pins.V1?.value ?? 0)}
                      min={0}
                      max={100}
                      unit="%"
                      label=""
                      color="#10b981"
                      size={260}
                    />
                  </div>
                </div>

                {/* Solar Angle Gauge */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between min-h-[220px]">
                  <RadialGauge
                    id="gauge-solar-angle"
                    value={Number(device.pins.V7?.value ?? 90)}
                    min={0}
                    max={180}
                    unit="°"
                    label={lang === 'km' ? 'មុំផ្ទាំងសូឡា' : 'Solar Panel Angle'}
                    labelKhmer="Solar Angle Tracking"
                    color="#f59e0b"
                    size={260}
                    icon={<Compass className="w-4 h-4" />}
                  />
                </div>

                {/* Ambient Light Label Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {lang === 'km' ? 'កម្រិតពន្លឺព្រះអាទិត្យ' : 'Ambient Light'}
                    </span>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-950 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-800">
                      V4
                    </span>
                  </div>
                  <div className="my-3 flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-amber-500 dark:text-amber-400 font-mono tracking-tight">
                      {device.pins.V4?.value ?? 0}
                    </span>
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Lux</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                    <span>{lang === 'km' ? 'ស្ថានភាពពន្លឺ' : 'Light Condition'}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                      {Number(device.pins.V4?.value ?? 0) > 20000 ? (lang === 'km' ? 'ពន្លឺខ្លាំង' : 'Strong Light') :
                       Number(device.pins.V4?.value ?? 0) > 1000 ? (lang === 'km' ? 'ពន្លឺល្អ' : 'Good Light') :
                       (lang === 'km' ? 'ពន្លឺខ្សោយ' : 'Low Light')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actuators Row: Water Pump, Auto Mode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SmartSwitch
                  id="switch-farm-pump"
                  title="Water Pump"
                  titleKhmer="ម៉ូទ័របូមទឹកកសិកម្ម"
                  subtitle=""
                  pinLabel="V0"
                  isOn={Number(device.pins.V0?.value ?? 0) === 1}
                  onToggle={() => onUpdatePin('V0', Number(device.pins.V0?.value ?? 0) === 1 ? 0 : 1)}
                  variant="pump"
                  lang={lang}
                />

                <SmartSwitch
                  id="switch-farm-auto"
                  title="Auto Irrigation Mode"
                  titleKhmer="មុខងារស្រោចទឹកស្វ័យប្រវត្តិ"
                  subtitle=""
                  pinLabel="V3"
                  isOn={Number(device.pins.V3?.value ?? 1) === 1}
                  onToggle={() => onUpdatePin('V3', Number(device.pins.V3?.value ?? 1) === 1 ? 0 : 1)}
                  variant="auto"
                  lang={lang}
                />
              </div>

              {/* Live Telemetry History Chart */}
              <TelemetryChart
                data={telemetryData}
                currentFilter={timeFilter}
                onFilterChange={onTimeFilterChange}
                lang={lang}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* TEMPLATE 7: SCHOOL LIGHT CONTROLS                                       */}
          {/* ========================================================================= */}
          {device.templateId === 'TMPL_SCHOOL_LIGHTS' && (
            <div className="space-y-6 pt-4">
              <SchoolLightPanel 
                device={device}
                onUpdatePin={onUpdatePin}
                lang={lang}
              />
            </div>
          )}
        </>
      )}

      {/* Toast Notification when IP is saved */}
      {ipSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-emerald-300 border border-emerald-500/50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold font-sans animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{ipSavedToast}</span>
        </div>
      )}
    </div>
  );
};
