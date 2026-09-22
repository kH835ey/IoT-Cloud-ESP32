import React from 'react';
import { IoTDevice } from '../types';
import {
  QrCode,
  X,
  Copy,
  Check,
  Smartphone,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QrCodeModalProps {
  device: IoTDevice | null;
  isOpen: boolean;
  onClose: () => void;
  lang: 'km' | 'en';
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  device,
  isOpen,
  onClose,
  lang,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !device) return null;

  const copyToken = () => {
    navigator.clipboard.writeText(device.authToken);
    setCopied(true);
    confetti({ particleCount: 20, spread: 40 });
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate SVG QR Matrix
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    JSON.stringify({
      token: device.authToken,
      server: typeof window !== 'undefined' ? window.location.origin : '',
      device: device.id,
      tmpl: device.templateId,
    })
  )}&color=10b981&bgcolor=020617`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 text-left">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Mobile Device Pairing</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Display */}
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 inline-block shadow-inner">
          <img
            src={qrSvgUrl}
            alt="Device Auth QR Code"
            className="w-48 h-48 rounded-xl object-contain mx-auto"
            referrerPolicy="no-referrer"
          />
        </div>

        <div>
          <h4 className="text-xs font-bold text-white">{device.name}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{device.templateId}</p>
        </div>

        {/* Token Box */}
        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center justify-between gap-1">
            <code className="text-[11px] font-mono text-emerald-400 truncate select-all">
              {device.authToken}
            </code>
            <button
              onClick={copyToken}
              className="p-1 text-slate-400 hover:text-emerald-400"
              title="Copy"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          Scan with Blynk IoT mobile app or HTTP provisioning tool to connect immediately.
        </p>
      </div>
    </div>
  );
};
