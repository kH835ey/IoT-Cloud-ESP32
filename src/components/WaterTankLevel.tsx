import React from 'react';
import { Droplets, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

interface WaterTankLevelProps {
  id?: string;
  value: number; // 0 to 100%
  min?: number;
  max?: number;
  unit?: string;
  label?: string;
  labelKhmer?: string;
  totalCapacityLiters?: number;
  highAlarmThreshold?: number;
  className?: string;
  lang?: 'km' | 'en';
}

export const WaterTankLevel: React.FC<WaterTankLevelProps> = ({
  id,
  value = 0,
  min = 0,
  max = 100,
  unit = '%',
  label = 'Water Level',
  labelKhmer = 'កម្រិតទឹកក្នុងអាង (Liquid Tank)',
  totalCapacityLiters = 2000,
  highAlarmThreshold = 85,
  className = '',
  lang = 'km',
}) => {
  const clampedValue = Math.min(Math.max(Number(value) || 0, min), max);
  const percentage = Math.round(((clampedValue - min) / (max - min || 1)) * 100);
  const currentLiters = Math.round((percentage / 100) * totalCapacityLiters);
  const isHighAlarm = percentage >= highAlarmThreshold;

  // Geometry for capsule tank
  const capsuleWidth = 240;
  const capsuleHeight = 320;
  const cornerRadius = 40;

  // Liquid height
  const liquidHeight = Math.max(0, Math.min(capsuleHeight - 8, (percentage / 100) * (capsuleHeight - 8)));
  const liquidY = capsuleHeight - 4 - liquidHeight;

  return (
    <div
      id={id}
      className={`flex flex-col justify-between w-full h-full select-none ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
            <Droplets className="w-4 h-4 text-sky-500" />
            <span>{label}</span>
          </h4>
        </div>

        {/* High Alarm / Status Pill */}
        <span
          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-xs flex items-center gap-1 transition-colors ${
            isHighAlarm
              ? 'bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 animate-pulse'
              : 'bg-sky-50 dark:bg-sky-950/70 border-sky-300 dark:border-sky-800 text-sky-600 dark:text-sky-400'
          }`}
        >
          {isHighAlarm ? (
            <>
              <AlertTriangle className="w-3 h-3" />
              <span>HIGH ALARM</span>
            </>
          ) : (
            <span>NORMAL LEVEL</span>
          )}
        </span>
      </div>

      {/* Main Tank Capsule Diagram (Direct translation of image.png) */}
      <div className="relative flex items-center justify-center py-2">
        <div 
          style={{ width: capsuleWidth, height: capsuleHeight }}
          className="relative rounded-[42px] p-[3px] bg-gradient-to-b from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 shadow-md flex items-center justify-center"
        >
          {/* Inner Tank Capsule */}
          <div className="relative w-full h-full rounded-[39px] overflow-hidden bg-slate-50 dark:bg-slate-900 border border-white/60 dark:border-slate-800 shadow-inner">
            {/* Background Tick Marks (100%, 75%, 50%, 25%, 0%) on the Left */}
            <div className="absolute left-4 top-0 bottom-0 flex flex-col justify-between py-10 z-10 pointer-events-none text-[12px] font-mono font-bold select-none text-slate-400 dark:text-slate-500">
              <span className="opacity-90">100%</span>
              <span className="opacity-80">75%</span>
              <span className="opacity-80">50%</span>
              <span className="opacity-80">25%</span>
              <span className="opacity-90">0%</span>
            </div>

            {/* Top SENSOR Pill Badge */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
              <div className="bg-[#181d24] text-white text-[10px] font-bold tracking-wider px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-slate-700/60">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 border border-slate-400 inline-block" />
                <span>ULTRASONIC</span>
              </div>
            </div>

            {/* Ultrasonic Radar Wave beneath Sensor */}
            <svg
              className="absolute top-12 left-1/2 -translate-x-1/2 w-32 h-10 z-10 overflow-visible pointer-events-none"
              viewBox="0 0 80 24"
            >
              <path
                d="M 10 4 Q 40 18 70 4"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.6"
              />
              <path
                d="M 20 8 Q 40 20 60 8"
                fill="none"
                stroke="#bae6fd"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.8"
              />
            </svg>

            {/* SVG Liquid Fill with Animated Wave and Gradient */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox={`0 0 ${capsuleWidth} ${capsuleHeight}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id={`tankGradient-${id || 'def'}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0891b2" />
                  <stop offset="35%" stopColor="#0284c7" />
                  <stop offset="70%" stopColor="#1e3a8a" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>

                <clipPath id={`capsuleClip-${id || 'def'}`}>
                  <rect x="0" y="0" width={capsuleWidth} height={capsuleHeight} rx={cornerRadius} ry={cornerRadius} />
                </clipPath>
              </defs>

              <g clipPath={`url(#capsuleClip-${id || 'def'})`}>
                {/* Background Wave (Ocean Depth Effect) */}
                {percentage > 0 && (
                  <motion.path
                    d={`M 0 ${liquidY} Q ${capsuleWidth * 0.25} ${liquidY - 8} ${capsuleWidth * 0.5} ${liquidY} T ${capsuleWidth} ${liquidY} L ${capsuleWidth} ${capsuleHeight} L 0 ${capsuleHeight} Z`}
                    fill="#0369a1"
                    opacity="0.3"
                    animate={{
                      d: [
                        `M 0 ${liquidY} Q ${capsuleWidth * 0.25} ${liquidY - 8} ${capsuleWidth * 0.5} ${liquidY} T ${capsuleWidth} ${liquidY} L ${capsuleWidth} ${capsuleHeight} L 0 ${capsuleHeight} Z`,
                        `M 0 ${liquidY} Q ${capsuleWidth * 0.25} ${liquidY + 8} ${capsuleWidth * 0.5} ${liquidY} T ${capsuleWidth} ${liquidY} L ${capsuleWidth} ${capsuleHeight} L 0 ${capsuleHeight} Z`,
                        `M 0 ${liquidY} Q ${capsuleWidth * 0.25} ${liquidY - 8} ${capsuleWidth * 0.5} ${liquidY} T ${capsuleWidth} ${liquidY} L ${capsuleWidth} ${capsuleHeight} L 0 ${capsuleHeight} Z`,
                      ]
                    }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  />
                )}

                {/* Liquid Body */}
                <motion.rect
                  x="0"
                  y={liquidY}
                  width={capsuleWidth}
                  height={liquidHeight + 40}
                  fill={`url(#tankGradient-${id || 'def'})`}
                  initial={false}
                  animate={{ y: liquidY, height: liquidHeight + 40 }}
                  transition={{ duration: 0.8, ease: "circOut" }}
                />

                {/* Primary Animated Wave Surface */}
                {percentage > 0 && (
                  <motion.path
                    d={`M 0 ${liquidY} Q ${capsuleWidth * 0.25} ${liquidY - 5} ${capsuleWidth * 0.5} ${liquidY} T ${capsuleWidth} ${liquidY} L ${capsuleWidth} ${liquidY + 20} L 0 ${liquidY + 20} Z`}
                    fill={`url(#tankGradient-${id || 'def'})`}
                    animate={{
                      d: [
                        `M 0 ${liquidY} Q ${capsuleWidth * 0.25} ${liquidY - 6} ${capsuleWidth * 0.5} ${liquidY} T ${capsuleWidth} ${liquidY} L ${capsuleWidth} ${liquidY + 20} L 0 ${liquidY + 20} Z`,
                        `M 0 ${liquidY} Q ${capsuleWidth * 0.25} ${liquidY + 6} ${capsuleWidth * 0.5} ${liquidY} T ${capsuleWidth} ${liquidY} L ${capsuleWidth} ${liquidY + 20} L 0 ${liquidY + 20} Z`,
                        `M 0 ${liquidY} Q ${capsuleWidth * 0.25} ${liquidY - 6} ${capsuleWidth * 0.5} ${liquidY} T ${capsuleWidth} ${liquidY} L ${capsuleWidth} ${liquidY + 20} L 0 ${liquidY + 20} Z`,
                      ]
                    }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  />
                )}

                {/* Surface Highlight Wave (Shimmer) */}
                {percentage > 2 && (
                  <motion.path
                    d={`M 0 ${liquidY} Q ${capsuleWidth * 0.25} ${liquidY - 3} ${capsuleWidth * 0.5} ${liquidY} T ${capsuleWidth} ${liquidY} L ${capsuleWidth} ${liquidY + 3} L 0 ${liquidY + 3} Z`}
                    fill="#bae6fd"
                    opacity="0.5"
                    animate={{
                      x: [-capsuleWidth, 0, capsuleWidth],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
                  />
                )}

                {/* Floating Translucent Bubbles (Sea Life / Oxygen effect) */}
                {percentage > 5 && (
                  <>
                    {[...Array(10)].map((_, i) => (
                      <motion.circle
                        key={i}
                        cx={20 + (i * 22) % (capsuleWidth - 40)}
                        cy={capsuleHeight}
                        r={1.5 + Math.random() * 3}
                        fill="#ffffff"
                        opacity={0.2 + Math.random() * 0.3}
                        animate={{
                          y: [capsuleHeight, liquidY],
                          x: [20 + (i * 30) % (capsuleWidth - 40), 20 + (i * 30) % (capsuleWidth - 40) + (Math.random() - 0.5) * 20],
                          opacity: [0.5, 0]
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 3 + Math.random() * 4,
                          delay: Math.random() * 5,
                          ease: "easeOut"
                        }}
                      />
                    ))}
                  </>
                )}
              </g>
            </svg>

            {/* Central Frosted Glass Percentage Pill */}
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <motion.div 
                initial={false}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="bg-white/40 dark:bg-slate-900/50 backdrop-blur-md border border-white/70 dark:border-white/20 shadow-lg rounded-2xl px-7 py-3.5 flex items-center justify-center transform"
              >
                <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-xs font-mono">
                  {percentage}%
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Volume & Capacity Metrics */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
          <span className="font-medium">{lang === 'km' ? 'ជម្រៅ:' : 'Depth:'}</span>
          <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
            15cm = 0%, 5cm = 100%
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-lg font-black text-sky-600 dark:text-sky-400 font-mono">
            {clampedValue}
          </span>
          <span className="text-xs font-bold text-slate-400">{unit}</span>
        </div>
      </div>
    </div>
  );
};
