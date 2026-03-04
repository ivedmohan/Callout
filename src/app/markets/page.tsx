'use client';

import { useState, useEffect } from 'react';
import { BetCard } from '@/components/BetCard';
import { LoadingSpinner, EmptyState } from '@/components/LoadingSpinner';
import { getAllBets } from '@/lib/contract';
import type { Bet } from '@/types';
import { Target, Activity, CheckCircle2, BarChart2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/Button';

export default function MarketsPage() {
    const [bets, setBets] = useState<Bet[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'settled'>('all');

    useEffect(() => {
        let cancelled = false;
        async function loadBets() {
            setLoading(true);
            try {
                const allBets = await getAllBets();
                if (!cancelled) setBets(allBets.reverse());
            } catch (err) {
                console.error('Failed to load bets:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        loadBets();
        return () => { cancelled = true; };
    }, []);

    const filteredBets = bets.filter((b) => {
        const isExpired = Date.now() > b.deadline * 1000;
        if (filter === 'active') return !b.settled && !isExpired;
        if (filter === 'settled') return b.settled || isExpired;
        return true;
    });

    return (
        <div className="mx-auto max-w-5xl">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">Markets</h1>
                    <p className="text-sm text-zinc-500">Browse all prediction markets</p>
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
                        {f === 'all' ? 'All Markets' : f === 'active' ? 'Live' : 'Settled'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex min-h-[40vh] items-center justify-center">
                    <LoadingSpinner size="lg" />
                </div>
            ) : filteredBets.length === 0 ? (
                <EmptyState
                    icon={<Target className="h-12 w-12 text-zinc-500" />}
                    title="No markets found"
                    description={
                        filter === 'all'
                            ? "There are no prediction markets yet."
                            : `No ${filter} markets found.`
                    }
                    action={
                        <Link href="/create">
                            <Button className="mt-2 gap-2">
                                <Target className="h-4 w-4" /> Create First Market
                            </Button>
                        </Link>
                    }
                />
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredBets.map((bet) => (
                        <BetCard key={bet.id} bet={bet} />
                    ))}
                </div>
            )}
        </div>
    );
}
