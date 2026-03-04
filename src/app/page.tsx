'use client';

import Link from 'next/link';
import { Button } from '@/components/Button';
import { CalloutLogo } from '@/components/CalloutLogo';
import { useWallet } from '@/hooks/useWallet';
import { Target, BarChart2, Rocket, Key, Fuel, Coins, TrendingUp } from 'lucide-react';
import { BetCard } from '@/components/BetCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { getAllBetsWithCounts } from '@/lib/contract';
import type { Bet } from '@/types';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const { authenticated, connectWallet, isLoading: walletLoading } = useWallet();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalVolume: 0, totalMarkets: 0, totalTraders: 0 });

  useEffect(() => {
    async function load() {
      try {
        const data = await getAllBetsWithCounts();

        // Calculate global stats
        let volume = 0;
        let traders = new Set<string>();
        data.forEach(b => {
          volume += Number(b.totalPot);
          // In a real app we'd fetch actual unique participants globally here
          // For speed on the frontend, we'll estimate traders uniquely by adding creator
          traders.add(b.creator);
        });

        setStats({
          totalVolume: volume,
          totalMarkets: data.length,
          totalTraders: data.reduce((acc, b) => acc + b.participantCount, 0) // estimate total participation
        });

        // sort by newest, only show live bets
        const liveBets = data.filter((b) => {
          const isExpired = Date.now() > b.deadline * 1000;
          return !b.settled && !isExpired;
        });
        setBets(liveBets.reverse());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
      {/* Hero */}
      <div className="mb-12 flex flex-col items-center">
        <CalloutLogo size={96} className="mb-6 rounded-[2rem] shadow-2xl shadow-blue-500/30" />
        <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
          Call Out Your Friends
        </h1>
        <p className="mx-auto max-w-lg text-lg text-zinc-400">
          Gasless prediction markets for friend groups. Bet STRK tokens on anything — sports,
          dares, pop culture. No wallet setup, no gas fees, just vibes.
        </p>
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        {authenticated ? (
          <>
            <Link href="/create">
              <Button size="lg" className="gap-2">
                <Target className="h-5 w-5" /> Create a Bet
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="gap-2">
                <BarChart2 className="h-5 w-5" /> My Bets
              </Button>
            </Link>
          </>
        ) : (
          <Button size="lg" onClick={connectWallet} disabled={walletLoading} className="gap-2 px-8">
            {walletLoading ? 'Connecting…' : <><Rocket className="h-5 w-5" /> Sign In & Start Trading</>}
          </Button>
        )}
      </div>

      {/* Global Stats */}
      <div className="mt-16 grid grid-cols-3 gap-4 sm:gap-8 border-y border-zinc-800/60 py-8 w-full max-w-3xl px-4">
        <div className="flex flex-col items-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Volume</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200">
              {stats.totalVolume.toFixed(0)}
            </span>
            <span className="text-sm font-bold text-emerald-500/50">STRK</span>
          </div>
        </div>
        <div className="flex flex-col items-center border-x border-zinc-800/60 px-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Markets</p>
          <span className="text-3xl sm:text-4xl font-extrabold text-white">
            {stats.totalMarkets}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Trades</p>
          <span className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">
            {stats.totalTraders}
          </span>
        </div>
      </div>

      {/* Markets Feed */}
      <div className="mt-24 w-full text-left">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
            <TrendingUp className="h-6 w-6 text-blue-400" /> Live Markets
          </h2>
          <Link href="/markets" className="text-sm font-medium text-blue-400 hover:text-blue-300">
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : bets.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-[#0f1423] p-12 text-center">
            <p className="text-zinc-400">No active markets found.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bets.slice(0, 6).map((bet) => (
              <BetCard key={bet.id} bet={bet} />
            ))}
          </div>
        )}
      </div>

      {/* Features */}
      <div className="mt-20 grid gap-6 sm:grid-cols-3">
        <FeatureCard
          icon={<Key className="h-6 w-6 text-blue-400" />}
          title="No Wallet Needed"
          description="Sign in with Google or email. We handle the crypto behind the scenes."
        />
        <FeatureCard
          icon={<Fuel className="h-6 w-6 text-purple-400" />}
          title="Zero Gas Fees"
          description="Gasless transactions powered by AVNU paymaster. You never pay gas."
        />
        <FeatureCard
          icon={<Coins className="h-6 w-6 text-emerald-400" />}
          title="Auto Payout"
          description="Winners get paid automatically. No manual claims, no disputes."
        />
      </div>

      {/* How it works */}
      <div className="mt-20 w-full max-w-2xl">
        <h2 className="mb-8 text-2xl font-bold text-white">How It Works</h2>
        <div className="space-y-4 text-left">
          <Step number={1} title="Create a bet" description="Pick a topic, set two options, choose a stake amount in STRK." />
          <Step number={2} title="Share the link" description="Send the invite link to friends. They sign in and pick a side." />
          <Step number={3} title="Settle & get paid" description="After the event, the creator confirms the winner. STRK is distributed automatically." />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-20 text-xs text-zinc-600">
        Built on{' '}
        <a href="https://starknet.io" target="_blank" className="text-zinc-500 hover:text-zinc-400">
          Starknet
        </a>{' '}
        with{' '}
        <a href="https://starkzap.io" target="_blank" className="text-zinc-500 hover:text-zinc-400">
          Starkzap
        </a>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-left transition hover:border-zinc-700">
      <div className="mb-4 inline-flex rounded-lg bg-zinc-800 p-3">{icon}</div>
      <h3 className="mb-1 text-base font-semibold text-white">{title}</h3>
      <p className="text-sm text-zinc-500">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-4 rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-sm font-bold text-blue-400">
        {number}
      </div>
      <div>
        <h4 className="font-medium text-white">{title}</h4>
        <p className="text-sm text-zinc-500">{description}</p>
      </div>
    </div>
  );
}
