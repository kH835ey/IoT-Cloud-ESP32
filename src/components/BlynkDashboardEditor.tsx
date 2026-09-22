import React, { useState } from 'react';
import { IoTDevice, VirtualPinId } from '../types';
import { DashboardWidget, WidgetType } from '../types/widgetBuilder';
import { RadialGauge } from './RadialGauge';
import { WaterTankLevel } from './WaterTankLevel';
import {
  Plus,
  Trash2,
  Settings,
  Copy,
  MoveUp,
  MoveDown,
  Smartphone,
  Monitor,
  Check,
  X,
  Sparkles,
  Layers,
  Power,
  Sliders,
  Gauge,
  LineChart,
  Type,
  Sun,
  Video,
  Eye,
  RotateCcw,
  Palette,
  Camera,
  Activity,
  AlertTriangle,
  Droplets
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BlynkDashboardEditorProps {
  device: IoTDevice;
  widgets: DashboardWidget[];
  onSaveWidgets: (newWidgets: DashboardWidget[]) => void;
  onClose: () => void;
  onUpdatePin: (pin: VirtualPinId, value: number | string) => void;
  lang: 'km' | 'en';
}

export const BlynkDashboardEditor: React.FC<BlynkDashboardEditorProps> = ({
  device,
  widgets: initialWidgets,
  onSaveWidgets,
  onClose,
  onUpdatePin,
  lang,
}) => {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(initialWidgets);
  const [editingWidget, setEditingWidget] = useState<DashboardWidget | null>(null);
  const [viewMode, setViewMode] = useState<'web' | 'mobile'>('web');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('custom');

  // Pre-configured widget templates matching Blynk.Console exactly
  const TEMPLATE_PRESETS: Record<string, { name: string; widgets: DashboardWidget[] }> = {
    espcam_smoke: {
      name: 'ESP32-CAM Smart Smoke & Light (MQ135 + Flash)',
      widgets: [
        {
          id: 'w_cam_stream',
          type: 'button',
          title: 'ESP32-CAM Video Stream',
          titleKhmer: 'វីដេអូកាមេរ៉ាផ្ទាល់ (ESP32-CAM MJPEG)',
          pin: 'V0',
          color: '#10b981',
          widthCols: 2,
        },
        {
          id: 'w_gas_gauge',
          type: 'gauge',
          title: 'MQ135 Smoke & Gas Sensor',
          titleKhmer: 'កម្រិតផ្សែង / ឧស្ម័ន MQ135',
          pin: 'V0',
          min: 0,
          max: 500,
          unit: 'ppm',
          color: '#f97316',
          widthCols: 1,
        },
        {
          id: 'w_ext_light',
          type: 'switch',
          title: 'External Light (GPIO 12)',
          titleKhmer: 'អំពូលភ្លើងក្រៅ (GPIO 12)',
          pin: 'V2',
          color: '#10b981',
          widthCols: 1,
        },
        {
          id: 'w_cam_flash',
          type: 'switch',
          title: 'Camera Flash / Onboard (GPIO 33)',
          titleKhmer: 'ភ្លើង Flash លើ Board',
          pin: 'V1',
          color: '#f59e0b',
          widthCols: 1,
        },
        {
          id: 'w_smoke_alert_label',
          type: 'label',
          title: 'Smoke Alert Status',
          titleKhmer: 'ស្ថានភាពប្រកាសអាសន្ន',
          pin: 'V3',
          unit: '',
          color: '#ef4444',
          widthCols: 1,
        },
      ],
    },
    traffic_parking: {
      name: 'Traffic light and Parking (Blynk Template)',
      widgets: [
        { id: 'w_lamp', type: 'switch', title: 'Lamp', titleKhmer: 'អំពូលភ្លើង (Lamp)', pin: 'V0', color: '#10b981', widthCols: 1 },
        { id: 'w_parking', type: 'label', title: 'Parking count', titleKhmer: 'ចំនួនចំណតយានយន្ត', pin: 'V1', value: 67, unit: 'Bays', color: '#10b981', widthCols: 1 },
        { id: 'w_road_a', type: 'label', title: 'Road A Car', titleKhmer: 'រថយន្តលើផ្លូវ A', pin: 'V2', value: 92, unit: 'Cars', color: '#3b82f6', widthCols: 1 },
        { id: 'w_road_b', type: 'label', title: 'Road B Car', titleKhmer: 'រថយន្តលើផ្លូវ B', pin: 'V3', value: 13, unit: 'Cars', color: '#8b5cf6', widthCols: 1 },
        { id: 'w_street', type: 'switch', title: 'Street Light', titleKhmer: 'ភ្លើងបំភ្លឺផ្លូវ', pin: 'V4', color: '#f59e0b', widthCols: 1 },
      ],
    },
    smart_farm: {
      name: 'Smart Agriculture & Farm Automation',
      widgets: [
        { id: 'w_pump', type: 'switch', title: 'Water Pump', titleKhmer: 'ម៉ូទ័របូមទឹក', pin: 'V0', color: '#10b981', widthCols: 1 },
        { id: 'w_moisture', type: 'label', title: 'Soil Moisture', titleKhmer: 'សំណើមដី', pin: 'V1', value: 88, unit: '%', color: '#06b6d4', widthCols: 1 },
        { id: 'w_temp', type: 'gauge', title: 'Temperature', titleKhmer: 'សីតុណ្ហភាព', pin: 'V2', min: 0, max: 60, unit: '°C', color: '#f97316', widthCols: 1 },
        { id: 'w_fan_pwm', type: 'slider', title: 'Exhaust Fan Speed', titleKhmer: 'ល្បឿនកង្ហារបញ្ចេញខ្យល់', pin: 'V4', min: 0, max: 100, unit: '%', color: '#3b82f6', widthCols: 1 },
      ],
    },
  };

  const handleApplyPreset = (presetKey: string) => {
    setSelectedTemplate(presetKey);
    if (TEMPLATE_PRESETS[presetKey]) {
      setWidgets(TEMPLATE_PRESETS[presetKey].widgets);
    }
  };

  const handleAddWidget = (type: WidgetType) => {
    const id = `w_${type}_${Date.now()}`;
    let newW: DashboardWidget;

    switch (type) {
      case 'switch':
        newW = {
          id,
          type: 'switch',
          title: 'Switch Control',
          titleKhmer: 'កុងតាក់បញ្ជា',
          pin: 'V0',
          color: '#10b981',
          widthCols: 1,
        };
        break;
      case 'slider':
        newW = {
          id,
          type: 'slider',
          title: 'Slider Control',
          titleKhmer: 'ឧបករណ៍រំកិល PWM',
          pin: 'V4',
          min: 0,
          max: 100,
          step: 1,
          unit: '%',
          color: '#3b82f6',
          widthCols: 1,
          value: 50,
        };
        break;
      case 'gauge':
        newW = {
          id,
          type: 'gauge',
          title: 'Radial Gauge',
          titleKhmer: 'រង្វាស់ម្ជុល Gauge',
          pin: 'V0',
          min: 0,
          max: 500,
          unit: 'ppm',
          color: '#f87171',
          widthCols: 1,
          value: 180,
        };
        break;
      case 'water_tank':
        newW = {
          id,
          type: 'water_tank',
          title: 'Water Level',
          titleKhmer: 'កម្រិតទឹកក្នុងអាង (Liquid Tank)',
          pin: 'V2',
          min: 0,
          max: 100,
          unit: '%',
          color: '#0ea5e9',
          widthCols: 1,
          value: 78,
        };
        break;
      case 'device_metrics':
        newW = {
          id,
          type: 'device_metrics',
          title: 'Devices online now',
          titleKhmer: 'ឧបករណ៍កំពុង Online',
          value: 112,
          color: '#22c55e',
          widthCols: 1,
        };
        break;
      case 'device_count':
        newW = {
          id,
          type: 'device_count',
          title: 'Device count',
          titleKhmer: 'ចំនួនឧបករណ៍សរុប',
          value: 53,
          color: '#10b981',
          widthCols: 1,
        };
        break;
      case 'label':
      default:
        newW = {
          id,
          type: 'label',
          title: 'Value Display',
          titleKhmer: 'បង្ហាញតម្លៃទិន្នន័យ',
          pin: 'V1',
          value: 100,
          unit: '',
          color: '#06b6d4',
          widthCols: 1,
        };
        break;
    }

    setWidgets((prev) => [...prev, newW]);
  };

  const handleDuplicateWidget = (w: DashboardWidget) => {
    const cloned: DashboardWidget = {
      ...w,
      id: `w_${w.type}_${Date.now()}`,
      title: `${w.title} (Copy)`,
    };
    setWidgets((prev) => [...prev, cloned]);
  };

  const handleDeleteWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    if (editingWidget?.id === id) setEditingWidget(null);
  };

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= widgets.length) return;
    const copy = [...widgets];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setWidgets(copy);
  };

  const handleSaveAndFinish = () => {
    onSaveWidgets(widgets);
    confetti({ particleCount: 60, spread: 80, origin: { y: 0.2 } });
    onClose();
  };

  const getWidgetLiveValue = (w: DashboardWidget) => {
    if (!w.pin) return w.value ?? 0;
    const pinData = device.pins[w.pin];
    return pinData ? pinData.value : w.value ?? 0;
  };

  return (
    <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Top Banner Alert for Edit Mode */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 font-bold shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                {lang === 'km' ? 'ផ្ទាំងរៀបចំ Widget (Blynk.Console Edit Mode)' : 'Blynk.Console Widget Canvas Editor'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-slate-950 uppercase tracking-wide">
                Live Editing
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {lang === 'km'
                ? 'អូសទម្លាក់ បន្ថែម/លុប កំណត់ Virtual Pins (V0-V15) និងផ្លាស់ប្តូររូបរាង Dashboard'
                : 'Configure Datastreams, Datatypes, Layout Grid, and Controls for your IoT Device.'}
            </p>
          </div>
        </div>

        {/* View Mode Switcher + Finish Edit Button */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Web Console vs Mobile App toggle */}
          <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('web')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                viewMode === 'web'
                  ? 'bg-slate-800 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Web Console</span>
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                viewMode === 'mobile'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Blynk App (Mobile)</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSaveAndFinish}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/25 transition"
          >
            <Check className="w-4 h-4" />
            <span>Finish Edit</span>
          </button>
        </div>
      </div>

      {/* Preset Quick Loader */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-semibold">
            {lang === 'km' ? 'ជ្រើសរើសគំរូ Dashboard ស្វ័យប្រវត្តិ (Preset Templates):' : 'Load Blynk Template Preset:'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {Object.keys(TEMPLATE_PRESETS).map((key) => (
            <button
              key={key}
              onClick={() => handleApplyPreset(key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                selectedTemplate === key
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {TEMPLATE_PRESETS[key].name.split(' (')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Area: Left Widget Box + Right Live Canvas Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ========================================================================= */}
        {/* LEFT: WIDGET BOX DRAWER (Blynk.Console Style)                             */}
        {/* ========================================================================= */}
        <div className="lg:col-span-3 bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Widget Box</span>
            </h3>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Click to Add
            </span>
          </div>

          {/* Category 1: Controls */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Controllers (បញ្ជា)
            </span>
            <div className="space-y-2">
              {/* Switch Widget Button */}
              <div
                onClick={() => handleAddWidget('switch')}
                className="group bg-slate-900 hover:bg-slate-850 hover:border-emerald-500/50 border border-slate-800 rounded-xl p-3 cursor-pointer transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Power className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Switch</span>
                    <span className="text-[10px] text-slate-500">Relay / Light / Motor</span>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
              </div>

              {/* Slider Widget Button */}
              <div
                onClick={() => handleAddWidget('slider')}
                className="group bg-slate-900 hover:bg-slate-850 hover:border-emerald-500/50 border border-slate-800 rounded-xl p-3 cursor-pointer transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Slider (PWM)</span>
                    <span className="text-[10px] text-slate-500">0-100% Speed / Dimmer</span>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition" />
              </div>
            </div>
          </div>

          {/* Category 2: Displays */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Displays (បង្ហាញទិន្នន័យ)
            </span>
            <div className="space-y-2">
              {/* Radial Gauge */}
              <div
                onClick={() => handleAddWidget('gauge')}
                className="group bg-slate-900 hover:bg-slate-850 hover:border-orange-500/50 border border-slate-800 rounded-xl p-3 cursor-pointer transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                    <Gauge className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Radial Gauge</span>
                    <span className="text-[10px] text-slate-500">MQ135 Gas / Pressure / Temp</span>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-slate-500 group-hover:text-orange-400 transition" />
              </div>

              {/* Water Tank Level (Image 3) */}
              <div
                onClick={() => handleAddWidget('water_tank')}
                className="group bg-slate-900 hover:bg-slate-850 hover:border-sky-500/50 border border-slate-800 rounded-xl p-3 cursor-pointer transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Water Tank Level</span>
                    <span className="text-[10px] text-slate-500">Ultrasonic / Liquid Tank</span>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition" />
              </div>

              {/* Value Label */}
              <div
                onClick={() => handleAddWidget('label')}
                className="group bg-slate-900 hover:bg-slate-850 hover:border-cyan-500/50 border border-slate-800 rounded-xl p-3 cursor-pointer transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Type className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Value Display</span>
                    <span className="text-[10px] text-slate-500">Big Number / Status Label</span>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition" />
              </div>

              {/* Devices Online Metric */}
              <div
                onClick={() => handleAddWidget('device_metrics')}
                className="group bg-slate-900 hover:bg-slate-850 hover:border-emerald-500/50 border border-slate-800 rounded-xl p-3 cursor-pointer transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Fleet Metrics</span>
                    <span className="text-[10px] text-slate-500">112 Active Devices</span>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT: LIVE CANVAS GRID / PHONE MOCKUP                                    */}
        {/* ========================================================================= */}
        <div className="lg:col-span-9 space-y-4">
          {viewMode === 'mobile' ? (
            /* Mobile Phone Mockup View (Blynk Mobile App Frame) */
            <div className="flex justify-center p-4">
              <div className="w-full max-w-sm bg-slate-950 border-4 border-slate-800 rounded-[36px] p-4 shadow-2xl space-y-4 relative">
                {/* Phone Speaker & Notch */}
                <div className="w-28 h-4 bg-slate-800 rounded-full mx-auto mb-2" />

                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-white">{device.name}</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full">
                    • Online
                  </span>
                </div>

                {/* Mobile Grid Layout */}
                <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                  {widgets.map((w, idx) => {
                    const liveVal = getWidgetLiveValue(w);
                    const isSwitchOn = Number(liveVal) === 1 || String(liveVal).toLowerCase() === 'on';

                    return (
                      <div
                        key={w.id}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md space-y-2 relative group"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-200">{lang === 'km' && w.titleKhmer ? w.titleKhmer : w.title}</span>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">{w.pin || 'V0'}</span>
                        </div>

                        {w.type === 'switch' && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 font-mono">{isSwitchOn ? 'ON' : 'OFF'}</span>
                            <button
                              onClick={() => w.pin && onUpdatePin(w.pin, isSwitchOn ? 0 : 1)}
                              className={`w-12 h-6 rounded-full p-0.5 flex items-center transition ${
                                isSwitchOn ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
                              }`}
                            >
                              <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                            </button>
                          </div>
                        )}

                        {w.type === 'label' && (
                          <div className="text-2xl font-black text-white font-mono">
                            {liveVal} {w.unit || ''}
                          </div>
                        )}

                        {w.type === 'gauge' && (
                          <div className="flex justify-center">
                            <RadialGauge
                              id={`mobile-gauge-${w.id}`}
                              value={Number(liveVal)}
                              min={w.min || 0}
                              max={w.max || 500}
                              unit={w.unit || 'ppm'}
                              label={w.title}
                              labelKhmer={w.titleKhmer}
                              color={w.color || '#f87171'}
                              size={200}
                            />
                          </div>
                        )}

                        {w.type === 'water_tank' && (
                          <div className="flex justify-center">
                            <WaterTankLevel
                              id={`mobile-tank-${w.id}`}
                              value={Number(liveVal)}
                              min={w.min || 0}
                              max={w.max || 100}
                              unit={w.unit || '%'}
                              label={w.title}
                              labelKhmer={w.titleKhmer}
                              lang={lang}
                            />
                          </div>
                        )}

                        {w.type === 'slider' && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-slate-400 font-mono">
                              <span>Value:</span>
                              <span className="text-emerald-400 font-bold">{liveVal}%</span>
                            </div>
                            <input
                              type="range"
                              min={w.min || 0}
                              max={w.max || 100}
                              value={Number(liveVal)}
                              onChange={(e) => w.pin && onUpdatePin(w.pin, Number(e.target.value))}
                              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Web Console Canvas Grid (Blynk.Console Layout) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {widgets.map((w, idx) => {
                const liveVal = getWidgetLiveValue(w);
                const isSwitchOn = Number(liveVal) === 1 || String(liveVal).toLowerCase() === 'on';

                return (
                  <div
                    key={w.id}
                    className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between relative group hover:border-emerald-500/50 transition ${
                      w.widthCols && w.widthCols > 1 ? 'sm:col-span-2' : ''
                    }`}
                  >
                    {/* Widget Card Header with Action Tools */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">
                          {lang === 'km' && w.titleKhmer ? w.titleKhmer : w.title}
                        </span>
                      </div>

                      {/* Controls Bar (Pin, Move, Clone, Settings, Delete) */}
                      <div className="flex items-center gap-1">
                        {w.pin && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {w.pin}
                          </span>
                        )}
                        <button
                          onClick={() => moveWidget(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-500 hover:text-slate-200 disabled:opacity-30 transition"
                          title="Move Left/Up"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveWidget(idx, 'down')}
                          disabled={idx === widgets.length - 1}
                          className="p-1 text-slate-500 hover:text-slate-200 disabled:opacity-30 transition"
                          title="Move Right/Down"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicateWidget(w)}
                          className="p-1 text-slate-500 hover:text-slate-200 transition"
                          title="Duplicate Widget"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingWidget(w)}
                          className="p-1 text-slate-500 hover:text-emerald-400 transition"
                          title="Configure Datastream & Settings"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteWidget(w.id)}
                          className="p-1 text-slate-500 hover:text-red-400 transition"
                          title="Remove Widget"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Widget Content based on Type */}
                    {w.type === 'switch' && (
                      <div className="my-2 flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-400">
                          {isSwitchOn ? 'STATE: ON (HIGH)' : 'STATE: OFF (LOW)'}
                        </span>
                        <button
                          onClick={() => w.pin && onUpdatePin(w.pin, isSwitchOn ? 0 : 1)}
                          className={`w-14 h-8 rounded-full p-1 transition flex items-center ${
                            isSwitchOn ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
                          }`}
                        >
                          <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                            <Power className={`w-3.5 h-3.5 ${isSwitchOn ? 'text-emerald-600' : 'text-slate-600'}`} />
                          </div>
                        </button>
                      </div>
                    )}

                    {w.type === 'label' && (
                      <div className="my-2">
                        <span className="text-4xl font-black text-white font-mono tracking-tight">
                          {liveVal}
                        </span>
                        {w.unit && <span className="text-xs font-semibold text-slate-400 ml-1.5">{w.unit}</span>}
                      </div>
                    )}

                    {w.type === 'slider' && (
                      <div className="my-2 space-y-2">
                        <div className="flex justify-between items-center text-xs font-mono">
                          <span className="text-slate-400">Duty Cycle:</span>
                          <span className="font-bold text-blue-400 text-sm">{liveVal}{w.unit || '%'}</span>
                        </div>
                        <input
                          type="range"
                          min={w.min || 0}
                          max={w.max || 100}
                          value={Number(liveVal)}
                          onChange={(e) => w.pin && onUpdatePin(w.pin, Number(e.target.value))}
                          className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                      </div>
                    )}

                    {w.type === 'gauge' && (
                      <div className="flex justify-center my-1">
                        <RadialGauge
                          id={`canvas-gauge-${w.id}`}
                          value={Number(liveVal)}
                          min={w.min || 0}
                          max={w.max || 500}
                          unit={w.unit || 'ppm'}
                          label={w.title}
                          labelKhmer={w.titleKhmer}
                          color={w.color || '#f87171'}
                          size={240}
                        />
                      </div>
                    )}

                    {w.type === 'water_tank' && (
                      <div className="flex justify-center my-1">
                        <WaterTankLevel
                          id={`canvas-tank-${w.id}`}
                          value={Number(liveVal)}
                          min={w.min || 0}
                          max={w.max || 100}
                          unit={w.unit || '%'}
                          label={w.title}
                          labelKhmer={w.titleKhmer}
                          lang={lang}
                        />
                      </div>
                    )}

                    {w.type === 'device_metrics' && (
                      <div className="my-2">
                        <span className="text-4xl font-black text-emerald-400 font-mono">
                          {liveVal}
                        </span>
                        <div className="w-full h-1.5 bg-emerald-500 rounded-full mt-2" />
                      </div>
                    )}

                    {w.type === 'button' && (
                      <div className="my-2 bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Camera className="w-5 h-5 text-emerald-400" />
                          <span className="text-xs text-slate-300 font-semibold">MJPEG Live Camera Feed</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold animate-pulse">
                          STREAMING
                        </span>
                      </div>
                    )}

                    {/* Resize handle icon (Blynk Corner Tag) */}
                    <div className="absolute bottom-1 right-1 text-slate-700 opacity-60">
                      <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor">
                        <polygon points="6 0 6 6 0 6" />
                      </svg>
                    </div>
                  </div>
                );
              })}

              {/* Add New Widget Slot Placeholder */}
              <div
                onClick={() => handleAddWidget('switch')}
                className="h-36 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:text-emerald-400 cursor-pointer transition p-4 group"
              >
                <Plus className="w-8 h-8 mb-1 group-hover:scale-110 transition" />
                <span className="text-xs font-bold">{lang === 'km' ? '+ បន្ថែម Widget ថ្មី' : '+ Add Widget'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Widget Settings Configuration Modal */}
      {editingWidget && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-400" />
                <span>Blynk Datastream Configuration</span>
              </h3>
              <button onClick={() => setEditingWidget(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Widget Title (English):</label>
                <input
                  type="text"
                  value={editingWidget.title}
                  onChange={(e) => setEditingWidget({ ...editingWidget, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Khmer Title (ឈ្មោះជាភាសាខ្មែរ):</label>
                <input
                  type="text"
                  value={editingWidget.titleKhmer || ''}
                  onChange={(e) => setEditingWidget({ ...editingWidget, titleKhmer: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="ឧ. អំពូលភ្លើងបន្ទប់"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Virtual Pin (Blynk Datastream):</label>
                <select
                  value={editingWidget.pin || 'V0'}
                  onChange={(e) => setEditingWidget({ ...editingWidget, pin: e.target.value as VirtualPinId })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                >
                  {Array.from({ length: 16 }).map((_, idx) => (
                    <option key={idx} value={`V${idx}`}>
                      {`V${idx}`} {device.pins[`V${idx}` as VirtualPinId]?.label ? `- ${device.pins[`V${idx}` as VirtualPinId]?.label}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Min Value:</label>
                  <input
                    type="number"
                    value={editingWidget.min ?? 0}
                    onChange={(e) => setEditingWidget({ ...editingWidget, min: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Max Value:</label>
                  <input
                    type="number"
                    value={editingWidget.max ?? 100}
                    onChange={(e) => setEditingWidget({ ...editingWidget, max: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Unit (ឯកតា):</label>
                <input
                  type="text"
                  value={editingWidget.unit || ''}
                  onChange={(e) => setEditingWidget({ ...editingWidget, unit: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  placeholder="e.g. ppm, °C, %, lx, Bays"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingWidget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setWidgets((prev) => prev.map((w) => (w.id === editingWidget.id ? editingWidget : w)));
                  setEditingWidget(null);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
