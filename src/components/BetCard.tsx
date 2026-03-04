'use client';

import Link from 'next/link';
import type { Bet } from '@/types';
import { Coins, Users, Clock, Trophy } from 'lucide-react';
import { ProbabilityBar } from './ProbabilityBar';

interface BetCardProps {
  bet: Bet;
}

export function BetCard({ bet }: BetCardProps) {
  const isExpired = Date.now() > bet.deadline * 1000;
  const statusColor = bet.settled
    ? 'text-emerald-500 bg-emerald-500/10'
    : isExpired
      ? 'text-red-500 bg-red-500/10'
      : 'text-blue-500 bg-blue-500/10';
  const statusText = bet.settled ? 'Settled' : isExpired ? 'Expired' : 'Active';

  const deadlineDate = new Date(bet.deadline * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // If options are just "Yes"/"No" (or similar), don't repeat them — show only the label.
  // If they're custom names, show only the names without Yes/No.
  const isDefaultOptions =
    ['yes', 'no', 'y', 'n'].includes(bet.optionA.trim().toLowerCase()) &&
    ['yes', 'no', 'y', 'n'].includes(bet.optionB.trim().toLowerCase());

  const getOptionColor = (text: string, isOptionA: boolean) => {
    const lower = text.trim().toLowerCase();
    if (['no', 'n', 'false'].includes(lower)) return 'rose';
    if (['yes', 'y', 'true'].includes(lower)) return 'emerald';
    return isOptionA ? 'emerald' : 'rose';
  };

  const colorA = getOptionColor(bet.optionA, true);
  const colorB = getOptionColor(bet.optionB, false);

  return (
    <Link href={`/bet/${bet.id}`}>
      <div className="group relative flex flex-col h-full overflow-hidden rounded-2xl border border-zinc-800/60 bg-[#0f1423] p-5 transition-all hover:border-blue-500/50 hover:bg-[#13192b] hover:shadow-xl hover:shadow-blue-500/10">
        <div className="mb-4 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                General
              </span>
              <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-500">
                Trending
              </span>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider ${statusColor}`}>
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" />
              {statusText}
            </span>
          </div>

          <h3 className="text-lg font-bold leading-snug tracking-tight text-white line-clamp-2 hover:text-blue-400 transition-colors">
            {bet.title}
          </h3>
        </div>

        <div className="mt-2 mb-2">
          <ProbabilityBar
            optionACount={bet.optionACount ?? 0}
            optionBCount={bet.optionBCount ?? 0}
            optionALabel={isDefaultOptions ? 'Yes' : bet.optionA}
            optionBLabel={isDefaultOptions ? 'No' : bet.optionB}
          />
        </div>

        <div className="mt-2 mb-4 grid grid-cols-2 gap-2">
          <div className={`flex flex-col items-center justify-center rounded-lg bg-${colorA}-500/10 border border-${colorA}-500/20 py-2.5 transition-colors hover:bg-${colorA}-500/20 cursor-pointer`}>
            <span className={`text-sm font-semibold text-${colorA}-500 tracking-wide`}>{isDefaultOptions ? 'Yes' : bet.optionA}</span>
          </div>
          <div className={`flex flex-col items-center justify-center rounded-lg bg-${colorB}-500/10 border border-${colorB}-500/20 py-2.5 transition-colors hover:bg-${colorB}-500/20 cursor-pointer`}>
            <span className={`text-sm font-semibold text-${colorB}-500 tracking-wide`}>{isDefaultOptions ? 'No' : bet.optionB}</span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-zinc-800/60 pt-4 text-xs font-medium text-zinc-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              Vol <span className="text-zinc-300 font-mono">${bet.totalPot}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {bet.participantCount}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {deadlineDate}
            </div>
          </div>
        </div>

        {bet.settled && bet.winner && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <Trophy className="h-4 w-4" />
            Winning Outcome: {bet.winner === 'A' ? bet.optionA : bet.optionB}
          </div>
        )}
      </div>
    </Link>
  );
}
