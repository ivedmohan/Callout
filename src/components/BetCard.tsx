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
      <div className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-500/50">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="line-clamp-2 text-lg font-semibold tracking-tight text-zinc-900 group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400">
            {bet.title}
          </h3>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider ${statusColor}`}>
            {statusText}
          </span>
        </div>

        <div className="mb-5 flex flex-col gap-2">
          <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800/60 dark:bg-zinc-900/50">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {bet.optionA}
            </span>
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Yes</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800/60 dark:bg-zinc-900/50">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {bet.optionB}
            </span>
            <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">No</span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-4 text-xs font-medium text-zinc-500 dark:border-zinc-800/60 dark:text-zinc-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 hover:text-zinc-700 dark:hover:text-zinc-300">
              <Coins className="h-4 w-4 text-blue-500" />
              <span>{bet.stakeAmount} STRK</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-zinc-700 dark:hover:text-zinc-300">
              <Users className="h-4 w-4 text-zinc-400" />
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
