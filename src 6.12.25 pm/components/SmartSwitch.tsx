import React from 'react';
import { playMechanicalSwitchSound } from '../utils/audioEffects';
import {
  Lightbulb,
  Power,
  Droplets,
  Bell,
  Fan,
  Send,
  Mail,
  Phone,
  Camera,
  Sun,
  Flame,
  Zap,
  Sliders,
  Settings,
  Check
} from 'lucide-react';

export type SmartSwitchVariant =
  | 'light'
  | 'pump'
  | 'siren'
  | 'fan'
  | 'trash'
  | 'telegram'
  | 'email'
  | 'call'
  | 'camera'
  | 'relay'
  | 'auto';

interface SmartSwitchProps {
  id?: string;
  title: string;
  titleKhmer?: string;
  subtitle?: string;
  isOn: boolean;
  onToggle: () => void;
  variant?: SmartSwitchVariant;
  pinLabel?: string;
  lang?: 'km' | 'en';
  size?: 'normal' | 'compact' | 'large';
  accentColor?: string;
  disabled?: boolean;
}

export const SmartSwitch: React.FC<SmartSwitchProps> = ({
  id,
  title,
  titleKhmer,
  subtitle,
  isOn,
  onToggle,
  variant = 'relay',
  pinLabel,
  lang = 'km',
  size = 'normal',
  accentColor,
  disabled = false,
}) => {
  // Infer variant from title if variant is relay
  let effectiveVariant = variant;
  const lower = (title + ' ' + (titleKhmer || '')).toLowerCase();
  if (variant === 'relay') {
    if (lower.includes('lamp') || lower.includes('light') || lower.includes('ភ្លើង') || lower.includes('អំពូល')) {
      effectiveVariant = 'light';
    } else if (lower.includes('pump') || lower.includes('water') || lower.includes('ទឹក') || lower.includes('បូម')) {
      effectiveVariant = 'pump';
    } else if (lower.includes('siren') || lower.includes('alert') || lower.includes('alarm') || lower.includes('អាសន្ន') || lower.includes('ស៊ីរ៉ែន')) {
      effectiveVariant = 'siren';
    } else if (lower.includes('fan') || lower.includes('កង្ហារ')) {
      effectiveVariant = 'fan';
    } else if (lower.includes('trash') || lower.includes('សំរាម')) {
      effectiveVariant = 'trash';
    } else if (lower.includes('telegram')) {
      effectiveVariant = 'telegram';
    } else if (lower.includes('email') || lower.includes('mail')) {
      effectiveVariant = 'email';
    } else if (lower.includes('call') || lower.includes('ទូរស័ព្ទ')) {
      effectiveVariant = 'call';
    } else if (lower.includes('auto') || lower.includes('ស្វ័យ')) {
      effectiveVariant = 'auto';
    }
  }

  // Get icon and color scheme based on variant
  const getVariantStyles = () => {
    switch (effectiveVariant) {
      case 'light':
        return {
          activeBg: 'bg-amber-500',
          activeGlow: 'shadow-amber-500/40',
          activeBorder: 'border-amber-400',
          activeText: 'text-amber-500 dark:text-amber-400',
          icon: <Lightbulb className={`w-5 h-5 transition-transform duration-300 ${isOn ? 'text-amber-400 scale-110' : 'text-slate-400 dark:text-slate-500'}`} />,
          labelOn: lang === 'km' ? 'បើក (ON)' : 'ON',
          labelOff: lang === 'km' ? 'បិទ (OFF)' : 'OFF',
        };
      case 'pump':
        return {
          activeBg: 'bg-emerald-500',
          activeGlow: 'shadow-emerald-500/40',
          activeBorder: 'border-emerald-400',
          activeText: 'text-emerald-500 dark:text-emerald-400',
          icon: <Droplets className={`w-5 h-5 transition-transform duration-300 ${isOn ? 'text-emerald-400 animate-bounce' : 'text-slate-400 dark:text-slate-500'}`} />,
          labelOn: lang === 'km' ? 'បើក (ON)' : 'ON',
          labelOff: lang === 'km' ? 'បិទ (OFF)' : 'OFF',
        };
      case 'siren':
        return {
          activeBg: 'bg-red-500',
          activeGlow: 'shadow-red-500/40',
          activeBorder: 'border-red-400',
          activeText: 'text-red-500 dark:text-red-400',
          icon: <Bell className={`w-5 h-5 transition-transform duration-300 ${isOn ? 'text-red-400 animate-pulse' : 'text-slate-400 dark:text-slate-500'}`} />,
          labelOn: lang === 'km' ? 'បើក (ON)' : 'ON',
          labelOff: lang === 'km' ? 'បិទ (OFF)' : 'OFF',
        };
      case 'fan':
        return {
          activeBg: 'bg-cyan-500',
          activeGlow: 'shadow-cyan-500/40',
          activeBorder: 'border-cyan-400',
          activeText: 'text-cyan-500 dark:text-cyan-400',
          icon: <Fan className={`w-5 h-5 transition-transform duration-300 ${isOn ? 'text-cyan-400 animate-spin' : 'text-slate-400 dark:text-slate-500'}`} />,
          labelOn: lang === 'km' ? 'បើក (ON)' : 'ON',
          labelOff: lang === 'km' ? 'បិទ (OFF)' : 'OFF',
        };
      case 'telegram':
        return {
          activeBg: 'bg-sky-500',
          activeGlow: 'shadow-sky-500/40',
          activeBorder: 'border-sky-400',
          activeText: 'text-sky-500 dark:text-sky-400',
          icon: <Send className={`w-5 h-5 transition-transform duration-300 ${isOn ? 'text-sky-400' : 'text-slate-400 dark:text-slate-500'}`} />,
          labelOn: lang === 'km' ? 'បើក (ON)' : 'ON',
          labelOff: lang === 'km' ? 'បិទ (OFF)' : 'OFF',
        };
      case 'email':
        return {
          activeBg: 'bg-amber-500',
          activeGlow: 'shadow-amber-500/40',
          activeBorder: 'border-amber-400',
          activeText: 'text-amber-500 dark:text-amber-400',
          icon: <Mail className={`w-5 h-5 transition-transform duration-300 ${isOn ? 'text-amber-400' : 'text-slate-400 dark:text-slate-500'}`} />,
          labelOn: lang === 'km' ? 'បើក (ON)' : 'ON',
          labelOff: lang === 'km' ? 'បិទ (OFF)' : 'OFF',
        };
      case 'call':
        return {
          activeBg: 'bg-emerald-500',
          activeGlow: 'shadow-emerald-500/40',
          activeBorder: 'border-emerald-400',
          activeText: 'text-emerald-500 dark:text-emerald-400',
          icon: <Phone className={`w-5 h-5 transition-transform duration-300 ${isOn ? 'text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />,
          labelOn: lang === 'km' ? 'បើក (ON)' : 'ON',
          labelOff: lang === 'km' ? 'បិទ (OFF)' : 'OFF',
        };
      case 'auto':
        return {
          activeBg: 'bg-blue-500',
          activeGlow: 'shadow-blue-500/40',
          activeBorder: 'border-blue-400',
          activeText: 'text-blue-500 dark:text-blue-400',
          icon: <Settings className={`w-5 h-5 transition-transform duration-300 ${isOn ? 'text-blue-400 animate-spin-slow' : 'text-slate-400 dark:text-slate-500'}`} />,
          labelOn: lang === 'km' ? 'បើក (ON)' : 'ON',
          labelOff: lang === 'km' ? 'បិទ (OFF)' : 'OFF',
        };
      case 'trash':
        return {
          activeBg: 'bg-emerald-500',
          activeGlow: 'shadow-emerald-500/40',
          activeBorder: 'border-emerald-400',
          activeText: 'text-emerald-500 dark:text-emerald-400',
          icon: <Power className={`w-5 h-5 transition-transform duration-300 ${isOn ? 'text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />,
          labelOn: lang === 'km' ? 'គម្របបើក (OPEN)' : 'Lid Open',
          labelOff: lang === 'km' ? 'គម្របបិទ (CLOSED)' : 'Lid Closed',
        };
      case 'relay':
      default:
        return {
          activeBg: 'bg-emerald-500',
          activeGlow: 'shadow-emerald-500/40',
          activeBorder: 'border-emerald-400',
          activeText: 'text-emerald-500 dark:text-emerald-400',
          icon: <Power className={`w-5 h-5 transition-transform duration-300 ${isOn ? 'text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />,
          labelOn: lang === 'km' ? 'បើក (ON)' : 'State: ON',
          labelOff: lang === 'km' ? 'បិទ (OFF)' : 'State: OFF',
        };
    }
  };

  const vStyles = getVariantStyles();
  const displayTitle = lang === 'km' && titleKhmer ? titleKhmer : title;

  return (
    <div
      id={id}
      className={`group relative bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-xl transition-all duration-200 flex flex-col justify-between ${
        isOn ? 'ring-1 ring-emerald-500/30' : ''
      }`}
    >
      {/* Header with Title and Pin */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 ${
              isOn
                ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400'
            }`}
          >
            {vStyles.icon}
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight font-sans">
              {displayTitle}
            </h4>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {pinLabel && (
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-800">
            {pinLabel}
          </span>
        )}
      </div>

      {/* Switch Toggle Row with Big Clear Khmer Text and Realistic Toggle Switch */}
      <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              isOn
                ? `${vStyles.activeBg} animate-pulse shadow-sm ${vStyles.activeGlow}`
                : 'bg-slate-300 dark:bg-slate-700'
            }`}
          />
          <span
            className={`text-sm sm:text-base font-bold transition-colors duration-200 ${
              isOn ? vStyles.activeText : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {isOn ? vStyles.labelOn : vStyles.labelOff}
          </span>
        </div>

        {/* Real Hardware Tactile Toggle Switch */}
        <button
          type="button"
          onClick={() => {
            if (disabled) return;
            playMechanicalSwitchSound(!isOn);
            onToggle();
          }}
          disabled={disabled}
          aria-pressed={isOn}
          className={`relative inline-flex h-9 w-16 shrink-0 cursor-pointer rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-inner ${
            isOn
              ? `${vStyles.activeBg} ${vStyles.activeGlow} shadow-lg`
              : 'bg-slate-300 dark:bg-slate-800'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="sr-only">Toggle {displayTitle}</span>
          <span
            className={`pointer-events-none flex items-center justify-center h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
              isOn ? 'translate-x-7' : 'translate-x-0'
            }`}
          >
            <Power
              className={`w-3.5 h-3.5 transition-colors ${
                isOn ? 'text-slate-900 font-bold' : 'text-slate-400'
              }`}
            />
          </span>
        </button>
      </div>
    </div>
  );
};
