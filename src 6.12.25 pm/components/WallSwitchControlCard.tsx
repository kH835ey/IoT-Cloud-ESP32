import React, { useState } from 'react';
import { playMechanicalSwitchSound } from '../utils/audioEffects';

interface WallSwitchControlCardProps {
  id?: string;
  sw1State: boolean;
  sw2State: boolean;
  onToggleSw1: () => void;
  onToggleSw2: () => void;
  title?: string;
  sw1Label?: string;
  sw2Label?: string;
  dashboardIp?: string;
  brandText?: string;
}

export const WallSwitchControlCard: React.FC<WallSwitchControlCardProps> = ({
  id = 'wall-switch-control-card',
  sw1State,
  sw2State,
  onToggleSw1,
  onToggleSw2,
  title = 'Wall Switch Control',
  sw1Label = 'SWITCH 1',
  sw2Label = 'SWITCH 2',
  dashboardIp = '192.168.4.1',
  brandText = 'S G T',
}) => {
  const [activePress, setActivePress] = useState<number | null>(null);

  const handlePress1 = () => {
    setActivePress(1);
    playMechanicalSwitchSound(!sw1State);
    onToggleSw1();
    setTimeout(() => setActivePress(null), 250);
  };

  const handlePress2 = () => {
    setActivePress(2);
    playMechanicalSwitchSound(!sw2State);
    onToggleSw2();
    setTimeout(() => setActivePress(null), 250);
  };

  return (
    <div
      id={id}
      className="w-full max-w-[380px] mx-auto bg-white rounded-[28px] p-6 sm:p-7 shadow-[0_15px_35px_rgba(0,0,0,0.12),0_5px_15px_rgba(0,0,0,0.06)] border border-slate-100 flex flex-col items-center select-none transition-all duration-300"
    >
      {/* 1. Header Title */}
      <h2 className="text-[26px] sm:text-[28px] font-black text-[#1e2329] tracking-tight mb-4 text-center">
        {title}
      </h2>

      {/* 2. Status Indicators Row (Directly above each switch) */}
      <div className="w-full max-w-[310px] flex justify-around items-center mb-3.5 px-2">
        <div className="w-[120px] text-center">
          <span className="text-[17px] font-extrabold text-[#1e2329] tracking-tight">
            Status: <span className={sw1State ? 'text-emerald-600' : 'text-[#1e2329]'}>{sw1State ? 'ON' : 'OFF'}</span>
          </span>
        </div>
        <div className="w-[120px] text-center">
          <span className="text-[17px] font-extrabold text-[#1e2329] tracking-tight">
            Status: <span className={sw2State ? 'text-emerald-600' : 'text-[#1e2329]'}>{sw2State ? 'ON' : 'OFF'}</span>
          </span>
        </div>
      </div>

      {/* 3. Golden Wall Plate Frame */}
      <div className="w-full max-w-[310px] bg-gradient-to-b from-[#e3b24f] via-[#c99533] to-[#b37f22] p-4 sm:p-5 rounded-[22px] shadow-[0_10px_22px_rgba(163,115,31,0.35),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.25)] flex flex-col items-center border border-[#d6a43d]">
        {/* Dark Rocker Outer Bezel Frame */}
        <div className="w-full flex bg-[#1a1a1a] p-[3.5px] rounded-[14px] shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(0,0,0,0.8)] border-2 border-[#121212] gap-[3.5px] overflow-hidden">
          
          {/* SWITCH 1 ROCKER */}
          <button
            type="button"
            onClick={handlePress1}
            aria-label="Toggle Switch 1"
            className={`flex-1 h-[210px] sm:h-[220px] rounded-[8px] bg-gradient-to-b transition-all duration-150 relative cursor-pointer flex flex-col items-center pt-5 focus:outline-none ${
              sw1State
                ? 'from-[#b08020] via-[#c4922b] to-[#d8a83e] shadow-[inset_0_4px_8px_rgba(0,0,0,0.4)]'
                : 'from-[#d8a83e] via-[#c4922b] to-[#a37218] shadow-[0_4px_8px_rgba(0,0,0,0.35)]'
            } ${activePress === 1 ? 'scale-[0.98] brightness-95' : 'hover:brightness-105'}`}
          >
            {/* Top Indicator Pill Bar */}
            <div
              className={`w-[52px] h-[9px] rounded-full transition-all duration-300 ${
                sw1State
                  ? 'bg-[#80ffff] shadow-[0_0_12px_#80ffff,0_0_22px_rgba(128,255,255,0.9),inset_0_0_2px_#ffffff]'
                  : 'bg-[#2a2a2a] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]'
              }`}
            />
          </button>

          {/* SWITCH 2 ROCKER */}
          <button
            type="button"
            onClick={handlePress2}
            aria-label="Toggle Switch 2"
            className={`flex-1 h-[210px] sm:h-[220px] rounded-[8px] bg-gradient-to-b transition-all duration-150 relative cursor-pointer flex flex-col items-center pt-5 focus:outline-none ${
              sw2State
                ? 'from-[#b08020] via-[#c4922b] to-[#d8a83e] shadow-[inset_0_4px_8px_rgba(0,0,0,0.4)]'
                : 'from-[#d8a83e] via-[#c4922b] to-[#a37218] shadow-[0_4px_8px_rgba(0,0,0,0.35)]'
            } ${activePress === 2 ? 'scale-[0.98] brightness-95' : 'hover:brightness-105'}`}
          >
            {/* Top Indicator Pill Bar */}
            <div
              className={`w-[52px] h-[9px] rounded-full transition-all duration-300 ${
                sw2State
                  ? 'bg-[#80ffff] shadow-[0_0_12px_#80ffff,0_0_22px_rgba(128,255,255,0.9),inset_0_0_2px_#ffffff]'
                  : 'bg-[#2a2a2a] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]'
              }`}
            />
          </button>
        </div>

        {/* Brand SGT (Centered below rocker frame in gold plate) */}
        <div className="mt-2.5 text-center">
          <span className="text-[15px] font-black italic tracking-[0.25em] text-[#4d3206] drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]">
            {brandText}
          </span>
        </div>
      </div>

      {/* 4. Bottom Labels (SWITCH 1 / SWITCH 2) */}
      <div className="w-full max-w-[310px] flex justify-around items-center mt-4 px-2">
        <div className="w-[120px] text-center">
          <span className="text-[17px] font-black text-[#1e2329] tracking-wider uppercase">
            {sw1Label}
          </span>
        </div>
        <div className="w-[120px] text-center">
          <span className="text-[17px] font-black text-[#1e2329] tracking-wider uppercase">
            {sw2Label}
          </span>
        </div>
      </div>
    </div>
  );
};
