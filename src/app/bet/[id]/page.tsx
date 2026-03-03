'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { Button } from '@/components/Button';
import { LoadingSpinner, PageLoading, EmptyState } from '@/components/LoadingSpinner';
import { useWallet } from '@/hooks/useWallet';
import { joinBet, settleBet, claimPayout, getBet, getParticipants } from '@/lib/contract';
import type { Bet, BetOption, Participant } from '@/types';
import { EXPLORER_URL } from '@/lib/constants';

export default function BetPage() {
  const params = useParams();
  const betId = params.id as string;
  const { wallet, address, isConnected, connectWallet, isLoading: walletLoading } = useWallet();

  const [bet, setBet] = useState<Bet | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedOption, setSelectedOption] = useState<BetOption | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Load bet data from chain
  useEffect(() => {
    let cancelled = false;
    async function loadBet() {
      setLoading(true);
      try {
        const betData = await getBet(betId);
        if (cancelled) return;
        if (!betData) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setBet(betData);
        const parts = await getParticipants(betId, betData.participantCount);
        if (!cancelled) setParticipants(parts);
      } catch (err) {
        console.error('Failed to load bet:', err);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadBet();
    return () => { cancelled = true; };
  }, [betId]);

  if (loading) return <PageLoading />;
  if (notFound || !bet) return <EmptyState icon="🤷" title="Bet not found" description="This bet doesn't exist or has been removed." />;

  // Normalize addresses for comparison (lowercase, strip leading zeros after 0x)
  const normalize = (addr: string) => {
    if (!addr) return '';
    const hex = addr.toLowerCase().replace(/^0x0*/, '');
    return '0x' + hex;
  };
  const myAddr = address ? normalize(address) : '';
  const isCreator = myAddr && normalize(bet.creator) === myAddr;
  const isExpired = Date.now() > bet.deadline * 1000;
  const hasJoined = myAddr && participants.some((p) => normalize(p.address) === myAddr);
  const canJoin = !bet.settled && !isExpired && !hasJoined && isConnected;
  const canSettle = isCreator && !bet.settled;
  const myParticipation = myAddr
    ? participants.find((p) => normalize(p.address) === myAddr)
    : null;
  const didWin = bet.settled && myParticipation && myParticipation.option === bet.winner;
  const canClaim = didWin && !myParticipation?.hasClaimed;

  const deadlineDate = new Date(bet.deadline * 1000).toLocaleString();
  const optionACounts = participants.filter((p) => p.option === 'A').length;
  const optionBCounts = participants.filter((p) => p.option === 'B').length;

  const handleJoin = async () => {
    if (!wallet || !selectedOption) return;
    setIsJoining(true);
    try {
      const stakeWei = String(BigInt(Math.floor(Number(bet.stakeAmount) * 1e18)));
      await joinBet(wallet, betId, selectedOption, stakeWei);
      toast.success(`Joined bet with Option ${selectedOption}! 🎉`);
      setParticipants((prev) => [
        ...prev,
        { address: address!, option: selectedOption, hasClaimed: false },
      ]);
    } catch (err: any) {
      toast.error(err.message || 'Failed to join bet');
    } finally {
      setIsJoining(false);
    }
  };

  const handleSettle = async (winner: BetOption) => {
    if (!wallet) return;
    setIsSettling(true);
    try {
      await settleBet(wallet, betId, winner);
      toast.success('Bet settled! 🏆');
      setBet((prev) => (prev ? { ...prev, settled: true, winner } : null));
    } catch (err: any) {
      toast.error(err.message || 'Failed to settle bet');
    } finally {
      setIsSettling(false);
    }
  };

  const handleClaim = async () => {
    if (!wallet) return;
    setIsClaiming(true);
    try {
      await claimPayout(wallet, betId);
      toast.success('Payout claimed! 💰');
    } catch (err: any) {
      toast.error(err.message || 'Failed to claim payout');
    } finally {
      setIsClaiming(false);
    }
  };

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/bet/${betId}` : '';

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied! 📋');
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Bet Header */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              bet.settled
                ? 'bg-green-500/10 text-green-400'
                : isExpired
                  ? 'bg-red-500/10 text-red-400'
                  : 'bg-orange-500/10 text-orange-400'
            }`}
          >
            {bet.settled ? '✅ Settled' : isExpired ? '⏰ Expired' : '🔴 Live'}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white">{bet.title}</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Created by {bet.creator.slice(0, 6)}…{bet.creator.slice(-4)} · Deadline: {deadlineDate}
        </p>
      </div>

      {/* Options & Voting */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <OptionCard
          label="A"
          name={bet.optionA}
          count={optionACounts}
          total={participants.length}
          isWinner={bet.settled && bet.winner === 'A'}
          isSelected={selectedOption === 'A'}
          onClick={() => canJoin && setSelectedOption('A')}
          disabled={!canJoin}
          color="blue"
        />
        <OptionCard
          label="B"
          name={bet.optionB}
          count={optionBCounts}
          total={participants.length}
          isWinner={bet.settled && bet.winner === 'B'}
          isSelected={selectedOption === 'B'}
          onClick={() => canJoin && setSelectedOption('B')}
          disabled={!canJoin}
          color="purple"
        />
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatBox label="Stake" value={`${bet.stakeAmount} STRK`} />
        <StatBox label="Total Pot" value={`${bet.totalPot} STRK`} />
        <StatBox label="Participants" value={String(bet.participantCount)} />
      </div>

      {/* Actions */}
      <div className="mb-6 space-y-3">
        {!isConnected && (
          walletLoading ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <LoadingSpinner size="sm" />
              <span className="text-sm text-zinc-400">Connecting wallet...</span>
            </div>
          ) : (
            <Button fullWidth size="lg" onClick={connectWallet}>
              Sign In to Join
            </Button>
          )
        )}

        {canJoin && selectedOption && (
          <Button fullWidth size="lg" onClick={handleJoin} disabled={isJoining}>
            {isJoining ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" /> Joining…
              </span>
            ) : (
              `🎲 Join — Stake ${bet.stakeAmount} STRK on Option ${selectedOption}`
            )}
          </Button>
        )}

        {canJoin && !selectedOption && (
          <p className="text-center text-sm text-zinc-500">👆 Pick an option above to join</p>
        )}

        {hasJoined && !bet.settled && (
          <div className="rounded-lg bg-zinc-800/50 p-3 text-center text-sm text-zinc-400">
            ✅ You&apos;ve joined this bet with Option {myParticipation?.option}
          </div>
        )}

        {canSettle && (
          <div className="space-y-2">
            <p className="text-center text-sm font-medium text-zinc-300">
              You&apos;re the creator — settle this bet:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                fullWidth
                variant="secondary"
                onClick={() => handleSettle('A')}
                disabled={isSettling}
              >
                {isSettling ? <LoadingSpinner size="sm" /> : `🏆 ${bet.optionA} Wins`}
              </Button>
              <Button
                fullWidth
                variant="secondary"
                onClick={() => handleSettle('B')}
                disabled={isSettling}
              >
                {isSettling ? <LoadingSpinner size="sm" /> : `🏆 ${bet.optionB} Wins`}
              </Button>
            </div>
          </div>
        )}

        {canClaim && (
          <Button fullWidth size="lg" onClick={handleClaim} disabled={isClaiming}>
            {isClaiming ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" /> Claiming…
              </span>
            ) : (
              '💰 Claim Your Winnings'
            )}
          </Button>
        )}
      </div>

      {/* Share */}
      <div className="mb-6">
        <Button fullWidth variant="secondary" onClick={copyShareLink}>
          📋 Copy Invite Link
        </Button>
      </div>

      {/* Participants */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="mb-3 text-sm font-medium text-zinc-400">Participants</h3>
        {participants.length === 0 ? (
          <p className="text-sm text-zinc-600">No participants yet</p>
        ) : (
          <div className="space-y-2">
            {participants.map((p, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2">
                <span className="font-mono text-xs text-zinc-400">{p.address}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.option === 'A' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                  }`}
                >
                  {p.option === 'A' ? bet.optionA : bet.optionB}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───

function OptionCard({
  label,
  name,
  count,
  total,
  isWinner,
  isSelected,
  onClick,
  disabled,
  color,
}: {
  label: string;
  name: string;
  count: number;
  total: number;
  isWinner: boolean;
  isSelected: boolean;
  onClick: () => void;
  disabled: boolean;
  color: 'blue' | 'purple';
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const colorClasses = color === 'blue'
    ? { border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400', bar: 'bg-blue-500' }
    : { border: 'border-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-400', bar: 'bg-purple-500' };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden rounded-xl border p-5 text-left transition ${
        isWinner
          ? 'border-green-500 bg-green-500/5'
          : isSelected
            ? `${colorClasses.border} ${colorClasses.bg}`
            : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
      } ${disabled && !isWinner ? 'cursor-default' : 'cursor-pointer'}`}
    >
      {isWinner && (
        <span className="absolute right-2 top-2 text-lg">🏆</span>
      )}
      <span className={`text-xs font-medium ${colorClasses.text}`}>Option {label}</span>
      <h4 className="mt-1 text-lg font-semibold text-white">{name}</h4>
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs text-zinc-500">
          <span>{count} votes</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-zinc-800">
          <div
            className={`h-full rounded-full transition-all ${colorClasses.bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </button>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-center">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
