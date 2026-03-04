'use client';

interface DonutChartProps {
  optionACount: number;
  optionBCount: number;
  optionALabel?: string;
  optionBLabel?: string;
  size?: number;
}

/**
 * Pure SVG donut chart showing vote split between two options.
 * No external dependencies.
 */
export function DonutChart({
  optionACount,
  optionBCount,
  optionALabel = 'Yes',
  optionBLabel = 'No',
  size = 160,
}: DonutChartProps) {
  const total = optionACount + optionBCount;
  const pctA = total > 0 ? (optionACount / total) * 100 : 50;
  const pctB = total > 0 ? 100 - pctA : 50;

  // SVG donut via stroke-dasharray on circles
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = 20;

  const dashA = (pctA / 100) * circumference;
  const dashB = (pctB / 100) * circumference;

  // Slight gap between segments
  const gap = total > 0 && pctA > 0 && pctB > 0 ? 4 : 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 140 140"
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background ring */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
          />

          {/* Option A arc (emerald) */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#10b981"
            strokeWidth={strokeWidth}
            strokeDasharray={`${Math.max(0, dashA - gap)} ${circumference}`}
            strokeDashoffset="0"
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />

          {/* Option B arc (rose) */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#f43f5e"
            strokeWidth={strokeWidth}
            strokeDasharray={`${Math.max(0, dashB - gap)} ${circumference}`}
            strokeDashoffset={`${-dashA}`}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{total}</span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            {total === 1 ? 'Vote' : 'Votes'}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-zinc-300">{optionALabel}</span>
          <span className="text-xs font-bold text-emerald-400">{Math.round(pctA)}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500" />
          <span className="text-xs font-semibold text-zinc-300">{optionBLabel}</span>
          <span className="text-xs font-bold text-rose-400">{Math.round(pctB)}%</span>
        </div>
      </div>
    </div>
  );
}
