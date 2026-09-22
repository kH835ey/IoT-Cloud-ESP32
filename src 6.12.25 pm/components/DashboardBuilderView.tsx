import React, { useState } from 'react';
import { DashboardWidget, WidgetType, CustomDashboardTemplate } from '../types/widgetBuilder';
import { IoTDevice, VirtualPinId } from '../types';
import { RadialGauge } from './RadialGauge';
import { WaterTankLevel } from './WaterTankLevel';
import {
  ToggleLeft,
  Sliders,
  Type,
  Gauge,
  LineChart,
  Plus,
  Trash2,
  Settings,
  Move,
  Check,
  X,
  Sparkles,
  Info,
  Layers,
  Database,
  Users,
  Calendar,
  Sun,
  Lightbulb,
  Fan,
  Power,
  RotateCcw,
  Maximize2,
  Edit3,
  Cpu,
  ArrowRight,
  Droplets
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DashboardBuilderViewProps {
  device: IoTDevice | null;
  onUpdatePin: (pin: VirtualPinId, value: number | string) => void;
  lang: 'km' | 'en';
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
  {
    id: 'w_lamp',
    type: 'switch',
    title: 'Lamp',
    titleKhmer: 'អំពូលភ្លើង (Lamp)',
    pin: 'V0',
    color: '#10b981',
    widthCols: 1,
  },
  {
    id: 'w_parking_count',
    type: 'label',
    title: 'Parking count',
    titleKhmer: 'ចំនួនចំណតយានយន្ត',
    pin: 'V1',
    value: 67,
    unit: 'Bays',
    color: '#10b981',
    widthCols: 1,
  },
  {
    id: 'w_road_a',
    type: 'label',
    title: 'Road A Car',
    titleKhmer: 'រថយន្តលើផ្លូវ A',
    pin: 'V2',
    value: 92,
    unit: 'Cars',
    color: '#3b82f6',
    widthCols: 1,
  },
  {
    id: 'w_road_b',
    type: 'label',
    title: 'Road B Car',
    titleKhmer: 'រថយន្តលើផ្លូវ B',
    pin: 'V3',
    value: 13,
    unit: 'Cars',
    color: '#8b5cf6',
    widthCols: 1,
  },
  {
    id: 'w_street_light',
    type: 'switch',
    title: 'Street Light',
    titleKhmer: 'ភ្លើងបំភ្លឺផ្លូវ',
    pin: 'V4',
    color: '#f59e0b',
    widthCols: 1,
  },
];

export const DashboardBuilderView: React.FC<DashboardBuilderViewProps> = ({
  device,
  onUpdatePin,
  lang,
}) => {
  const [dashboardTitle, setDashboardTitle] = useState('Traffic light and Parking');
  const [dateRange, setDateRange] = useState<'1d' | '1w' | '1mo' | '3mo' | '1y'>('1d');
  const [widgets, setWidgets] = useState<DashboardWidget[]>(DEFAULT_WIDGETS);
  const [isEditing, setIsEditing] = useState(true);
  const [editingWidget, setEditingWidget] = useState<DashboardWidget | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Add new widget from Widget Box
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
          title: 'Brightness Slider',
          titleKhmer: 'កម្រិតពន្លឺ / ល្បឿន',
          pin: 'V4',
          min: 0,
          max: 100,
          step: 1,
          unit: '%',
          color: '#3b82f6',
          widthCols: 1,
          value: 75,
        };
        break;
      case 'gauge':
        newW = {
          id,
          type: 'gauge',
          title: 'Gas / Smoke Level',
          titleKhmer: 'កម្រិតផ្សែង / ឧស្ម័ន',
          pin: 'V5',
          min: 0,
          max: 500,
          unit: 'ppm',
          color: '#f87171',
          widthCols: 1,
          value: 230,
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
      case 'label':
      default:
        newW = {
          id,
          type: 'label',
          title: 'Sensor Metric',
          titleKhmer: 'តម្លៃ Sensor',
          pin: 'V1',
          value: 111,
          unit: '',
          color: '#06b6d4',
          widthCols: 1,
        };
        break;
    }

    setWidgets((prev) => [...prev, newW]);
  };

  const handleDeleteWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    if (editingWidget?.id === id) setEditingWidget(null);
  };

  const handleApplyChanges = () => {
    setSaveSuccess(true);
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.2 } });
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleResetDefaults = () => {
    setWidgets(DEFAULT_WIDGETS);
    setDashboardTitle('Traffic light and Parking');
  };

  // Helper to read current device pin value
  const getWidgetLiveValue = (w: DashboardWidget) => {
    if (!device || !w.pin) return w.value ?? 0;
    const pinData = device.pins[w.pin];
    return pinData ? pinData.value : w.value ?? 0;
  };

  return (
    <div id="blynk-console-canvas-view" className="space-y-4">
      {/* Top Header Bar matching Blynk.Console */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0 font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={dashboardTitle}
                onChange={(e) => setDashboardTitle(e.target.value)}
                className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-emerald-500 focus:outline-none transition px-1 py-0.5"
                placeholder="Dashboard Title"
              />
              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'km'
                ? 'អូសទម្លាក់ Widget រៀបចំផ្ទាំង Dashboard តាមចិត្ត ដូចក្នុង Blynk.Console'
                : 'Blynk.Console Visual Canvas & Custom Drag-and-Drop Widget Builder'}
            </p>
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2">
          <button
            id="reset-dashboard-btn"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{lang === 'km' ? 'កំណត់ឡើងវិញ' : 'Reset'}</span>
          </button>

          <button
            id="cancel-dashboard-btn"
            onClick={() => setWidgets(DEFAULT_WIDGETS)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 transition"
          >
            {lang === 'km' ? 'បោះបង់ (Cancel)' : 'Cancel'}
          </button>

          <button
            id="apply-changes-btn"
            onClick={handleApplyChanges}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#bbf451] hover:bg-[#aee645] text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-lime-500/20 transition"
          >
            {saveSuccess ? <Check className="w-4 h-4 text-emerald-900" /> : null}
            <span>{saveSuccess ? (lang === 'km' ? 'រក្សាទុកជោគជ័យ!' : 'Applied!') : (lang === 'km' ? 'រក្សាទុក (Apply Changes)' : 'Apply Changes')}</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Left Widget Box + Right Interactive Canvas (Exact match with user's image) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: WIDGET BOX (Exact match with user screenshot)                */}
        {/* ========================================================================= */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-500" />
              <span>Widget Box</span>
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              Blynk Pro
            </span>
          </div>

          <div className="space-y-4">
            {/* Section 1: Device metrics */}
            <div>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Device metrics
              </span>

              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Controls</span>
                
                {/* Switch Item in Widget Box */}
                <div
                  onClick={() => handleAddWidget('switch')}
                  className="group bg-slate-50 dark:bg-slate-950/80 hover:border-emerald-500/50 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 cursor-pointer transition shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Switch</span>
                    <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition" />
                  </div>
                  <div className="w-12 h-6 rounded-full bg-slate-700 p-1 flex items-center">
                    <div className="w-4 h-4 rounded-full bg-white shadow" />
                  </div>
                </div>

                {/* Slider Item in Widget Box */}
                <div
                  onClick={() => handleAddWidget('slider')}
                  className="group bg-slate-50 dark:bg-slate-950/80 hover:border-emerald-500/50 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 cursor-pointer transition shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Slider</span>
                    <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full relative">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500 bg-slate-900 absolute -top-1 left-3 shadow" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white font-mono">1</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Tiles */}
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-2">Tiles</span>
              
              <div className="space-y-2">
                {/* Label Tile */}
                <div
                  onClick={() => handleAddWidget('label')}
                  className="group bg-slate-50 dark:bg-slate-950/80 hover:border-emerald-500/50 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 cursor-pointer transition shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Label</span>
                    <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition" />
                  </div>
                  <span className="text-2xl font-black text-slate-800 dark:text-white font-mono">111</span>
                </div>

                {/* Device Count Tile */}
                <div
                  onClick={() => handleAddWidget('device_count')}
                  className="group bg-slate-50 dark:bg-slate-950/80 hover:border-emerald-500/50 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 cursor-pointer transition shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Device count</span>
                    <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition" />
                  </div>
                  <span className="text-2xl font-black text-slate-800 dark:text-white font-mono">53</span>
                </div>

                {/* Devices online now Tile */}
                <div
                  onClick={() => handleAddWidget('device_metrics')}
                  className="group bg-slate-50 dark:bg-slate-950/80 hover:border-emerald-500/50 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 cursor-pointer transition shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Devices online now</span>
                    <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition" />
                  </div>
                  <span className="text-2xl font-black text-slate-800 dark:text-white font-mono">112</span>
                  <div className="w-full h-1 bg-emerald-500 rounded-full mt-2" />
                </div>

                {/* Semicircle Gauge Tile */}
                <div
                  onClick={() => handleAddWidget('gauge')}
                  className="group bg-slate-50 dark:bg-slate-950/80 hover:border-emerald-500/50 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 cursor-pointer transition shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Radial Gauge</span>
                    <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition" />
                  </div>
                  <div className="flex items-center gap-2 text-orange-400 text-xs font-bold mt-1">
                    <Gauge className="w-4 h-4" />
                    <span>0 - 500 ppm (MQ135)</span>
                  </div>
                </div>

                {/* Water Tank Tile (Image 3) */}
                <div
                  onClick={() => handleAddWidget('water_tank')}
                  className="group bg-slate-50 dark:bg-slate-950/80 hover:border-sky-500/50 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 cursor-pointer transition shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Water Tank Level</span>
                    <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500 transition" />
                  </div>
                  <div className="flex items-center gap-2 text-sky-400 text-xs font-bold mt-1">
                    <Droplets className="w-4 h-4" />
                    <span>0 - 100% (Ultrasonic)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Tables */}
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-2">Tables</span>
              <div
                onClick={() => handleAddWidget('label')}
                className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 cursor-pointer hover:border-emerald-500/50 transition"
              >
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Device table</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: CANVAS & GRID (Exact match with user screenshot)           */}
        {/* ========================================================================= */}
        <div className="lg:col-span-9 space-y-4">
          {/* Top Canvas Bar (Data Source, Access, Default Date Range) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Data Source Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Data Source
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  This dashboard includes data from <strong className="text-slate-700 dark:text-slate-200">All devices</strong>
                </p>
              </div>
              <button className="mt-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline self-start">
                Change...
              </button>
            </div>

            {/* 2. Access Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Access
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Manage who can view the dashboard
                </p>
              </div>
              <button className="mt-3 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 self-start">
                <Users className="w-3.5 h-3.5" />
                <span>Manage...</span>
              </button>
            </div>

            {/* 3. Default Date Range Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Default Date Range
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                  Will be applied by default
                </p>
              </div>

              {/* Range Pills (1d, 1w, 1mo, 3mo, 1y) */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800/80 overflow-x-auto text-xs">
                {(['1d', '1w', '1mo', '3mo', '1y'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setDateRange(r)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition text-[11px] flex items-center gap-1 ${
                      dateRange === r
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>{r}</span>
                    {r === '1mo' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />}
                    {r === '3mo' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />}
                    {r === '1y' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid Canvas of Placed Widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {widgets.map((w) => {
              const liveVal = getWidgetLiveValue(w);
              const isSwitchOn = Number(liveVal) === 1 || String(liveVal).toLowerCase() === 'on' || liveVal === true;

              return (
                <div
                  key={w.id}
                  className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-md flex flex-col justify-between relative group hover:border-slate-400 dark:hover:border-slate-600 transition ${
                    w.widthCols && w.widthCols > 1 ? `sm:col-span-${w.widthCols}` : ''
                  }`}
                >
                  {/* Top Bar inside Widget Card */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {lang === 'km' && w.titleKhmer ? w.titleKhmer : w.title}
                    </span>

                    {/* Widget Action Controls */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                      {w.pin && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {w.pin}
                        </span>
                      )}
                      <button
                        onClick={() => setEditingWidget(w)}
                        className="p-1 hover:text-emerald-500 text-slate-400 transition"
                        title="Configure Pin & Name"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteWidget(w.id)}
                        className="p-1 hover:text-red-500 text-slate-400 transition"
                        title="Delete Widget"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Widget Body based on Type */}
                  {w.type === 'switch' && (
                    <div className="my-2 flex items-center justify-between">
                      <button
                        onClick={() => {
                          if (w.pin) {
                            onUpdatePin(w.pin, isSwitchOn ? 0 : 1);
                          }
                        }}
                        className={`w-14 h-8 rounded-full p-1 transition flex items-center cursor-pointer ${
                          isSwitchOn ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                          <Power className={`w-3.5 h-3.5 ${isSwitchOn ? 'text-emerald-600' : 'text-slate-600'}`} />
                        </div>
                      </button>
                      <span className="text-xs font-bold text-slate-400 font-mono">
                        {isSwitchOn ? 'ACTIVE (1)' : 'OFF (0)'}
                      </span>
                    </div>
                  )}

                  {w.type === 'slider' && (
                    <div className="my-2 space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-slate-400">Value:</span>
                        <span className="font-bold text-emerald-500 text-sm">{liveVal} {w.unit || ''}</span>
                      </div>
                      <input
                        type="range"
                        min={w.min || 0}
                        max={w.max || 100}
                        value={Number(liveVal)}
                        onChange={(e) => {
                          if (w.pin) onUpdatePin(w.pin, Number(e.target.value));
                        }}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                  )}

                  {w.type === 'label' && (
                    <div className="my-2">
                      <span className="text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                        {liveVal}
                      </span>
                      {w.unit && <span className="text-xs font-semibold text-slate-400 ml-1.5">{w.unit}</span>}
                    </div>
                  )}

                  {w.type === 'device_count' && (
                    <div className="my-2">
                      <span className="text-4xl font-black text-slate-900 dark:text-white font-mono">
                        {liveVal}
                      </span>
                      <p className="text-[11px] text-emerald-500 font-semibold mt-1">Active IoT Fleets</p>
                    </div>
                  )}

                  {w.type === 'device_metrics' && (
                    <div className="my-2">
                      <span className="text-4xl font-black text-emerald-500 font-mono">
                        {liveVal}
                      </span>
                      <div className="w-full h-1 bg-emerald-500 rounded-full mt-2" />
                    </div>
                  )}

                  {w.type === 'gauge' && (
                    <div className="flex justify-center my-1">
                      <RadialGauge
                        id={`gauge-w-${w.id}`}
                        value={Number(liveVal)}
                        min={w.min || 0}
                        max={w.max || 500}
                        unit={w.unit || 'ppm'}
                        label={w.title}
                        labelKhmer={w.titleKhmer}
                        color={w.color || '#f87171'}
                        size={220}
                      />
                    </div>
                  )}

                  {w.type === 'water_tank' && (
                    <div className="flex justify-center my-1">
                      <WaterTankLevel
                        id={`tank-w-${w.id}`}
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

                  {/* Corner Resize handle indicator (like in Blynk UI) */}
                  <div className="absolute bottom-1 right-1 text-slate-400 dark:text-slate-600 opacity-60">
                    <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor">
                      <polygon points="6 0 6 6 0 6" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty Placeholders Grid to give true Blynk Canvas feel */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 opacity-40 hover:opacity-70 transition">
            {[1, 2, 3, 4].map((slot) => (
              <div
                key={slot}
                onClick={() => handleAddWidget('switch')}
                className="h-28 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-500/50 cursor-pointer transition"
              >
                <Plus className="w-6 h-6 mb-1" />
                <span className="text-[11px] font-semibold">{lang === 'km' ? 'ចុចបន្ថែម Widget' : 'Drop Widget Here'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Configuration Modal for Widget (Pin, Name, Unit) */}
      {editingWidget && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-500" />
                <span>Configure Widget</span>
              </h3>
              <button
                onClick={() => setEditingWidget(null)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Widget Title:</label>
                <input
                  type="text"
                  value={editingWidget.title}
                  onChange={(e) =>
                    setEditingWidget({ ...editingWidget, title: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Khmer Title (ចំណងជើងខ្មែរ):</label>
                <input
                  type="text"
                  value={editingWidget.titleKhmer || ''}
                  onChange={(e) =>
                    setEditingWidget({ ...editingWidget, titleKhmer: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  placeholder="ឧ. អំពូលភ្លើងបន្ទប់"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Virtual Pin (Blynk Datastream):</label>
                <select
                  value={editingWidget.pin || 'V0'}
                  onChange={(e) =>
                    setEditingWidget({ ...editingWidget, pin: e.target.value as VirtualPinId })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-emerald-600 dark:text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                >
                  {Array.from({ length: 16 }).map((_, idx) => (
                    <option key={idx} value={`V${idx}`}>
                      {`V${idx}`} {device?.pins[`V${idx}` as VirtualPinId]?.label ? `- ${device?.pins[`V${idx}` as VirtualPinId]?.label}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Min Value:</label>
                  <input
                    type="number"
                    value={editingWidget.min ?? 0}
                    onChange={(e) =>
                      setEditingWidget({ ...editingWidget, min: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Value:</label>
                  <input
                    type="number"
                    value={editingWidget.max ?? 100}
                    onChange={(e) =>
                      setEditingWidget({ ...editingWidget, max: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit (ឯកតា):</label>
                <input
                  type="text"
                  value={editingWidget.unit || ''}
                  onChange={(e) =>
                    setEditingWidget({ ...editingWidget, unit: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                  placeholder="e.g. ppm, °C, %, Cars"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setEditingWidget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setWidgets((prev) =>
                    prev.map((w) => (w.id === editingWidget.id ? editingWidget : w))
                  );
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
