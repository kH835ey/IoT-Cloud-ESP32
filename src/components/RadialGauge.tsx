import React from 'react';

interface RadialGaugeProps {
  id?: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  label: string;
  labelKhmer?: string;
  color?: string;
  size?: number;
  icon?: React.ReactNode;
  statusText?: string;
  statusColor?: string;
  className?: string;
}

export const RadialGauge: React.FC<RadialGaugeProps> = ({
  id,
  value,
  min = 0,
  max = 100,
  unit,
  label,
  labelKhmer,
  color = '#ff6b6b',
  size = 260,
  icon,
  statusText,
  statusColor = '#10b981',
  className = '',
}) => {
  // Upright horseshoe/dome arch mathematically calculated:
  // Starts at bottom-left (-180° / left), sweeps over the top (90° / apex), to bottom-right (0° / right).
  // Total span is 180 degrees.
  const strokeWidth = 18;
  const width = size;
  const height = size * 0.62; // Proportionate height for a semicircle arch with room for ticks & values
  
  const radius = (width - strokeWidth * 2) / 2;
  const centerX = width / 2;
  const centerY = height - 26; // baseline near bottom

  const clampedValue = Math.min(Math.max(Number(value) || 0, min), max);
  const percentage = (clampedValue - min) / (max - min || 1);

  // Calculate coordinates on the upper semicircle
  // angle = 180 (left) down to 0 (right)
  const getCoords = (pct: number) => {
    const angleDeg = 180 - pct * 180;
    const angleRad = (angleDeg * Math.PI) / 180;
    const x = centerX + radius * Math.cos(angleRad);
    const y = centerY - radius * Math.sin(angleRad);
    return { x, y };
  };

  const startPt = getCoords(0);
  const endPt = getCoords(1);
  const currPt = getCoords(percentage);

  // Background track path: Full semicircle from left over top to right
  const bgPath = `M ${startPt.x} ${startPt.y} A ${radius} ${radius} 0 0 1 ${endPt.x} ${endPt.y}`;

  // Active value path
  const valuePath = percentage > 0.005
    ? `M ${startPt.x} ${startPt.y} A ${radius} ${radius} 0 0 1 ${currPt.x} ${currPt.y}`
    : '';

  const gradId = `gauge-grad-${(color || '').replace(/[^a-zA-Z0-9]/g, '')}-${label.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div id={id} className={`flex flex-col justify-between w-full h-full select-none ${className}`}>
      {/* Top Header matching Blynk Console (Image 2) */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h4 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
            {icon && <span className="text-slate-400">{icon}</span>}
            <span>{label}</span>
          </h4>
          {labelKhmer && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{labelKhmer}</p>
          )}
        </div>

        {statusText && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shadow-xs"
            style={{ color: statusColor }}
          >
            {statusText}
          </span>
        )}
      </div>

      {/* Main Arch Graphic & Center Value */}
      <div className="relative flex items-center justify-center my-auto py-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[280px] h-auto overflow-visible"
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity="0.85" />
              <stop offset="100%" stopColor={color} stopOpacity="1" />
            </linearGradient>
            <filter id={`glow-${gradId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor={color} floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Background Arc Track (Image 2 style soft gray) */}
          <path
            d={bgPath}
            fill="none"
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-800"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Active Value Arc Track */}
          {valuePath && (
            <path
              d={valuePath}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              filter={`url(#glow-${gradId})`}
              className="transition-all duration-500 ease-out"
            />
          )}

          {/* Min value label below left arch tip (Image 2) */}
          <text
            x={startPt.x}
            y={centerY + 20}
            fill="currentColor"
            className="text-slate-700 dark:text-slate-300 font-mono text-sm sm:text-base font-semibold"
            textAnchor="middle"
          >
            {min}
          </text>

          {/* Max value label below right arch tip (Image 2) */}
          <text
            x={endPt.x}
            y={centerY + 20}
            fill="currentColor"
            className="text-slate-700 dark:text-slate-300 font-mono text-sm sm:text-base font-semibold"
            textAnchor="middle"
          >
            {max}
          </text>
        </svg>

        {/* Big Center Value + Unit (Image 2) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-5 pointer-events-none">
          <div className="flex items-baseline gap-0.5">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-800 dark:text-white font-mono">
              {typeof value === 'number'
                ? Number.isInteger(value)
                  ? value
                  : value.toFixed(1)
                : value}
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-500 dark:text-slate-400 font-mono ml-0.5">
              {unit}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
