'use client';

import Link from 'next/link';
import { Button } from '@/components/Button';
import { useWallet } from '@/hooks/useWallet';

export default function HomePage() {
  const { authenticated, connectWallet, isLoading } = useWallet();

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
      {/* Hero */}
      <div className="mb-12">
        <span className="mb-4 inline-block text-6xl">🔥</span>
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
              <Button size="lg">🎯 Create a Bet</Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="secondary">
                📊 My Bets
              </Button>
            </Link>
          </>
        ) : (
          <Button size="lg" onClick={connectWallet} disabled={isLoading}>
            {isLoading ? 'Connecting…' : '🚀 Get Started — Sign In Free'}
          </Button>
        )}
      </div>

      {/* Features */}
      <div className="mt-20 grid gap-6 sm:grid-cols-3">
        <FeatureCard
          emoji="🔑"
          title="No Wallet Needed"
          description="Sign in with Google or email. We handle the crypto behind the scenes."
        />
        <FeatureCard
          emoji="⛽"
          title="Zero Gas Fees"
          description="Gasless transactions powered by AVNU paymaster. You never pay gas."
        />
        <FeatureCard
          emoji="💰"
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

function FeatureCard({ emoji, title, description }: { emoji: string; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-left transition hover:border-zinc-700">
      <span className="mb-3 block text-3xl">{emoji}</span>
      <h3 className="mb-1 text-base font-semibold text-white">{title}</h3>
      <p className="text-sm text-zinc-500">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-4 rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-sm font-bold text-orange-400">
        {number}
      </div>
      <div>
        <h4 className="font-medium text-white">{title}</h4>
        <p className="text-sm text-zinc-500">{description}</p>
      </div>
    </div>
  );
}
