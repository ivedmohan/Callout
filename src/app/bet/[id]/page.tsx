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
import { CheckCircle2, Clock, CircleDot, Trophy, Copy, Coins, Users, AlertCircle } from 'lucide-react';

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
  if (notFound || !bet) return <EmptyState icon={<AlertCircle className="h-12 w-12 text-zinc-500 mb-4 mx-auto" />} title="Market not found" description="This market doesn't exist or has been removed." />;

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
        <div className="mb-3 flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${bet.settled
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : isExpired
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}
          >
            {bet.settled ? <><CheckCircle2 className="h-3 w-3" /> Settled</> : isExpired ? <><Clock className="h-3 w-3" /> Expired</> : <><CircleDot className="h-3 w-3" /> Live</>}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">{bet.title}</h1>
        <p className="mt-3 text-sm font-medium text-zinc-500">
          Created by {bet.creator.slice(0, 6)}…{bet.creator.slice(-4)} · Deadline: {deadlineDate}
        </p>
      </div>

      {/* Options & Voting */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <OptionCard
          label="Yes"
          name={bet.optionA}
          count={optionACounts}
          total={participants.length}
          isWinner={bet.settled && bet.winner === 'A'}
          isSelected={selectedOption === 'A'}
          onClick={() => canJoin && setSelectedOption('A')}
          disabled={!canJoin}
          color="emerald"
        />
        <OptionCard
          label="No"
          name={bet.optionB}
          count={optionBCounts}
          total={participants.length}
          isWinner={bet.settled && bet.winner === 'B'}
          isSelected={selectedOption === 'B'}
          onClick={() => canJoin && setSelectedOption('B')}
          disabled={!canJoin}
          color="rose"
        />
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatBox label="Stake" value={`${bet.stakeAmount} STRK`} icon={<Coins className="h-4 w-4 text-blue-400" />} />
        <StatBox label="Total Pot" value={`${bet.totalPot} STRK`} icon={<Coins className="h-4 w-4 text-emerald-400" />} />
        <StatBox label="Traders" value={String(bet.participantCount)} icon={<Users className="h-4 w-4 text-zinc-400" />} />
      </div>

      {/* Actions / Order Slip */}
      <div className="mb-8 rounded-2xl border border-zinc-800/60 bg-[#0f1423] p-5 shadow-xl sm:p-6 sm:static fixed bottom-16 left-0 right-0 z-40 sm:z-auto sm:border sm:rounded-2xl rounded-t-3xl border-t border-zinc-800">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400 hidden sm:block">Order Slip</h3>
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
          <Button fullWidth size="lg" onClick={handleJoin} disabled={isJoining} className="shadow-lg shadow-blue-500/20">
            {isJoining ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" /> Staking…
              </span>
            ) : (
              <span className="flex justify-between items-center w-full px-2">
                <span>Buy {selectedOption === 'A' ? 'Yes' : 'No'}</span>
                <span className="font-mono">{bet.stakeAmount} STRK</span>
              </span>
            )}
          </Button>
        )}

        {canJoin && !selectedOption && (
          <div className="flex h-12 items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-800/20 text-sm text-zinc-500">
            Select an outcome to trade
          </div>
        )}

        {hasJoined && !bet.settled && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm font-medium text-emerald-400">
            <CheckCircle2 className="h-4 w-4" /> Position: {myParticipation?.option === 'A' ? 'Yes' : 'No'}
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
                className="hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400"
              >
                {isSettling ? <LoadingSpinner size="sm" /> : <><Trophy className="h-4 w-4 mr-2" /> Yes Wins</>}
              </Button>
              <Button
                fullWidth
                variant="secondary"
                onClick={() => handleSettle('B')}
                disabled={isSettling}
                className="hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-400"
              >
                {isSettling ? <LoadingSpinner size="sm" /> : <><Trophy className="h-4 w-4 mr-2" /> No Wins</>}
              </Button>
            </div>
          </div>
        )}

        {canClaim && (
          <Button fullWidth size="lg" onClick={handleClaim} disabled={isClaiming} className="shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500 text-white">
            {isClaiming ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" /> Claiming…
              </span>
            ) : (
              <><Coins className="h-5 w-5 mr-2" /> Claim Winnings</>
            )}
          </Button>
        )}
      </div>

      {/* Share */}
      <div className="mb-8">
        <Button fullWidth variant="secondary" onClick={copyShareLink} className="gap-2">
          <Copy className="h-4 w-4" /> Copy Share Link
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
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${p.option === 'A' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}
                >
                  {p.option === 'A' ? 'Yes' : 'No'}
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
  color: 'emerald' | 'rose';
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const colorClasses = color === 'emerald'
    ? { border: 'border-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-500', bar: 'bg-emerald-500' }
    : { border: 'border-rose-500', bg: 'bg-rose-500/10', text: 'text-rose-500', bar: 'bg-rose-500' };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden rounded-2xl border p-5 text-left transition-all ${isWinner
          ? `border-${color}-500 bg-${color}-500/10 shadow-lg shadow-${color}-500/10`
          : isSelected
            ? `${colorClasses.border} ${colorClasses.bg} shadow-md shadow-${color}-500/5`
            : 'border-zinc-800/60 bg-[#13192b] hover:border-zinc-700 hover:bg-[#1a2136]'
        } ${disabled && !isWinner ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'} ${!disabled && !isSelected && 'hover:-translate-y-0.5'}`}
    >
      {isWinner && (
        <Trophy className={`absolute right-3 top-3 h-5 w-5 ${colorClasses.text}`} />
      )}
      <span className={`text-xs font-bold uppercase tracking-wider ${colorClasses.text}`}>{label}</span>
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

function StatBox({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/60 bg-[#13192b] p-3 transition hover:border-zinc-700">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-base font-bold tracking-tight text-white">{value}</span>
    </div>
  );
}
