'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { BetCard } from '@/components/BetCard';
import { LoadingSpinner, PageLoading, EmptyState } from '@/components/LoadingSpinner';
import { useWallet } from '@/hooks/useWallet';
import { getAllBets } from '@/lib/contract';
import type { Bet } from '@/types';

export default function DashboardPage() {
  const { isConnected, connectWallet, isLoading: walletLoading, address } = useWallet();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'settled'>('all');

  useEffect(() => {
    if (!isConnected) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function loadBets() {
      setLoading(true);
      try {
        const allBets = await getAllBets();
        if (!cancelled) setBets(allBets);
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
              <h1 className="mb-2 text-2xl font-bold text-white">My Bets</h1>
              <p className="mb-6 text-zinc-500">Sign in to see your bets</p>
              <Button onClick={connectWallet}>
                Sign In
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
          <h1 className="text-3xl font-bold text-white">My Bets</h1>
          <p className="mt-1 text-sm text-zinc-500">Track your active and past predictions</p>
        </div>
        <Link href="/create">
          <Button>+ New Bet</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {(['all', 'active', 'settled'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              filter === f
                ? 'bg-orange-500/10 text-orange-400'
                : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
            }`}
          >
            {f === 'all' ? 'All' : f === 'active' ? '🔴 Active' : '✅ Settled'}
          </button>
        ))}
      </div>

      {/* Bet List */}
      {filteredBets.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="No bets yet"
          description={
            filter === 'all'
              ? "You haven't created or joined any bets yet."
              : `No ${filter} bets found.`
          }
          action={
            <Link href="/create">
              <Button>Create Your First Bet</Button>
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
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-center">
            <p className="text-2xl font-bold text-white">{bets.length}</p>
            <p className="text-xs text-zinc-500">Total Bets</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-center">
            <p className="text-2xl font-bold text-orange-400">
              {bets.filter((b) => !b.settled).length}
            </p>
            <p className="text-xs text-zinc-500">Active</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-center">
            <p className="text-2xl font-bold text-green-400">
              {bets.reduce((sum, b) => sum + Number(b.totalPot), 0)} STRK
            </p>
            <p className="text-xs text-zinc-500">Total Volume</p>
          </div>
        </div>
      )}
    </div>
  );
}
