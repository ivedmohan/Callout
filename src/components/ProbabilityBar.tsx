'use client';

interface ProbabilityBarProps {
  optionACount: number;
  optionBCount: number;
  optionALabel?: string;
  optionBLabel?: string;
  /** Compact mode hides labels, used in BetCard */
  compact?: boolean;
}

export function ProbabilityBar({
  optionACount,
  optionBCount,
  optionALabel = 'Yes',
  optionBLabel = 'No',
  compact = false,
}: ProbabilityBarProps) {
  const total = optionACount + optionBCount;
  const pctA = total > 0 ? Math.round((optionACount / total) * 100) : 50;
  const pctB = total > 0 ? 100 - pctA : 50;

  const getOptionColor = (text: string, isOptionA: boolean) => {
    const lower = text.trim().toLowerCase();
    if (['no', 'n', 'false'].includes(lower)) return 'rose';
    if (['yes', 'y', 'true'].includes(lower)) return 'emerald';
    return isOptionA ? 'emerald' : 'rose';
  };

  const colorA = getOptionColor(optionALabel, true);
  const colorB = getOptionColor(optionBLabel, false);

  return (
    <div className="w-full">
      {/* Labels row */}
      <div className={`flex items-center justify-between ${compact ? 'mb-1.5' : 'mb-2'}`}>
        <div className="flex items-center gap-1.5">
          <span className={`inline-block h-2 w-2 rounded-full bg-${colorA}-500`} />
          <span className={`font-semibold text-${colorA}-400 ${compact ? 'text-xs' : 'text-sm'}`}>
            {optionALabel}
          </span>
          <span className={`font-bold text-${colorA}-300 ${compact ? 'text-xs' : 'text-sm'}`}>
            {pctA}%
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`font-bold text-${colorB}-300 ${compact ? 'text-xs' : 'text-sm'}`}>
            {pctB}%
          </span>
          <span className={`font-semibold text-${colorB}-400 ${compact ? 'text-xs' : 'text-sm'}`}>
            {optionBLabel}
          </span>
          <span className={`inline-block h-2 w-2 rounded-full bg-${colorB}-500`} />
        </div>
      </div>

      {/* Bar */}
      <div className={`flex w-full overflow-hidden rounded-full ${compact ? 'h-3' : 'h-3'} bg-zinc-800`}>
        <div
          className={`bg-${colorA}-500 transition-all duration-500 ease-out`}
          style={{ width: `${pctA}%` }}
        />
        <div
          className={`bg-${colorB}-500 transition-all duration-500 ease-out`}
          style={{ width: `${pctB}%` }}
        />
      </div>
    </div>
  );
}
