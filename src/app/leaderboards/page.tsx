'use client';

import { useState, useEffect } from 'react';
import { LoadingSpinner, EmptyState } from '@/components/LoadingSpinner';
import { getAllBetsWithCounts, getParticipants } from '@/lib/contract';
import type { Bet, Participant } from '@/types';
import { Trophy, Coins, Users, Medal, Search } from 'lucide-react';

interface LeaderboardEntry {
    address: string;
    totalVolume: number;
    marketsJoined: number;
    marketsWon: number;
    netProfit: number; // approximate based on equal split of pot for winners
}

export default function LeaderboardsPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function loadLeaderboard() {
            setLoading(true);
            try {
                // Fetch all bets to calculate aggregate statistics
                const allBets = await getAllBetsWithCounts();

                const statsMap = new Map<string, LeaderboardEntry>();

                const getOrCreateEntry = (address: string) => {
                    const lowerAddr = address.toLowerCase();
                    if (!statsMap.has(lowerAddr)) {
                        statsMap.set(lowerAddr, {
                            address: lowerAddr,
                            totalVolume: 0,
                            marketsJoined: 0,
                            marketsWon: 0,
                            netProfit: 0,
                        });
                    }
                    return statsMap.get(lowerAddr)!;
                };

                // Note: For a production app this would be an indexer backend.
                // For this MVP, we fetch participants of settled bets to build a leaderboard.
                for (const bet of allBets) {
                    if (bet.participantCount > 0) {
                        const participants = await getParticipants(bet.id, bet.participantCount);

                        const stakeNum = Number(bet.stakeAmount) || 0;
                        const winnersCount = participants.filter(p => p.option === bet.winner).length;
                        const payoutPerWinner = bet.settled && winnersCount > 0
                            ? (Number(bet.totalPot) / winnersCount)
                            : 0;

                        for (const p of participants) {
                            const entry = getOrCreateEntry(p.address);
                            entry.marketsJoined += 1;
                            entry.totalVolume += stakeNum;

                            if (bet.settled) {
                                if (p.option === bet.winner) {
                                    entry.marketsWon += 1;
                                    entry.netProfit += (payoutPerWinner - stakeNum);
                                } else {
                                    entry.netProfit -= stakeNum;
                                }
                            }
                        }
                    }
                }

                const sorted = Array.from(statsMap.values()).sort((a, b) => b.netProfit - a.netProfit || b.totalVolume - a.totalVolume);

                if (!cancelled) {
                    setLeaderboard(sorted);
                }
            } catch (err) {
                console.error('Failed to load leaderboard:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        loadLeaderboard();
        return () => { cancelled = true; };
    }, []);

    return (
        <div className="mx-auto max-w-4xl">
            {/* Header */}
            <div className="mb-8 flex flex-col items-center justify-center text-center">
                <div className="inline-flex items-center justify-center rounded-2xl bg-amber-500/10 p-4 mb-4">
                    <Trophy className="h-10 w-10 text-amber-500" />
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Top Traders</h1>
                <p className="text-sm text-zinc-500 max-w-md">
                    Rankings are based on total profit from settled markets. Only wallets with activity will appear here.
                </p>
            </div>

            {loading ? (
                <div className="flex min-h-[40vh] items-center justify-center">
                    <LoadingSpinner size="lg" />
                </div>
            ) : leaderboard.length === 0 ? (
                <EmptyState
                    icon={<Search className="h-12 w-12 text-zinc-500" />}
                    title="No traders found"
                    description="It looks like no one has placed any bets yet. Be the first to make a prediction!"
                />
            ) : (
                <div className="rounded-3xl border border-zinc-800/60 bg-[#0f1423] overflow-hidden shadow-2xl">
                    <div className="grid grid-cols-12 gap-4 border-b border-zinc-800/60 bg-zinc-900/50 p-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        <div className="col-span-1 text-center">Rank</div>
                        <div className="col-span-5">Trader</div>
                        <div className="col-span-2 text-right hidden sm:block">Win Rate</div>
                        <div className="col-span-2 text-right hidden sm:block">Volume</div>
                        <div className="col-span-4 sm:col-span-2 text-right">Profit / Loss</div>
                    </div>

                    <div className="divide-y divide-zinc-800/60">
                        {leaderboard.map((trader, idx) => {
                            const isTop3 = idx < 3;
                            const winRate = trader.marketsJoined > 0
                                ? Math.round((trader.marketsWon / trader.marketsJoined) * 100)
                                : 0;
                            const profitColor = trader.netProfit > 0
                                ? 'text-emerald-400'
                                : trader.netProfit < 0
                                    ? 'text-rose-400'
                                    : 'text-zinc-500';

                            return (
                                <div key={trader.address} className="grid grid-cols-12 gap-4 items-center p-4 transition-colors hover:bg-zinc-800/20">
                                    <div className="col-span-1 flex justify-center">
                                        {idx === 0 ? <Medal className="h-6 w-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" /> :
                                            idx === 1 ? <Medal className="h-6 w-6 text-zinc-300 drop-shadow-[0_0_8px_rgba(212,212,216,0.4)]" /> :
                                                idx === 2 ? <Medal className="h-6 w-6 text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.5)]" /> :
                                                    <span className="text-sm font-bold text-zinc-500">{idx + 1}</span>}
                                    </div>

                                    <div className="col-span-5 flex items-center gap-3">
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${isTop3 ? 'border-amber-500/30 bg-amber-500/10' : 'border-zinc-700 bg-zinc-800'} font-mono text-sm font-bold text-white shadow-inner`}>
                                            {trader.address.slice(2, 4).toUpperCase()}
                                        </div>
                                        <div>
                                            <span className="font-mono text-sm font-medium text-zinc-200">
                                                0x{trader.address.slice(2, 6)}…{trader.address.slice(-4)}
                                            </span>
                                            <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5 sm:hidden">
                                                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {trader.marketsJoined}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-2 text-right hidden sm:block">
                                        <span className="text-sm font-medium text-zinc-300">{winRate}%</span>
                                        <p className="text-[10px] text-zinc-500">{trader.marketsWon} / {trader.marketsJoined} Won</p>
                                    </div>

                                    <div className="col-span-2 text-right hidden sm:block">
                                        <span className="font-mono text-sm font-medium text-zinc-300">{trader.totalVolume.toFixed(2)}</span>
                                        <p className="text-[10px] text-zinc-500">STRK</p>
                                    </div>

                                    <div className="col-span-4 sm:col-span-2 text-right">
                                        <span className={`font-mono text-sm font-bold ${profitColor}`}>
                                            {trader.netProfit > 0 ? '+' : ''}{trader.netProfit.toFixed(2)}
                                        </span>
                                        <p className="text-[10px] text-zinc-500">STRK</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
