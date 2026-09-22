import React from 'react';
import { IoTDevice, VirtualPinId } from '../types';
import {
  Sliders,
  X,
  Play,
  Pause,
  Flame,
  Wind,
  Droplets,
  Sprout,
  Cpu,
  Power,
  Zap,
  Activity,
  Radio
} from 'lucide-react';

interface SimulatorModalProps {
  device: IoTDevice | null;
  isOpen: boolean;
  onClose: () => void;
  isSimulating: boolean;
  onToggleSimulating: () => void;
  onUpdatePin: (pin: VirtualPinId, value: number | string) => void;
  lang: 'km' | 'en';
}

export const SimulatorModal: React.FC<SimulatorModalProps> = ({
  device,
  isOpen,
  onClose,
  isSimulating,
  onToggleSimulating,
  onUpdatePin,
  lang,
}) => {
  if (!isOpen || !device) return null;

  const tempVal = Number(device.pins.V0?.value || 28);
  const humVal = Number(device.pins.V1?.value || 65);
  const gasVal = Number(device.pins.V5?.value || 320);
  const soilVal = Number(device.pins.V7?.value || 50);
  const pumpState = Number(device.pins.V2?.value) === 1;
  const lampState = Number(device.pins.V3?.value) === 1;
  const fanVal = Number(device.pins.V4?.value || 75);
  const alarmState = Number(device.pins.V6?.value) === 1;

  // Environmental presets
  const triggerPreset = (type: 'heatwave' | 'smoke' | 'rain' | 'dry') => {
    switch (type) {
      case 'heatwave':
        onUpdatePin('V0', 36.5);
        onUpdatePin('V1', 42.0);
        break;
      case 'smoke':
        onUpdatePin('V5', 680);
        break;
      case 'rain':
        onUpdatePin('V1', 88.0);
        onUpdatePin('V7', 85.0);
        break;
      case 'dry':
        onUpdatePin('V7', 28.0);
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {lang === 'km' ? 'បន្ទប់ពិសោធន៍ ESP32 (Hardware Virtual Bench)' : 'ESP32 Virtual Hardware Simulator'}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  REAL-TIME PHY
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'km'
                  ? 'សាកល្បងផ្លាស់ប្តូរតម្លៃ Sensor ឬបង្កើតព្រឹត្តិការណ៍សិប្បនិម្មិតដើម្បីមើល Dashboard ដំណើរការ'
                  : 'Inject live physical environmental events or manually tweak GPIO sensor lines.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Simulator Master Switch */}
        <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
          <div>
            <span className="text-xs font-bold text-white block">
              {lang === 'km' ? 'ម៉ាស៊ីន Simulation ស្វ័យប្រវត្ត:' : 'Automatic Background Physics Engine:'}
            </span>
            <span className="text-[11px] text-slate-400">
              {isSimulating
                ? (lang === 'km' ? 'កំពុងបង្កើតទិន្នន័យ Sensor ធម្មជាតិរៀងរាល់ ១វិនាទី' : 'Simulating natural sensor fluctuations every 1000ms')
                : (lang === 'km' ? 'បានផ្អាក — អ្នកអាចរំកិលដៃដោយផ្ទាល់' : 'Paused — manual slider control enabled')}
            </span>
          </div>

          <button
            onClick={onToggleSimulating}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              isSimulating
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
            }`}
          >
            {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isSimulating ? 'Pause Engine' : 'Resume Engine'}</span>
          </button>
        </div>

        {/* Quick Physical Disturbance Injections */}
        <div>
          <span className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wider">
            {lang === 'km' ? '⚡ ចុចបង្កើតព្រឹត្តិការណ៍បន្ទាន់ (Simulate Scenarios):' : '⚡ Simulate Environmental Disturbance:'}
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              onClick={() => triggerPreset('heatwave')}
              className="p-2.5 bg-slate-950 hover:bg-orange-950/60 border border-slate-800 hover:border-orange-500/50 rounded-xl text-left transition"
            >
              <Flame className="w-4 h-4 text-orange-400 mb-1" />
              <strong className="text-white block">Heat Wave</strong>
              <span className="text-[10px] text-slate-400">Temp &gt; 36°C</span>
            </button>

            <button
              onClick={() => triggerPreset('smoke')}
              className="p-2.5 bg-slate-950 hover:bg-purple-950/60 border border-slate-800 hover:border-purple-500/50 rounded-xl text-left transition"
            >
              <Wind className="w-4 h-4 text-purple-400 mb-1" />
              <strong className="text-white block">Gas / Smoke Leak</strong>
              <span className="text-[10px] text-slate-400">Gas &gt; 680 ppm</span>
            </button>

            <button
              onClick={() => triggerPreset('dry')}
              className="p-2.5 bg-slate-950 hover:bg-amber-950/60 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition"
            >
              <Sprout className="w-4 h-4 text-amber-400 mb-1" />
              <strong className="text-white block">Dry Soil Drought</strong>
              <span className="text-[10px] text-slate-400">Moisture &lt; 28%</span>
            </button>

            <button
              onClick={() => triggerPreset('rain')}
              className="p-2.5 bg-slate-950 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-left transition"
            >
              <Droplets className="w-4 h-4 text-cyan-400 mb-1" />
              <strong className="text-white block">Heavy Rainfall</strong>
              <span className="text-[10px] text-slate-400">Hum &gt; 88%</span>
            </button>
          </div>
        </div>

        {/* Manual Sensor Injection Sliders */}
        <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
          <span className="font-bold text-slate-300 block uppercase tracking-wider">
            {lang === 'km' ? 'កែសម្រួលតម្លៃ Sensor ដោយដៃ (Manual Sliders):' : 'Manual Virtual Sensor Overrides:'}
          </span>

          {/* Temperature Slider */}
          <div>
            <div className="flex justify-between text-slate-300 font-mono mb-1">
              <span>V0 Temperature:</span>
              <strong className="text-orange-400">{tempVal}°C</strong>
            </div>
            <input
              type="range"
              min="15"
              max="50"
              step="0.5"
              value={tempVal}
              onChange={e => onUpdatePin('V0', Number(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>

          {/* Humidity Slider */}
          <div>
            <div className="flex justify-between text-slate-300 font-mono mb-1">
              <span>V1 Humidity:</span>
              <strong className="text-cyan-400">{humVal}%</strong>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={humVal}
              onChange={e => onUpdatePin('V1', Number(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Gas Slider */}
          <div>
            <div className="flex justify-between text-slate-300 font-mono mb-1">
              <span>V5 Gas & Smoke:</span>
              <strong className="text-purple-400">{gasVal} ppm</strong>
            </div>
            <input
              type="range"
              min="100"
              max="900"
              value={gasVal}
              onChange={e => onUpdatePin('V5', Number(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* Soil Slider */}
          <div>
            <div className="flex justify-between text-slate-300 font-mono mb-1">
              <span>V7 Soil Moisture:</span>
              <strong className="text-emerald-400">{soilVal}%</strong>
            </div>
            <input
              type="range"
              min="10"
              max="95"
              value={soilVal}
              onChange={e => onUpdatePin('V7', Number(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>

        {/* Live Actuator Mirror */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Current Actuator States:</span>
          <div className="flex items-center gap-3 font-mono">
            <span className={pumpState ? 'text-emerald-400 font-bold' : 'text-slate-600'}>Pump: {pumpState ? 'ON' : 'OFF'}</span>
            <span className={lampState ? 'text-amber-400 font-bold' : 'text-slate-600'}>Lamp: {lampState ? 'ON' : 'OFF'}</span>
            <span className="text-blue-400 font-bold">Fan: {fanVal}%</span>
            <span className={alarmState ? 'text-red-400 font-bold animate-pulse' : 'text-slate-600'}>Alarm: {alarmState ? 'ON' : 'OFF'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
