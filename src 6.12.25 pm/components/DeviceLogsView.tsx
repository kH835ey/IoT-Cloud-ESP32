import React, { useState, useRef, useEffect } from 'react';
import { DeviceLog } from '../types';
import {
  Terminal,
  Trash2,
  Download,
  Search,
  Filter,
  ArrowDown,
  Clock,
  Sparkles,
  Layers,
  Cpu
} from 'lucide-react';

interface DeviceLogsViewProps {
  logs: DeviceLog[];
  onClearLogs: () => void;
  lang: 'km' | 'en';
}

export const DeviceLogsView: React.FC<DeviceLogsViewProps> = ({
  logs,
  onClearLogs,
  lang,
}) => {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(l => {
    if (filterLevel !== 'ALL' && l.level !== filterLevel) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        l.message.toLowerCase().includes(q) ||
        (l.messageKhmer && l.messageKhmer.toLowerCase().includes(q)) ||
        l.source.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportLogs = () => {
    const text = logs
      .map(l => `[${l.timestamp}] [${l.level}] [${l.source}] ${l.message}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `esp32_iot_logs_${Date.now()}.log`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getLevelBadge = (level: DeviceLog['level']) => {
    switch (level) {
      case 'SUCCESS':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'DATA':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'WARN':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'ERROR':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'INFO':
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div id="device-logs-view" className="space-y-4">
      {/* Top Header & Filter Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                {lang === 'km' ? 'កំណត់ត្រា & Serial Terminal (Device Logs)' : 'Live IoT Serial & Network Logs'}
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {logs.length} EVENTS
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                {lang === 'km' ? 'តាមដានការតភ្ជាប់ Wi-Fi, ការបញ្ជូនទិន្នន័យ Sensor និងការបញ្ជា Relay' : 'Real-time serial stream & REST API telemetry packet captures'}
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder={lang === 'km' ? 'ស្វែងរកកំណត់ត្រា...' : 'Search logs...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-44"
              />
            </div>

            {/* Level Filter */}
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none"
            >
              <option value="ALL">All Levels</option>
              <option value="DATA">DATA</option>
              <option value="INFO">INFO</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
            </select>

            {/* Auto-scroll toggle */}
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1 ${
                autoScroll
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Auto-scroll terminal"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>Scroll</span>
            </button>

            {/* Export */}
            <button
              onClick={exportLogs}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
              title="Export Log File"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Clear */}
            <button
              onClick={onClearLogs}
              className="p-1.5 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-lg border border-slate-700 transition"
              title="Clear Terminal Logs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Terminal Display */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-2xl font-mono text-xs overflow-hidden">
        {/* Terminal Title Bar */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-900 text-slate-500 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            <span className="ml-2 text-slate-400 font-sans font-semibold">ESP32 Console Stream (115200 Baud)</span>
          </div>
          <span>Showing {filteredLogs.length} events</span>
        </div>

        <div className="h-[460px] overflow-y-auto space-y-1.5 pr-2 select-text scrollbar-thin scrollbar-thumb-slate-800">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-20 text-slate-600 font-sans">
              <Terminal className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No log events matching filters...</p>
            </div>
          ) : (
            filteredLogs.map(log => (
              <div
                key={log.id}
                className="flex items-start gap-2.5 py-1 px-2 rounded hover:bg-slate-900/60 transition leading-relaxed"
              >
                <span className="text-slate-500 shrink-0 text-[11px]">{log.timestamp}</span>

                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase shrink-0 ${getLevelBadge(
                    log.level
                  )}`}
                >
                  {log.level}
                </span>

                <span className="text-slate-400 shrink-0 text-[11px]">[{log.source}]</span>

                <div className="flex-1 text-slate-200">
                  <span>{log.message}</span>
                  {log.messageKhmer && (
                    <span className="text-slate-400 block text-[11px] font-sans mt-0.5">
                      {log.messageKhmer}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
};
