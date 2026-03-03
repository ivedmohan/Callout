'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { Flame } from 'lucide-react';

export function Navbar() {
  const { authenticated, address, isConnected, isLoading, balance, connectWallet, disconnectWallet } =
    useWallet();
  const [copied, setCopied] = useState(false);

  const shortAddress = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '';

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 dark:bg-blue-500 text-white"><Flame className="h-5 w-5" /></div>
          <span className="text-xl font-bold text-white">Callout</span>
        </Link>

        {/* Nav Links */}
        <div className="hidden items-center gap-6 sm:flex">
          <Link href="/create" className="text-sm text-zinc-400 transition hover:text-white">
            Create Bet
          </Link>
          <Link href="/dashboard" className="text-sm text-zinc-400 transition hover:text-white">
            My Bets
          </Link>
        </div>

        {/* Wallet */}
        <div>
          {isConnected ? (
            <div className="flex items-center gap-2">
              {/* STRK Balance */}
              {balance !== null && (
                <span className="hidden rounded-full bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-400 sm:block">
                  {balance} STRK
                </span>
              )}
              {/* Address + Copy */}
              <button
                onClick={copyAddress}
                title={copied ? 'Copied!' : 'Copy address'}
                className="hidden items-center gap-1.5 rounded-full bg-zinc-800 px-3 py-1.5 text-xs font-mono text-zinc-300 transition hover:bg-zinc-700 sm:flex"
              >
                {shortAddress}
                <span className="text-[10px]">{copied ? '✓' : '📋'}</span>
              </button>
              <button
                onClick={disconnectWallet}
                className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-700"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isLoading}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600 disabled:opacity-50"
            >
              {isLoading ? 'Connecting…' : 'Sign In'}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
