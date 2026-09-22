import React, { useState } from 'react';
import { IoTDevice } from '../types';
import {
  BookOpen,
  X,
  Copy,
  Check,
  Send,
  Terminal,
  Code2,
  CheckCircle2
} from 'lucide-react';

interface ApiDocsModalProps {
  device: IoTDevice | null;
  isOpen: boolean;
  onClose: () => void;
  lang: 'km' | 'en';
}

export const ApiDocsModal: React.FC<ApiDocsModalProps> = ({
  device,
  isOpen,
  onClose,
  lang,
}) => {
  const [testPin, setTestPin] = useState('V0');
  const [testValue, setTestValue] = useState('29.8');
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen || !device) return null;

  const serverBase = typeof window !== 'undefined' ? window.location.origin : 'https://your-app.run.app';
  const sampleUpdateUrl = `${serverBase}/api/iot/update?token=${device.authToken}&${testPin.toLowerCase()}=${testValue}`;

  const handleTestApi = async () => {
    setLoading(true);
    setApiResponse(null);
    try {
      const res = await fetch(sampleUpdateUrl);
      const json = await res.json();
      setApiResponse(JSON.stringify(json, null, 2));
    } catch (err: any) {
      setApiResponse(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(sampleUpdateUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {lang === 'km' ? 'កម្រងឯកសារ REST API & Blynk Endpoints' : 'IoT Cloud REST API & Blynk Endpoints'}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'km' ? 'បញ្ជី Endpoint សម្រាប់ ESP32, ESP8266, ឬ Node-RED ផ្ញើទិន្នន័យមក Cloud' : 'Standard HTTP REST endpoints for ESP32/microcontroller communication'}
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

        {/* Live Interactive Endpoint Tester */}
        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-black text-[10px]">
                GET / POST
              </span>
              <span>/api/iot/update</span>
            </span>

            <button
              onClick={copyUrl}
              className="text-slate-400 hover:text-emerald-400 transition flex items-center gap-1"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400 block mb-1">Select Virtual Pin:</label>
              <select
                value={testPin}
                onChange={e => setTestPin(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono"
              >
                <option value="V0">V0 (Temp)</option>
                <option value="V1">V1 (Humidity)</option>
                <option value="V2">V2 (Relay 1)</option>
                <option value="V3">V3 (Relay 2)</option>
                <option value="V4">V4 (Fan Speed)</option>
                <option value="V5">V5 (Gas)</option>
                <option value="V6">V6 (Alarm LED)</option>
                <option value="V7">V7 (Soil)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Value to Send:</label>
              <input
                type="text"
                value={testValue}
                onChange={e => setTestValue(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={sampleUpdateUrl}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-cyan-300 font-mono text-[11px] select-all"
            />
            <button
              onClick={handleTestApi}
              disabled={loading}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg flex items-center gap-1.5 transition shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Sending...' : 'Test Send'}</span>
            </button>
          </div>

          {apiResponse && (
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400">
              <span className="text-slate-400 block mb-1 text-[10px]">Server Response (200 OK):</span>
              <pre className="overflow-x-auto">{apiResponse}</pre>
            </div>
          )}
        </div>

        {/* Documentation Table */}
        <div className="space-y-2 text-xs">
          <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">
            All Supported Endpoint Specs:
          </h4>

          <div className="space-y-2 text-slate-300 font-mono text-[11px]">
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-emerald-400 font-bold mb-0.5">GET /api/iot/get?token=AUTH&pin=V2</div>
              <p className="text-slate-400 font-sans text-xs">
                Microcontroller reads individual actuator pin. Returns plain text <code>1</code> or <code>0</code>.
              </p>
            </div>

            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-emerald-400 font-bold mb-0.5">GET /api/iot/all?token=AUTH</div>
              <p className="text-slate-400 font-sans text-xs">
                Reads all pin states in one JSON response <code>{`{ "V2": 1, "V3": 0, "V4": 80 }`}</code>.
              </p>
            </div>

            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-emerald-400 font-bold mb-0.5">GET /api/iot/events</div>
              <p className="text-slate-400 font-sans text-xs">
                Server-Sent Events (SSE) real-time streaming endpoint for web browsers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
