'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useWallet } from '@/hooks/useWallet';
import { createBet, getBetCount } from '@/lib/contract';
import type { CreateBetForm } from '@/types';

export default function CreateBetPage() {
  const router = useRouter();
  const { wallet, isConnected, connectWallet, isLoading: walletLoading } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<CreateBetForm>({
    title: '',
    optionA: '',
    optionB: '',
    stakeAmount: '',
    deadline: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const isFormValid =
    form.title.trim() &&
    form.optionA.trim() &&
    form.optionB.trim() &&
    Number(form.stakeAmount) > 0 &&
    form.deadline;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !isFormValid) return;

    setIsSubmitting(true);
    try {
      const deadlineUnix = Math.floor(new Date(form.deadline).getTime() / 1000);
      const stakeWei = String(BigInt(Math.floor(Number(form.stakeAmount) * 1e18)));

      const tx = await createBet(
        wallet,
        form.title,
        form.optionA,
        form.optionB,
        stakeWei,
        deadlineUnix
      );

      toast.success('Bet created! 🎯');
      // Read bet count to get the new bet's ID
      const betCount = await getBetCount();
      router.push(`/bet/${betCount}`);
    } catch (err: any) {
      console.error('Create bet failed:', err);
      toast.error(err.message || 'Failed to create bet');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get minimum date (now + 1 hour)
  const minDate = new Date(Date.now() + 3600000).toISOString().slice(0, 16);

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Create a Bet</h1>
        <p className="mt-2 text-zinc-500">
          Set up a prediction market. Share the link with friends.
        </p>
      </div>

      {!isConnected ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
          {walletLoading ? (
            <>
              <LoadingSpinner size="md" />
              <p className="mt-4 text-zinc-400">Setting up your wallet...</p>
            </>
          ) : (
            <>
              <p className="mb-4 text-zinc-400">Sign in to create a bet</p>
              <Button onClick={connectWallet}>
                Sign In
              </Button>
            </>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              What are you betting on?
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Will it rain tomorrow?"
              maxLength={100}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-600 outline-none transition focus:border-orange-500"
            />
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-blue-400">Option A</label>
              <input
                name="optionA"
                value={form.optionA}
                onChange={handleChange}
                placeholder="e.g. Yes"
                maxLength={50}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-600 outline-none transition focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-purple-400">Option B</label>
              <input
                name="optionB"
                value={form.optionB}
                onChange={handleChange}
                placeholder="e.g. No"
                maxLength={50}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-600 outline-none transition focus:border-purple-500"
              />
            </div>
          </div>

          {/* Stake Amount */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Stake Amount (STRK per person)
            </label>
            <div className="relative">
              <input
                name="stakeAmount"
                type="number"
                step="0.1"
                min="0.1"
                value={form.stakeAmount}
                onChange={handleChange}
                placeholder="10"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 pr-16 text-white placeholder-zinc-600 outline-none transition focus:border-orange-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                STRK
              </span>
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">Deadline</label>
            <input
              name="deadline"
              type="datetime-local"
              min={minDate}
              value={form.deadline}
              onChange={handleChange}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-orange-500 [color-scheme:dark]"
            />
          </div>

          {/* Submit */}
          <Button type="submit" fullWidth size="lg" disabled={!isFormValid || isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" /> Creating Bet…
              </span>
            ) : (
              '🎯 Create Bet — Gasless'
            )}
          </Button>

          <p className="text-center text-xs text-zinc-600">
            Creating a bet stakes your STRK. Gas is free — powered by AVNU.
          </p>
          <p className="text-center text-xs text-orange-400/70">
            ⚡ As the creator, you automatically bet on Option A.
          </p>
        </form>
      )}
    </div>
  );
}
