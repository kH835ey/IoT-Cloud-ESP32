import React from 'react';
import { NavigationTab } from '../types';
import {
  LayoutDashboard,
  Cpu,
  LineChart,
  Zap,
  Terminal,
  Code2,
  Sliders,
  ShieldCheck,
  Server,
  Layers,
  Sun,
  Moon
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  lang: 'km' | 'en';
  activeDeviceCount: number;
  automationsCount: number;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  lang,
  activeDeviceCount,
  automationsCount,
  theme = 'dark',
  onToggleTheme,
}) => {
  const navItems: {
    id: NavigationTab;
    label: string;
    labelKhmer: string;
    icon: React.ReactNode;
    badge?: string | number;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboards',
      labelKhmer: 'ផ្ទាំងគ្រប់គ្រង (Dashboard)',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'widget_builder',
      label: 'Widget Box Studio',
      labelKhmer: 'រៀបចំ Widget Canvas',
      icon: <Layers className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />,
      badge: 'PRO',
      badgeColor: 'bg-emerald-500 text-slate-950 font-black',
    },
    {
      id: 'devices',
      label: 'Devices & Tokens',
      labelKhmer: 'ឧបករណ៍ & Auth Tokens',
      icon: <Cpu className="w-4 h-4" />,
      badge: activeDeviceCount,
      badgeColor: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30',
    },
    {
      id: 'analytics',
      label: 'Analytics & Charts',
      labelKhmer: 'វិភាគទិន្នន័យ (Analytics)',
      icon: <LineChart className="w-4 h-4" />,
    },
    {
      id: 'logs',
      label: 'Device Logs & Serial',
      labelKhmer: 'កំណត់ត្រាទិន្នន័យ (Logs)',
      icon: <Terminal className="w-4 h-4" />,
      badge: 'LIVE',
      badgeColor: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30',
    },
    {
      id: 'firmware',
      label: 'ESP32 Firmware C++',
      labelKhmer: 'កូដ ESP32 Arduino C++',
      icon: <Code2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />,
    }
  ];

  return (
    <>
      {/* Backdrop Overlay - Active on all screen sizes when sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      
      <aside 
        id="sidebar-navigation" 
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 select-none transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-500/20 border border-emerald-400/30">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm text-slate-900 dark:text-white tracking-wide">IoTCloud.SPS</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                PRO
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
            {lang === 'km' ? 'ម៉ឺនុយចម្បង' : 'Console Menu'}
          </div>

          {navItems.map(item => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {item.icon}
                  </span>
                  <span>{lang === 'km' ? item.labelKhmer : item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status & Quick Mode Switch */}
      <div className="p-3 m-3 bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-bold">
            <Server className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Blynk REST Engine</span>
          </div>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/30">
            HTTP 200
          </span>
        </div>

        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="w-full mt-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        )}

        <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> SSL Active
          </span>
          <span className="font-mono font-bold">v2.4-KH</span>
        </div>
      </div>
    </aside>
    </>
  );
};
