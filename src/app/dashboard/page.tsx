'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { BetCard } from '@/components/BetCard';
import { LoadingSpinner, PageLoading, EmptyState } from '@/components/LoadingSpinner';
import { useWallet } from '@/hooks/useWallet';
import { getUserBets } from '@/lib/contract';
import type { Bet } from '@/types';
import { Target, Activity, CheckCircle2, BarChart2, Coins, Rocket } from 'lucide-react';

export default function DashboardPage() {
  const { isConnected, connectWallet, isLoading: walletLoading, address } = useWallet();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'settled'>('all');

  useEffect(() => {
    if (!isConnected || !address) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function loadBets() {
      setLoading(true);
      try {
        const userBets = await getUserBets(address as string);
        if (!cancelled) setBets(userBets.reverse());
      } catch (err) {
        console.error('Failed to load bets:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadBets();
    return () => { cancelled = true; };
  }, [isConnected]);

  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          {walletLoading ? (
            <>
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-zinc-400">Setting up your wallet...</p>
            </>
          ) : (
            <>
              <h1 className="mb-2 text-2xl font-bold text-white">Portfolio</h1>
              <p className="mb-6 text-zinc-500">Sign in to track your bets and winnings</p>
              <Button onClick={connectWallet} className="gap-2 px-8">
                <Rocket className="h-4 w-4" /> Sign In securely
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (loading) return <PageLoading />;

  const filteredBets = bets.filter((bet) => {
    if (filter === 'active') return !bet.settled;
    if (filter === 'settled') return bet.settled;
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">Portfolio</h1>
          <p className="text-sm text-zinc-500">Track your active positions and past predictions</p>
        </div>
        <Link href="/create">
          <Button className="hidden sm:flex gap-2">
            <Target className="h-4 w-4" /> New Market
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {(['all', 'active', 'settled'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${filter === f
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              : 'text-zinc-500 border border-transparent hover:bg-zinc-800/50 hover:text-zinc-300'
              }`}
          >
            {f === 'all' && <BarChart2 className="h-4 w-4" />}
            {f === 'active' && <Activity className="h-4 w-4" />}
            {f === 'settled' && <CheckCircle2 className="h-4 w-4" />}
            {f === 'all' ? 'All Positions' : f === 'active' ? 'Active' : 'Settled History'}
          </button>
        ))}
      </div>

      {/* Bet List */}
      {filteredBets.length === 0 ? (
        <EmptyState
          icon={<Target className="h-12 w-12 text-zinc-500" />}
          title="No bets yet"
          description={
            filter === 'all'
              ? "You haven't participated in any markets yet."
              : `No ${filter} markets found.`
          }
          action={
            <Link href="/create">
              <Button className="mt-2 gap-2">
                <Target className="h-4 w-4" /> Create Your First Market
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4">
          {filteredBets.map((bet) => (
            <BetCard key={bet.id} bet={bet} />
          ))}
        </div>
      )}

      {/* Stats summary */}
      {bets.length > 0 && (
        <div className="mt-10 grid grid-cols-3 gap-4 border-t border-zinc-800/60 pt-8">
          <div className="rounded-2xl border border-zinc-800/60 bg-[#0f1423] p-4 text-center">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">Markets</p>
            <p className="text-2xl font-bold text-white">{bets.length}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800/60 bg-[#0f1423] p-4 text-center">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">Active</p>
            <p className="text-2xl font-bold text-blue-400">
              {bets.filter((b) => !b.settled).length}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800/60 bg-[#0f1423] p-4 text-center">
            <p className="mb-1 flex items-center justify-center gap-1.5 text-xs font-medium uppercase tracking-wider text-zinc-500">
              <Coins className="h-3.5 w-3.5" /> Total Volume
            </p>
            <p className="text-2xl font-bold text-emerald-400">
              {bets.reduce((sum, b) => sum + Number(b.totalPot), 0)} STRK
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
