import React from 'react';
import { TelemetryPoint, TimeFilter } from '../types';
import { TelemetryChart } from './TelemetryChart';
import {
  TrendingUp,
  Activity,
  Calendar,
  Download,
  Flame,
  Droplets,
  Wind,
  Sprout,
  BarChart3,
  FileSpreadsheet
} from 'lucide-react';

interface AnalyticsViewProps {
  telemetryData: TelemetryPoint[];
  timeFilter: TimeFilter;
  onTimeFilterChange: (filter: TimeFilter) => void;
  lang: 'km' | 'en';
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  telemetryData,
  timeFilter,
  onTimeFilterChange,
  lang,
}) => {
  // Compute analytics
  const temps = telemetryData.map(p => p.temperature);
  const hums = telemetryData.map(p => p.humidity);
  const gases = telemetryData.map(p => p.gasCo);
  const soils = telemetryData.map(p => p.soilMoisture);

  const avgTemp = temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : '0';
  const minTemp = temps.length ? Math.min(...temps).toFixed(1) : '0';
  const maxTemp = temps.length ? Math.max(...temps).toFixed(1) : '0';

  const avgHum = hums.length ? (hums.reduce((a, b) => a + b, 0) / hums.length).toFixed(1) : '0';
  const minHum = hums.length ? Math.min(...hums).toFixed(1) : '0';
  const maxHum = hums.length ? Math.max(...hums).toFixed(1) : '0';

  const avgGas = gases.length ? Math.round(gases.reduce((a, b) => a + b, 0) / gases.length) : 0;
  const maxGas = gases.length ? Math.max(...gases) : 0;

  const avgSoil = soils.length ? (soils.reduce((a, b) => a + b, 0) / soils.length).toFixed(1) : '0';

  return (
    <div id="analytics-view-container" className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-xs font-bold font-mono border border-cyan-500/30">
                HISTORICAL DATA ENGINE
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {lang === 'km' ? 'វិភាគទិន្នន័យ & ក្រាបស្ថិតិ Sensor (Analytics & Trends)' : 'Sensor Analytics & Telemetry Trends'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'km'
                ? 'តាមដានបម្រែបម្រួលកម្ដៅ សំណើម ឧស្ម័ន និងសំណើមដី តាមចន្លោះពេល Live, 1h, 6h, 1d, 1w, 1mo'
                : 'Inspect aggregated sensor metrics, statistical variance, correlation indexes, and historical extremes.'}
            </p>
          </div>
        </div>
      </div>

      {/* 4 Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Temp Variance */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4" /> {lang === 'km' ? 'សីតុណ្ហភាព (°C)' : 'Temperature Stat'}
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded">PIN V0</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">{avgTemp}°C</div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800">
            <span>Min: <strong className="text-slate-200">{minTemp}°C</strong></span>
            <span>Max: <strong className="text-orange-400">{maxTemp}°C</strong></span>
          </div>
        </div>

        {/* Card 2: Hum Variance */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Droplets className="w-4 h-4" /> {lang === 'km' ? 'សំណើមខ្យល់ (%)' : 'Humidity Stat'}
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded">PIN V1</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">{avgHum}%</div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800">
            <span>Min: <strong className="text-slate-200">{minHum}%</strong></span>
            <span>Max: <strong className="text-cyan-400">{maxHum}%</strong></span>
          </div>
        </div>

        {/* Card 3: Gas Peak */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wind className="w-4 h-4" /> {lang === 'km' ? 'កម្រិតឧស្ម័ន (PPM)' : 'Air Quality Peak'}
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded">PIN V5</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">{avgGas} <span className="text-xs text-slate-400 font-sans">ppm avg</span></div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800">
            <span>Peak Level:</span>
            <strong className="text-purple-400">{maxGas} ppm</strong>
          </div>
        </div>

        {/* Card 4: Soil Average */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sprout className="w-4 h-4" /> {lang === 'km' ? 'សំណើមដីកសិកម្ម' : 'Soil Moisture'}
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded">PIN V7</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">{avgSoil}%</div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800">
            <span>Status:</span>
            <strong className="text-emerald-400">Optimum Health</strong>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <TelemetryChart
        data={telemetryData}
        currentFilter={timeFilter}
        onFilterChange={onTimeFilterChange}
        lang={lang}
      />
    </div>
  );
};
