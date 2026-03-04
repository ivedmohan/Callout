'use client';

import Link from 'next/link';
import type { Bet } from '@/types';
import { Coins, Users, Clock, Trophy } from 'lucide-react';

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

  return (
    <Link href={`/bet/${bet.id}`}>
      <div className="group relative flex flex-col h-full overflow-hidden rounded-2xl border border-zinc-800/60 bg-[#0f1423] p-5 transition-all hover:border-blue-500/50 hover:bg-[#13192b] hover:shadow-xl hover:shadow-blue-500/10">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="line-clamp-2 text-lg font-semibold tracking-tight text-zinc-900 group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400">
            {bet.title}
          </h3>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider ${statusColor}`}>
            {statusText}
          </span>
        </div>

        <div className="mt-2 mb-4 grid grid-cols-2 gap-3">
          <div className="flex flex-col items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 transition-colors hover:bg-emerald-500/20 cursor-pointer">
            <span className="text-xs font-semibold text-emerald-500 mb-1 uppercase tracking-wider">Yes</span>
            <span className="text-sm font-medium text-emerald-100 text-center line-clamp-2">
              {bet.optionA}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 transition-colors hover:bg-rose-500/20 cursor-pointer">
            <span className="text-xs font-semibold text-rose-500 mb-1 uppercase tracking-wider">No</span>
            <span className="text-sm font-medium text-rose-100 text-center line-clamp-2">
              {bet.optionB}
            </span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-zinc-800/60 pt-4 text-xs font-medium text-zinc-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Coins className="h-4 w-4 text-blue-400" />
              <span>{bet.totalPot || bet.stakeAmount} STRK Vol</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Users className="h-4 w-4" />
              <span>{bet.participantCount}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-zinc-400" />
            <span>{deadlineDate}</span>
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
