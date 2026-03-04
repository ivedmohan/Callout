'use client';

import { TrendingUp, ArrowRight } from 'lucide-react';

interface EarningsPotentialProps {
  stakeAmount: string;       // e.g. "5"
  totalPot: string;          // e.g. "20"
  optionACount: number;
  optionBCount: number;
  optionALabel?: string;
  optionBLabel?: string;
  selectedOption?: 'A' | 'B' | null;
  hasJoined?: boolean;
  settled?: boolean;
}

/**
 * Polymarket-style earnings potential display.
 * Shows what you'd win if you bet on each side.
 *
 * Payout = totalPot / winnerCount (equal split among winners).
 * Profit = payout - stake.
 * ROI = (profit / stake) * 100.
 */
export function EarningsPotential({
  stakeAmount,
  totalPot,
  optionACount,
  optionBCount,
  optionALabel = 'Yes',
  optionBLabel = 'No',
  selectedOption,
  hasJoined,
  settled,
}: EarningsPotentialProps) {
  const stake = parseFloat(stakeAmount) || 0;
  const pot = parseFloat(totalPot) || 0;

  // If you join, pot grows by your stake
  const potAfterJoin = hasJoined ? pot : pot + stake;

  // Winner counts if you were to join each side
  const winnersIfA = hasJoined ? optionACount : optionACount + 1;
  const winnersIfB = hasJoined ? optionBCount : optionBCount + 1;

  const payoutIfA = winnersIfA > 0 ? potAfterJoin / winnersIfA : 0;
  const payoutIfB = winnersIfB > 0 ? potAfterJoin / winnersIfB : 0;

  const profitIfA = payoutIfA - stake;
  const profitIfB = payoutIfB - stake;

  const roiA = stake > 0 ? (profitIfA / stake) * 100 : 0;
  const roiB = stake > 0 ? (profitIfB / stake) * 100 : 0;

  const formatNum = (n: number) => {
    if (n >= 1000) return n.toFixed(0);
    if (n >= 10) return n.toFixed(1);
    return n.toFixed(2);
  };

  if (settled) return null;

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-[#0f1423] p-5">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-blue-400" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Earnings Potential
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Option A */}
        <div
          className={`rounded-xl border p-4 transition-all ${
            selectedOption === 'A'
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-zinc-800/60 bg-[#13192b]'
          }`}
        >
          <div className="mb-2 flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              {optionALabel}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Payout</span>
              <span className="text-sm font-bold text-white">
                {formatNum(payoutIfA)} STRK
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Profit</span>
              <span className={`text-sm font-bold ${profitIfA >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {profitIfA >= 0 ? '+' : ''}{formatNum(profitIfA)} STRK
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">ROI</span>
              <span className={`text-sm font-bold ${roiA >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {roiA >= 0 ? '+' : ''}{Math.round(roiA)}%
              </span>
            </div>
          </div>
        </div>

        {/* Option B */}
        <div
          className={`rounded-xl border p-4 transition-all ${
            selectedOption === 'B'
              ? 'border-rose-500/50 bg-rose-500/5'
              : 'border-zinc-800/60 bg-[#13192b]'
          }`}
        >
          <div className="mb-2 flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              {optionBLabel}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Payout</span>
              <span className="text-sm font-bold text-white">
                {formatNum(payoutIfB)} STRK
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Profit</span>
              <span className={`text-sm font-bold ${profitIfB >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {profitIfB >= 0 ? '+' : ''}{formatNum(profitIfB)} STRK
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">ROI</span>
              <span className={`text-sm font-bold ${roiB >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {roiB >= 0 ? '+' : ''}{Math.round(roiB)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stake info footer */}
      <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-zinc-600">
        <span>{stake} STRK stake</span>
        <ArrowRight className="h-3 w-3" />
        <span>Pot: {formatNum(potAfterJoin)} STRK</span>
      </div>
    </div>
  );
}
