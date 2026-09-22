import React, { useState } from 'react';
import { Power, Volume2, VolumeX } from 'lucide-react';
import { playMechanicalSwitchSound } from '../utils/audioEffects';

interface GoldenRockerSwitchProps {
  id?: string;
  isOn: boolean;
  onToggle: () => void;
  lang?: 'km' | 'en';
  gpioPin?: number;
  virtualPin?: string;
  disabled?: boolean;
}

export const GoldenRockerSwitch: React.FC<GoldenRockerSwitchProps> = ({
  id = 'golden-rocker-switch',
  isOn,
  onToggle,
  lang = 'km',
  gpioPin = 12,
  virtualPin = 'V0',
  disabled = false,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleToggle = () => {
    if (disabled) return;
    if (soundEnabled) {
      playMechanicalSwitchSound(!isOn);
    }
    onToggle();
  };

  return (
    <div
      id={id}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm dark:shadow-2xl flex flex-col items-center justify-between min-h-[340px] select-none transition-all duration-300 hover:border-amber-400/50 relative"
    >
      {/* Sound toggle button at top right */}
      <button
        type="button"
        onClick={() => setSoundEnabled(!soundEnabled)}
        title={soundEnabled ? 'សំឡេងកុងតាក់: បើក (Sound ON)' : 'សំឡេងកុងតាក់: បិទ (Sound Muted)'}
        className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition"
      >
        {soundEnabled ? (
          <Volume2 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
        ) : (
          <VolumeX className="w-3.5 h-3.5 text-slate-400" />
        )}
      </button>

      {/* Top Header Information: Status: ON (Manual Active) */}
      <div className="w-full text-center space-y-1">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 dark:text-slate-500 font-bold mb-1 pr-6">
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
            ESP32-CAM GPIO {gpioPin}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
            Blynk {virtualPin}
          </span>
        </div>

        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {isOn ? (
            <span className="text-slate-900 dark:text-slate-100 flex items-center justify-center gap-1.5">
              <span>Status:</span>
              <span className="text-amber-500 dark:text-amber-400">ON</span>
              <span className="text-slate-600 dark:text-slate-400 font-bold">(Manual Active)</span>
            </span>
          ) : (
            <span className="text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
              <span>Status:</span>
              <span className="text-slate-600 dark:text-slate-400">OFF</span>
              <span className="text-slate-400 dark:text-slate-500 font-medium">(Standby)</span>
            </span>
          )}
        </h3>

        {lang === 'km' && (
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {isOn ? 'ស្ថានភាព: បើក (ដំណើរការដោយដៃ)' : 'ស្ថានភាព: បិទ (រង់ចាំ)'}
          </p>
        )}
      </div>

      {/* Center Tactile Rocker Switch (Picture exact replica - Always Golden/Amber in both ON and OFF) */}
      <div className="my-6 relative flex items-center justify-center">
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          aria-pressed={isOn}
          className={`group relative w-28 sm:w-32 h-48 sm:h-52 rounded-2xl border-[5px] border-slate-950 dark:border-black transition-all duration-300 cursor-pointer focus:outline-none focus:ring-4 focus:ring-amber-500/30 flex flex-col justify-between p-3.5 bg-gradient-to-b from-[#e3a827] via-[#c68918] to-[#9b660c] ${
            isOn
              ? 'shadow-[0_12px_30px_-5px_rgba(200,141,27,0.5),0_6px_12px_rgba(0,0,0,0.35)] brightness-105 scale-[1.02]'
              : 'shadow-[inset_0_3px_8px_rgba(0,0,0,0.4),0_6px_12px_rgba(0,0,0,0.25)] brightness-95 opacity-95'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
        >
          {/* Top-Left Cyan Neon LED Indicator Strip (Glows vibrant cyan when ON, dark subtle indicator when OFF) */}
          <div className="w-full flex justify-start items-center pt-1 pl-1">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                isOn
                  ? 'w-11 bg-[#00f2fe] shadow-[0_0_16px_#00f2fe,0_0_6px_#00f2fe,inset_0_0_2px_#ffffff]'
                  : 'w-11 bg-amber-950/30 border border-amber-900/40 opacity-30 shadow-none'
              }`}
            />
          </div>

          {/* Center Tactile Grip / Horizontal Notch (As seen in the uploaded screenshot) */}
          <div className="w-full flex justify-center items-center">
            <div className="w-10 h-1.5 rounded-full bg-[#7a4e06]/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]" />
          </div>

          {/* Bottom Power Icon Emboss (As seen in the uploaded screenshot) */}
          <div className="w-full flex justify-center pb-1">
            <Power
              className={`w-6 h-6 stroke-[2.5] transition-colors ${
                isOn ? 'text-[#5d3b03]' : 'text-[#6e4604]/80'
              }`}
            />
          </div>
        </button>
      </div>

      {/* Bottom Text: SWITCH ON / SWITCH OFF */}
      <div className="w-full text-center">
        <span
          className={`text-xl sm:text-2xl font-black uppercase tracking-wider transition-colors duration-200 ${
            isOn
              ? 'text-slate-900 dark:text-white'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          {isOn ? 'SWITCH ON' : 'SWITCH OFF'}
        </span>
        {lang === 'km' && (
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
            {isOn ? 'កុងតាក់: បើក' : 'កុងតាក់: បិទ'}
          </p>
        )}
      </div>
    </div>
  );
};
