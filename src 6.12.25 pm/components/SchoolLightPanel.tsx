import React from 'react';
import { IoTDevice, VirtualPinId } from '../types';

interface SchoolLightPanelProps {
  device: IoTDevice;
  onUpdatePin: (pin: VirtualPinId, value: number) => void;
  lang: 'km' | 'en';
}

export const SchoolLightPanel: React.FC<SchoolLightPanelProps> = ({
  device,
  onUpdatePin,
  lang
}) => {
  const v1On = Number(device.pins.V1?.value ?? 0) === 1;
  const v2On = Number(device.pins.V2?.value ?? 0) === 1;
  const v3On = Number(device.pins.V3?.value ?? 0) === 1;

  const togglePin = (pin: VirtualPinId, current: boolean) => {
    onUpdatePin(pin, current ? 0 : 1);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-sm dark:shadow-xl flex flex-col items-center w-full max-w-2xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-black mb-8 text-slate-800 dark:text-white text-center">
        {lang === 'km' ? 'ប្រព័ន្ធគ្រប់គ្រងភ្លើង' : 'Light Control System'}
      </h2>

      {/* Status Row */}
      <div className="flex w-full justify-between items-center mb-6 max-w-[420px] px-2">
        <div className="w-1/3 text-center text-sm md:text-base font-bold text-slate-900 dark:text-white leading-tight">
          {lang === 'km' ? 'សាលា' : 'School'}: {v1On ? 'ON' : 'OFF'}
        </div>
        <div className="w-1/3 text-center text-sm md:text-base font-bold text-slate-900 dark:text-white">
          {lang === 'km' ? 'អគារ' : 'Building'}: {v2On ? 'ON' : 'OFF'}
        </div>
        <div className="w-1/3 text-center text-sm md:text-base font-bold text-slate-900 dark:text-white">
          {lang === 'km' ? 'សួន' : 'Playground'}: {v3On ? 'ON' : 'OFF'}
        </div>
      </div>

      {/* Golden Wall Panel */}
      <div className="bg-gradient-to-b from-[#e3b95a] to-[#c79836] p-4 md:p-5 rounded-2xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_10px_20px_rgba(0,0,0,0.15)] flex flex-col items-center w-full max-w-[360px]">
        
        {/* Switches Outer Frame (Black Outline) */}
        <div className="bg-[#1a1a1a] p-[4px] rounded-xl flex w-full justify-between shadow-inner">
          
          {/* Switch 1 */}
          <div 
            onClick={() => togglePin('V1', v1On)}
            className="flex-1 aspect-[1/1.8] bg-gradient-to-b from-[#dbaf4c] to-[#bb8d2e] border-r border-[#1a1a1a] relative cursor-pointer active:scale-[0.98] transition-transform rounded-l-lg overflow-hidden flex flex-col items-center shadow-[inset_0_2px_5px_rgba(255,255,255,0.2)]"
          >
            <div className={`mt-6 w-10 h-2 rounded-full transition-all duration-300 ${v1On ? 'bg-[#80ffff] shadow-[0_0_8px_#80ffff,0_0_15px_rgba(128,255,255,0.8)]' : 'bg-[#2a2a2a] shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]'}`} />
          </div>

          {/* Switch 2 */}
          <div 
            onClick={() => togglePin('V2', v2On)}
            className="flex-1 aspect-[1/1.8] bg-gradient-to-b from-[#dbaf4c] to-[#bb8d2e] border-r border-[#1a1a1a] relative cursor-pointer active:scale-[0.98] transition-transform overflow-hidden flex flex-col items-center shadow-[inset_0_2px_5px_rgba(255,255,255,0.2)]"
          >
            <div className={`mt-6 w-10 h-2 rounded-full transition-all duration-300 ${v2On ? 'bg-[#80ffff] shadow-[0_0_8px_#80ffff,0_0_15px_rgba(128,255,255,0.8)]' : 'bg-[#2a2a2a] shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]'}`} />
          </div>

          {/* Switch 3 */}
          <div 
            onClick={() => togglePin('V3', v3On)}
            className="flex-1 aspect-[1/1.8] bg-gradient-to-b from-[#dbaf4c] to-[#bb8d2e] relative cursor-pointer active:scale-[0.98] transition-transform rounded-r-lg overflow-hidden flex flex-col items-center shadow-[inset_0_2px_5px_rgba(255,255,255,0.2)]"
          >
            <div className={`mt-6 w-10 h-2 rounded-full transition-all duration-300 ${v3On ? 'bg-[#80ffff] shadow-[0_0_8px_#80ffff,0_0_15px_rgba(128,255,255,0.8)]' : 'bg-[#2a2a2a] shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]'}`} />
          </div>

        </div>

        {/* Brand */}
        <div className="mt-5 mb-1 text-[13px] md:text-sm font-black italic text-[#634912] tracking-[4px] opacity-80 drop-shadow-sm">
          SGT
        </div>
      </div>

      {/* Labels Row */}
      <div className="flex w-full justify-between items-start mt-8 max-w-[420px] px-2">
        <div className="w-1/3 text-center text-[12px] md:text-sm font-bold text-slate-700 dark:text-slate-300 px-1 leading-relaxed">
          {lang === 'km' ? 'ភ្លើងសាលាសុវណ្ណភូមិផ្សារដីហុយ' : 'Light School Phsar Dey Hoy'}
        </div>
        <div className="w-1/3 text-center text-[12px] md:text-sm font-bold text-slate-700 dark:text-slate-300 px-1 leading-relaxed">
          {lang === 'km' ? 'ភ្លើងអគារ' : 'Building Light'}
        </div>
        <div className="w-1/3 text-center text-[12px] md:text-sm font-bold text-slate-700 dark:text-slate-300 px-1 leading-relaxed">
          {lang === 'km' ? 'ភ្លើង Playground' : 'Playground Light'}
        </div>
      </div>
    </div>
  );
};
