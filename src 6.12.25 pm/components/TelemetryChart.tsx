import React, { useState, useMemo } from 'react';
import { TelemetryPoint, TimeFilter } from '../types';
import { Activity, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface TelemetryChartProps {
  data: TelemetryPoint[];
  currentFilter: TimeFilter;
  onFilterChange: (filter: TimeFilter) => void;
  lang: 'km' | 'en';
}

type SensorKey = 'temperature' | 'humidity' | 'gasCo' | 'airQualityMq135' | 'waterLevel' | 'airPressure' | 'soilMoisture' | 'ambientLight';

interface SensorConfig {
  key: SensorKey;
  label: string;
  labelKhmer: string;
  unit: string;
  color: string;
  minDomain: number;
  maxDomain: number;
}

const SENSORS: SensorConfig[] = [
  { key: 'gasCo', label: 'CO Gas', labelKhmer: 'ឧស្ម័នពុល CO', unit: 'ppm', color: '#ef4444', minDomain: 0, maxDomain: 500 },
  { key: 'airQualityMq135', label: 'Gas (NH3/CO2)', labelKhmer: 'ផ្សែង/ឧស្ម័ន', unit: 'ppm', color: '#a855f7', minDomain: 50, maxDomain: 800 },
  { key: 'waterLevel', label: 'Water Level', labelKhmer: 'កម្រិតនីវ៉ូទឹក', unit: '%', color: '#0ea5e9', minDomain: 0, maxDomain: 100 },
  { key: 'airPressure', label: 'Air Pressure', labelKhmer: 'សម្ពាធបរិយាកាស', unit: 'kPa', color: '#10b981', minDomain: 90, maxDomain: 120 },
  { key: 'ambientLight', label: 'Light', labelKhmer: 'ពន្លឺ', unit: 'lx', color: '#facc15', minDomain: 0, maxDomain: 2000 },
  { key: 'temperature', label: 'Temp', labelKhmer: 'សីតុណ្ហភាព', unit: '°C', color: '#f97316', minDomain: 15, maxDomain: 45 },
  { key: 'humidity', label: 'Humidity', labelKhmer: 'សំណើម', unit: '%', color: '#06b6d4', minDomain: 20, maxDomain: 100 },
  { key: 'soilMoisture', label: 'Soil Moist', labelKhmer: 'សំណើមដី', unit: '%', color: '#84cc16', minDomain: 10, maxDomain: 90 },
];

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  data,
  currentFilter,
  onFilterChange,
  lang
}) => {
  const [activeSensors, setActiveSensors] = useState<Record<SensorKey, boolean>>({
    gasCo: true,
    airQualityMq135: true,
    waterLevel: true,
    airPressure: true,
    ambientLight: false,
    temperature: false,
    humidity: false,
    soilMoisture: false,
  });

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const toggleSensor = (key: SensorKey) => {
    setActiveSensors(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const chartHeight = 240;
  const chartWidth = 780;
  const padding = { top: 20, right: 30, bottom: 30, left: 45 };

  const usableWidth = chartWidth - padding.left - padding.right;
  const usableHeight = chartHeight - padding.top - padding.bottom;

  // Filtered dataset
  const points = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (currentFilter === 'live') return data.slice(-25);
    if (currentFilter === '1h') return data.slice(-50);
    if (currentFilter === '6h') return data.slice(-90);
    return data;
  }, [data, currentFilter]);

  // Compute stats
  const stats = useMemo(() => {
    if (points.length === 0) return { coAvg: 0, coMin: 0, coMax: 0, mqAvg: 0, waterAvg: 0, pressAvg: 0, tempAvg: 0, humAvg: 0 };
    const coVals = points.map(p => p.coLevel ?? p.gasCo ?? 306);
    const mqVals = points.map(p => p.airQualityMq135 ?? p.gasCo ?? 185);
    const waterVals = points.map(p => p.waterLevel ?? 28);
    const pressVals = points.map(p => p.airPressure ?? 103.5);
    const temps = points.map(p => p.temperature);
    const hums = points.map(p => p.humidity);

    return {
      coAvg: Math.round(coVals.reduce((a, b) => a + b, 0) / coVals.length),
      coMin: Math.min(...coVals),
      coMax: Math.max(...coVals),
      mqAvg: Math.round(mqVals.reduce((a, b) => a + b, 0) / mqVals.length),
      waterAvg: Math.round(waterVals.reduce((a, b) => a + b, 0) / waterVals.length),
      pressAvg: (pressVals.reduce((a, b) => a + b, 0) / pressVals.length).toFixed(1),
      tempAvg: (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1),
      humAvg: (hums.reduce((a, b) => a + b, 0) / hums.length).toFixed(1),
    };
  }, [points]);

  // Generate SVG path points
  const generatePath = (sensorKey: SensorKey) => {
    if (points.length < 2) return '';
    const sensor = SENSORS.find(s => s.key === sensorKey)!;

    const coords = points.map((p, idx) => {
      const x = padding.left + (idx / (points.length - 1)) * usableWidth;
      const rawVal = p[sensorKey as keyof TelemetryPoint];
      let val = typeof rawVal === 'number' ? rawVal : 0;
      if (sensorKey === 'gasCo') val = p.coLevel ?? p.gasCo ?? 306;
      if (sensorKey === 'airQualityMq135') val = p.airQualityMq135 ?? (p.gasCo ? Math.round(p.gasCo * 0.6) : 185);
      if (sensorKey === 'waterLevel') val = p.waterLevel ?? 28;
      if (sensorKey === 'airPressure') val = p.airPressure ?? 103.5;
      if (sensorKey === 'ambientLight') val = p.ambientLight ?? 120;

      const normalizedY = (val - sensor.minDomain) / (sensor.maxDomain - sensor.minDomain || 1);
      const clampedNorm = Math.max(0, Math.min(1, normalizedY));
      const y = padding.top + (1 - clampedNorm) * usableHeight;
      return { x, y };
    });

    // Smooth Bezier Curve
    let path = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i === 0 ? 0 : i - 1];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return path;
  };

  // Generate fill area path
  const generateAreaPath = (sensorKey: SensorKey) => {
    if (points.length < 2) return '';
    const linePath = generatePath(sensorKey);
    const lastX = padding.left + usableWidth;
    const firstX = padding.left;
    const bottomY = padding.top + usableHeight;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  // Download Excel
  const exportExcel = () => {
    if (points.length === 0) return;
    
    // Prepare data excluding Fan_Speed_Pct, Relay1, Relay2
    const data = points.map(p => ({
      Timestamp: p.timestamp,
      Time: p.timeStr,
      Temperature_C: p.temperature,
      Humidity_Pct: p.humidity,
      CO_Gas_PPM: p.coLevel ?? p.gasCo ?? 306,
      MQ135_Gas_PPM: p.airQualityMq135 ?? 185,
      Water_Level_Pct: p.waterLevel ?? 28,
      Air_Pressure_kPa: p.airPressure ?? 103.5,
      Ambient_Light_lx: p.ambientLight ?? 120,
      SoilMoisture_Pct: p.soilMoisture,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Telemetry");
    
    XLSX.writeFile(workbook, `blynk_telemetry_${currentFilter}_${Date.now()}.xlsx`);
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

  const hoveredPoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : (points.length > 0 ? points[points.length - 1] : null);

  return (
    <div id="telemetry-chart-container" className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-xl transition-colors duration-200">
      {/* Top Header & Time Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {lang === 'km' ? 'Sensor ភ្លាមៗ (Real-Time)' : 'Real-Time Sensor'}
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h3>
          </div>
        </div>

        {/* Time Filter Bar (Live, 1h, 2h, 6h, 12h, 1d, 2d, 1w, 1m, 1y) */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto max-w-full no-scrollbar">
          {timeFilterOptions.map(tf => (
            <button
              key={tf.key}
              id={`filter-btn-${tf.key}`}
              onClick={() => onFilterChange(tf.key)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                currentFilter === tf.key
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/60'
              }`}
            >
              {lang === 'km' ? tf.labelKhmer : tf.label}
            </button>
          ))}
          
          <button
            id="export-csv-btn"
            onClick={exportExcel}
            title={lang === 'km' ? 'ទាញយក Excel' : 'Export Excel'}
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg ml-1 transition"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sensor Legend Toggles */}
      <div className="flex flex-wrap items-center gap-2 pt-3 pb-2">
        {SENSORS.map(s => {
          const isActive = activeSensors[s.key];
          let hoverVal: number | string | undefined = undefined;
          if (hoveredPoint) {
            if (s.key === 'gasCo') hoverVal = hoveredPoint.coLevel ?? hoveredPoint.gasCo ?? 306;
            else if (s.key === 'airQualityMq135') hoverVal = hoveredPoint.airQualityMq135 ?? 185;
            else if (s.key === 'waterLevel') hoverVal = hoveredPoint.waterLevel ?? 28;
            else if (s.key === 'airPressure') hoverVal = hoveredPoint.airPressure ?? 103.5;
            else hoverVal = hoveredPoint[s.key];
          }

          return (
            <button
              key={s.key}
              id={`toggle-sensor-${s.key}`}
              onClick={() => toggleSensor(s.key)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                isActive
                  ? 'bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full transition-transform"
                style={{ backgroundColor: s.color, transform: isActive ? 'scale(1)' : 'scale(0.7)' }}
              />
              <span>{lang === 'km' ? s.labelKhmer : s.label}</span>
              {hoveredPoint && isActive && hoverVal !== undefined && (
                <span className="ml-1 font-mono text-slate-900 dark:text-slate-200 font-extrabold">
                  {hoverVal}
                  {s.unit}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main SVG Telemetry Chart */}
      <div className="relative w-full overflow-hidden mt-1 select-none">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto overflow-visible cursor-crosshair"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const svgX = (mouseX / rect.width) * chartWidth;
            const relativeX = (svgX - padding.left) / usableWidth;
            const idx = Math.round(relativeX * (points.length - 1));
            if (idx >= 0 && idx < points.length) {
              setHoverIndex(idx);
            }
          }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            {SENSORS.map(s => (
              <linearGradient key={`grad-${s.key}`} id={`area-grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.2" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
              </linearGradient>
            ))}
          </defs>

          {/* Grid lines horizontal */}
          {[0, 0.25, 0.5, 0.75, 1].map((norm, i) => {
            const y = padding.top + norm * usableHeight;
            return (
              <g key={`grid-h-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + usableWidth}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  fill="currentColor"
                  className="text-slate-400 dark:text-slate-600 font-mono text-[9px]"
                  textAnchor="end"
                >
                  {Math.round((1 - norm) * 100)}%
                </text>
              </g>
            );
          })}

          {/* Vertical time markers */}
          {points.length > 1 && [0, Math.floor(points.length / 2), points.length - 1].map((idx) => {
            if (!points[idx]) return null;
            const x = padding.left + (idx / (points.length - 1)) * usableWidth;
            return (
              <g key={`grid-v-${idx}`}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + usableHeight}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeDasharray="2 2"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={padding.top + usableHeight + 16}
                  fill="currentColor"
                  className="text-slate-500 dark:text-slate-400 font-mono text-[9px]"
                  textAnchor="middle"
                >
                  {points[idx].timeStr}
                </text>
              </g>
            );
          })}

          {/* Sensor Areas */}
          {SENSORS.map(s => {
            if (!activeSensors[s.key]) return null;
            return (
              <path
                key={`area-${s.key}`}
                d={generateAreaPath(s.key)}
                fill={`url(#area-grad-${s.key})`}
                className="transition-all duration-300"
              />
            );
          })}

          {/* Sensor Line Strokes */}
          {SENSORS.map(s => {
            if (!activeSensors[s.key]) return null;
            return (
              <path
                key={`line-${s.key}`}
                d={generatePath(s.key)}
                fill="none"
                stroke={s.color}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />
            );
          })}

          {/* Hover Crosshair & Dots */}
          {hoverIndex !== null && points[hoverIndex] && (
            <g>
              {/* Vertical line */}
              <line
                x1={padding.left + (hoverIndex / (points.length - 1)) * usableWidth}
                y1={padding.top}
                x2={padding.left + (hoverIndex / (points.length - 1)) * usableWidth}
                y2={padding.top + usableHeight}
                stroke="currentColor"
                className="text-slate-400 dark:text-slate-500"
                strokeWidth="1"
                strokeDasharray="3 3"
              />

              {/* Dots on each active sensor */}
              {SENSORS.map(s => {
                if (!activeSensors[s.key]) return null;
                const rawVal = points[hoverIndex][s.key as keyof TelemetryPoint];
                let val = typeof rawVal === 'number' ? rawVal : 0;
                if (s.key === 'gasCo') val = points[hoverIndex].coLevel ?? points[hoverIndex].gasCo ?? 306;
                else if (s.key === 'airQualityMq135') val = points[hoverIndex].airQualityMq135 ?? 185;
                else if (s.key === 'waterLevel') val = points[hoverIndex].waterLevel ?? 28;
                else if (s.key === 'airPressure') val = points[hoverIndex].airPressure ?? 103.5;
                else if (s.key === 'ambientLight') val = points[hoverIndex].ambientLight ?? 120;

                const normalizedY = (val - s.minDomain) / (s.maxDomain - s.minDomain || 1);
                const clampedNorm = Math.max(0, Math.min(1, normalizedY));
                const cx = padding.left + (hoverIndex / (points.length - 1)) * usableWidth;
                const cy = padding.top + (1 - clampedNorm) * usableHeight;
                return (
                  <circle
                    key={`hover-dot-${s.key}`}
                    cx={cx}
                    cy={cy}
                    r="5"
                    fill={s.color}
                    stroke="currentColor"
                    className="text-white dark:text-slate-900"
                    strokeWidth="2"
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* Floating Tooltip Box */}
        {hoverIndex !== null && points[hoverIndex] && (
          <div
            className="absolute top-2 right-4 bg-white/95 dark:bg-slate-950/95 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 shadow-2xl pointer-events-none text-xs backdrop-blur-md"
            style={{ minWidth: '175px' }}
          >
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1 pb-1 border-b border-slate-200 dark:border-slate-800 flex justify-between">
              <span>Time:</span>
              <span className="text-slate-900 dark:text-white font-bold">{points[hoverIndex].timeStr}</span>
            </div>
            {SENSORS.map(s => {
              if (!activeSensors[s.key]) return null;
              let tipVal: number | string = 0;
              if (s.key === 'gasCo') tipVal = points[hoverIndex].coLevel ?? points[hoverIndex].gasCo ?? 306;
              else if (s.key === 'airQualityMq135') tipVal = points[hoverIndex].airQualityMq135 ?? 185;
              else if (s.key === 'waterLevel') tipVal = points[hoverIndex].waterLevel ?? 28;
              else if (s.key === 'airPressure') tipVal = points[hoverIndex].airPressure ?? 103.5;
              else if (s.key === 'ambientLight') tipVal = points[hoverIndex].ambientLight ?? 120;
              else tipVal = points[hoverIndex][s.key] ?? 0;

              return (
                <div key={`tip-${s.key}`} className="flex items-center justify-between py-0.5">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {lang === 'km' ? s.labelKhmer : s.label}:
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {tipVal} {s.unit}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Summary Bar with Average CO, MQ135 (NH3/CO2), Water Level, Air Pressure */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 mt-3 border-t border-slate-200 dark:border-slate-800/80 text-xs">
        <div className="bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/60">
          <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-semibold">
            {lang === 'km' ? 'មធ្យមភាគ CO (Avg)' : 'Avg CO Gas'}
          </span>
          <span className="text-sm sm:text-base font-bold text-red-600 dark:text-red-400 font-mono">{stats.coAvg} ppm</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1 font-mono">({stats.coMin}-{stats.coMax})</span>
        </div>
        <div className="bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/60">
          <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-semibold">
            {lang === 'km' ? 'ផ្សែង/ឧស្ម័ន MQ135 (CO2/NH3)' : 'Avg MQ135 Gas'}
          </span>
          <span className="text-sm sm:text-base font-bold text-purple-600 dark:text-purple-400 font-mono">{stats.mqAvg} ppm</span>
        </div>
        <div className="bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/60">
          <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-semibold">
            {lang === 'km' ? 'កម្រិតនីវ៉ូទឹក (Avg)' : 'Avg Water Level'}
          </span>
          <span className="text-sm sm:text-base font-bold text-sky-600 dark:text-sky-400 font-mono">{stats.waterAvg}%</span>
        </div>
        <div className="bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/60">
          <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-semibold">
            {lang === 'km' ? 'សម្ពាធបរិយាកាស (Avg)' : 'Avg Air Pressure'}
          </span>
          <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">{stats.pressAvg} kPa</span>
        </div>
      </div>
    </div>
  );
};
