import React, { useState } from 'react';
import { IoTDevice } from '../types';
import {
  Copy,
  Check,
  Eye,
  EyeOff,
  Wifi,
  Radio,
  Cpu,
  Zap,
  Play,
  Pause,
  QrCode,
  BookOpen,
  Volume2,
  VolumeX,
  Languages,
  Layers,
  Sun,
  Moon,
  Menu
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TopNavProps {
  onToggleSidebar: () => void;
  devices: IoTDevice[];
  activeDevice: IoTDevice | null;
  onSelectDevice: (dev: IoTDevice) => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  lang: 'km' | 'en';
  onToggleLang: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenQr: () => void;
  onOpenApiDocs: () => void;
  onOpenSimulator: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onToggleSidebar,
  devices,
  activeDevice,
  onSelectDevice,
  isSimulating,
  onToggleSimulation,
  lang,
  onToggleLang,
  theme,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
  onOpenQr,
  onOpenApiDocs,
  onOpenSimulator,
}) => {
  const [copiedToken, setCopiedToken] = useState(false);
  const [showTokenSecret, setShowTokenSecret] = useState(false);

  const copyAuthToken = () => {
    if (!activeDevice) return;
    navigator.clipboard.writeText(activeDevice.authToken);
    setCopiedToken(true);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.1, x: 0.5 } });
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const maskedToken = activeDevice
    ? showTokenSecret
      ? activeDevice.authToken
      : `${activeDevice.authToken.substring(0, 8)}••••••••••••${activeDevice.authToken.slice(-4)}`
    : 'No Device';

  return (
    <header id="top-navigation-bar" className="bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 backdrop-blur-md transition-colors duration-200">
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Hamburger & Device Selector & Online Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {/* Device dropdown */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
            <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <select
              id="device-selector-dropdown"
              value={activeDevice?.id || ''}
              onChange={(e) => {
                const found = devices.find(d => d.id === e.target.value);
                if (found) onSelectDevice(found);
              }}
              aria-label={lang === 'km' ? 'ជ្រើសរើសឧបករណ៍' : 'Select IoT Device'}
              className="bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer pr-2"
            >
              {devices.map(d => (
                <option key={d.id} value={d.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {lang === 'km' ? d.nameKhmer || d.name : d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Active status */}
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{lang === 'km' ? 'Online' : 'Active'}</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-300/70 border-l border-emerald-300 dark:border-emerald-500/30 pl-1.5 font-mono">24ms</span>
          </div>

          {/* Wi-Fi RSSI Signal */}
          {activeDevice && (
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/60 font-mono">
              <Wifi className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>{activeDevice.rssi} dBm</span>
            </div>
          )}
        </div>

        {/* Center: Auth Token Box with Copy */}
        {activeDevice && (
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1 text-xs">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Token:
            </span>
            <code className="font-mono text-emerald-700 dark:text-emerald-400 text-xs select-all px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
              {maskedToken}
            </code>
            <button
              id="toggle-show-token-btn"
              onClick={() => setShowTokenSecret(!showTokenSecret)}
              className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition"
              title={showTokenSecret ? 'Hide Token' : 'Show Token'}
            >
              {showTokenSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              id="copy-auth-token-btn"
              onClick={copyAuthToken}
              className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 rounded-md transition font-semibold text-xs"
              title="Copy Blynk Auth Token for ESP32"
            >
              {copiedToken ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-300" /> : <Copy className="w-3 h-3" />}
              <span>{copiedToken ? (lang === 'km' ? 'បានចម្លង!' : 'Copied!') : (lang === 'km' ? 'ចម្លង' : 'Copy')}</span>
            </button>
            <button
              id="open-qr-token-btn"
              onClick={onOpenQr}
              className="p-1 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition ml-0.5"
              title="QR Code for Mobile Provisioning"
            >
              <QrCode className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Right Action Tools: Theme Switcher, Simulator Toggle, Sound, Language, API Docs */}
        <div className="flex items-center gap-2">
          {/* Light / Dark Mode Switcher */}
          <button
            id="theme-toggle-btn"
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 shadow-sm cursor-pointer"
            title={theme === 'dark' ? 'ប្តូរទៅជា Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            )}
          </button>

          {/* REST API docs button */}
          <button
            id="open-api-docs-btn"
            onClick={onOpenApiDocs}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition"
            title={lang === 'km' ? 'កម្រងឯកសារ API' : 'REST & Blynk API Docs'}
          >
            <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </button>

          {/* Sound toggle */}
          <button
            id="toggle-sound-btn"
            onClick={onToggleSound}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition"
            title={soundEnabled ? 'Relay Click Sound ON' : 'Sound Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-slate-700 dark:text-slate-300" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Language Toggle (Khmer / English) */}
          <button
            id="language-toggle-btn"
            onClick={onToggleLang}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold transition"
            title="Switch Language (ភាសាខ្មែរ / English)"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{lang === 'km' ? '🇰🇭 ខ្មែរ' : '🇬🇧 EN'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
