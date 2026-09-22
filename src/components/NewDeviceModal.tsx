import React, { useState } from 'react';
import { IoTDevice } from '../types';
import {
  Cpu,
  X,
  Plus,
  Layers,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface NewDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDevice: (data: { name: string; nameKhmer: string; templateId: string; orgId: string }) => void;
  lang: 'km' | 'en';
}

export const NewDeviceModal: React.FC<NewDeviceModalProps> = ({
  isOpen,
  onClose,
  onCreateDevice,
  lang,
}) => {
  const [name, setName] = useState('');
  const [nameKhmer, setNameKhmer] = useState('');
  const [templateId, setTemplateId] = useState('TMPL_SMART_FARM');
  const [orgId, setOrgId] = useState('ORG-KHMER-IOT-01');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateDevice({
      name: name || 'ESP32 Smart Node',
      nameKhmer: nameKhmer || 'ESP32 ឧបករណ៍ថ្មី',
      templateId,
      orgId,
    });
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.3 } });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              {lang === 'km' ? 'ចុះឈ្មោះឧបករណ៍ ESP32 ថ្មី' : 'Register New ESP32 Node'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Device Name (English):</label>
            <input
              type="text"
              required
              placeholder="e.g. ESP32 Greenhouse Zone B"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Device Name (Khmer):</label>
            <input
              type="text"
              placeholder="ឧទាហរណ៍៖ ESP32 ផ្ទះកញ្ចក់ តំបន់ ខ"
              value={nameKhmer}
              onChange={e => setNameKhmer(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Blynk Template:</label>
            <select
              value={templateId}
              onChange={e => setTemplateId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value="TMPL_SMART_FARM">TMPL_SMART_FARM (DHT22 + Relays + Soil)</option>
              <option value="TMPL_GREENHOUSE_V2">TMPL_GREENHOUSE_V2 (Full Greenhouse)</option>
              <option value="TMPL_FACTORY_MONITOR">TMPL_FACTORY_MONITOR (Gas + High Temp)</option>
              <option value="TMPL_HOME_RELAY">TMPL_HOME_RELAY (Multi-channel Relays)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Organization ID:</label>
            <input
              type="text"
              value={orgId}
              onChange={e => setOrgId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20"
            >
              Register & Generate Token
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
