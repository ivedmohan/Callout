/**
 * Contract interaction helpers for the BetEscrow contract.
 *
 * Wraps wallet.execute() calls with typed interfaces,
 * plus RpcProvider.callContract() for reads.
 */

import { type Call, RpcProvider, type CallData } from 'starknet';
import { CONTRACT_ADDRESS, RPC_URL } from './constants';
import type { Bet, BetOption, Participant } from '@/types';

// ─── felt252 encoding ───

/** Max bytes a felt252 can hold (< 2^251, so 31 ASCII bytes). */
export const FELT252_MAX_BYTES = 31;

/**
 * Encode a JS string as a felt252 hex value.
 * Truncates to 31 bytes to fit in a single felt252.
 */
export function stringToFeltHex(str: string): string {
  const truncated = str.slice(0, FELT252_MAX_BYTES);
  let hex = '0x';
  for (let i = 0; i < truncated.length; i++) {
    hex += truncated.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return hex;
}

// ─── Build contract calls ───

export function buildCreateBetCall(
  title: string,
  optionA: string,
  optionB: string,
  stakeAmount: string,
  deadline: number
): Call {
  return {
    contractAddress: CONTRACT_ADDRESS,
    entrypoint: 'create_bet',
    calldata: [
      stringToFeltHex(title),
      stringToFeltHex(optionA),
      stringToFeltHex(optionB),
      stakeAmount,
      '0',
      String(deadline),
    ],
  };
}

export function buildJoinBetCall(betId: string, option: BetOption): Call {
  return {
    contractAddress: CONTRACT_ADDRESS,
    entrypoint: 'join_bet',
    calldata: [betId, option === 'A' ? '0' : '1'],
  };
}

export function buildSettleBetCall(betId: string, winningOption: BetOption): Call {
  return {
    contractAddress: CONTRACT_ADDRESS,
    entrypoint: 'settle_bet',
    calldata: [betId, winningOption === 'A' ? '0' : '1'],
  };
}

export function buildClaimPayoutCall(betId: string): Call {
  return {
    contractAddress: CONTRACT_ADDRESS,
    entrypoint: 'claim_payout',
    calldata: [betId],
  };
}

// ─── Approve STRK for contract (ERC20 approve) ───

import { STRK_TOKEN_ADDRESS } from './constants';

export function buildApproveSTRKCall(amount: string): Call {
  return {
    contractAddress: STRK_TOKEN_ADDRESS,
    entrypoint: 'approve',
    calldata: [CONTRACT_ADDRESS, amount, '0'], // u256 = (low, high)
  };
}

// ─── Execute helpers (use with wallet from Starkzap) ───

export async function createBet(
  wallet: any,
  title: string,
  optionA: string,
  optionB: string,
  stakeAmount: string,
  deadline: number
) {
  const approveCall = buildApproveSTRKCall(stakeAmount);
  const createCall = buildCreateBetCall(title, optionA, optionB, stakeAmount, deadline);

  const tx = await wallet.execute([approveCall, createCall], { feeMode: 'sponsored' });
  await tx.wait();
  return tx;
}

export async function joinBet(wallet: any, betId: string, option: BetOption, stakeAmount: string) {
  const approveCall = buildApproveSTRKCall(stakeAmount);
  const joinCall = buildJoinBetCall(betId, option);

  const tx = await wallet.execute([approveCall, joinCall], { feeMode: 'sponsored' });
  await tx.wait();
  return tx;
}

export async function settleBet(wallet: any, betId: string, winningOption: BetOption) {
  const settleCall = buildSettleBetCall(betId, winningOption);

  const tx = await wallet.execute([settleCall], { feeMode: 'sponsored' });
  await tx.wait();
  return tx;
}

export async function claimPayout(wallet: any, betId: string) {
  const claimCall = buildClaimPayoutCall(betId);

  const tx = await wallet.execute([claimCall], { feeMode: 'sponsored' });
  await tx.wait();
  return tx;
}

// ─── RPC Provider for reads ───

let _provider: RpcProvider | null = null;
function getProvider(): RpcProvider {
  if (!_provider) {
    _provider = new RpcProvider({ nodeUrl: RPC_URL });
  }
  return _provider;
}

// ─── Read helpers ───

function feltToString(felt: string): string {
  // Convert felt252 hex to short string (Cairo short strings)
  if (!felt || felt === '0x0' || felt === '0') return '';
  const hex = felt.startsWith('0x') ? felt.slice(2) : BigInt(felt).toString(16);
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.substring(i, i + 2), 16);
    if (code === 0) break;
    str += String.fromCharCode(code);
  }
  return str;
}

function u256FromPair(low: string, high: string): bigint {
  return BigInt(low) + (BigInt(high) << BigInt(128));
}

function formatSTRK(weiAmount: bigint): string {
  const strk = Number(weiAmount) / 1e18;
  // Show up to 4 decimal places, strip trailing zeros
  return strk.toFixed(4).replace(/\.?0+$/, '') || '0';
}

// ─── Caching Layer ───
const CACHE_TTL = 10000; // 10 seconds for live data
const betCache = new Map<string, { data: Bet; ts: number; inFlight: Promise<Bet | null> | null }>();
const participantsCache = new Map<string, { data: Participant[]; ts: number; inFlight: Promise<Participant[]> | null }>();
const betCountCache = { data: 0, ts: 0, inFlight: null as Promise<number> | null };

export async function getBet(betId: string): Promise<Bet | null> {
  const cached = betCache.get(betId);
  const now = Date.now();

  // Return cache if it is fresh OR if the bet is settled (settled bets never change)
  if (cached && (cached.data.settled || now - cached.ts < CACHE_TTL)) {
    return cached.data;
  }
  // Return in-flight promise if deduplicating concurrent requests
  if (cached?.inFlight) return cached.inFlight;

  const promise = (async () => {
    try {
      const provider = getProvider();
      const result = await provider.callContract({
        contractAddress: CONTRACT_ADDRESS,
        entrypoint: 'get_bet',
        calldata: [betId],
      });

      // Struct layout: id, creator, title, option_a, option_b,
      //   stake_amount (u256: low, high), deadline, settled, winning_option,
      //   total_pot (u256: low, high), participant_count
      const r = result;
      if (!r || r.length < 12) return null;

      const id = BigInt(r[0]).toString();
      if (id === '0') return null; // bet doesn't exist

      const creator = r[1];
      const title = feltToString(r[2]);
      const optionA = feltToString(r[3]);
      const optionB = feltToString(r[4]);
      const stakeWei = u256FromPair(r[5], r[6]);
      const deadline = Number(BigInt(r[7]));
      const settled = BigInt(r[8]) !== BigInt(0);
      const winningOption = Number(BigInt(r[9]));
      const totalPotWei = u256FromPair(r[10], r[11]);
      const participantCount = Number(BigInt(r[12]));

      const newBet: Bet = {
        id,
        creator,
        title: title || `Bet #${id}`,
        optionA: optionA || 'Option A',
        optionB: optionB || 'Option B',
        stakeAmount: formatSTRK(stakeWei),
        deadline,
        settled,
        winner: settled ? (winningOption === 0 ? 'A' : 'B') : null,
        totalPot: formatSTRK(totalPotWei),
        participantCount,
      };

      betCache.set(betId, { data: newBet, ts: Date.now(), inFlight: null });
      return newBet;

    } catch (err) {
      console.error('getBet failed:', err);
      return null;
    } finally {
      const c = betCache.get(betId);
      if (c) c.inFlight = null;
    }
  })();

  const existing = betCache.get(betId);
  betCache.set(betId, { data: existing?.data as Bet, ts: existing?.ts || 0, inFlight: promise });
  return promise;
}

export async function getParticipant(betId: string, index: number): Promise<Participant | null> {
  try {
    const provider = getProvider();
    const result = await provider.callContract({
      contractAddress: CONTRACT_ADDRESS,
      entrypoint: 'get_participant',
      calldata: [betId, String(index)],
    });

    if (!result || result.length < 3) return null;

    const address = result[0];
    const option = Number(BigInt(result[1]));
    const hasClaimed = BigInt(result[2]) !== BigInt(0);

    return {
      address,
      option: option === 0 ? 'A' : 'B',
      hasClaimed,
    };
  } catch (err) {
    console.error(`getParticipant(${betId}, ${index}) failed:`, err);
    return null;
  }
}

export async function getParticipants(betId: string, count: number): Promise<Participant[]> {
  const cached = participantsCache.get(betId);
  const now = Date.now();

  const bet = betCache.get(betId)?.data;
  const isSettled = bet?.settled;

  if (cached && (isSettled || now - cached.ts < CACHE_TTL)) {
    // Only return cache if we cached at least `count` participants 
    // (in case a new participant joined and count increased)
    if (cached.data.length >= count) {
      return cached.data;
    }
  }
  if (cached?.inFlight) return cached.inFlight;

  const promise = (async () => {
    try {
      const promises = [];
      for (let i = 0; i < count; i++) {
        promises.push(getParticipant(betId, i));
      }
      const results = await Promise.all(promises);
      const valid = results.filter((p): p is Participant => p !== null);

      participantsCache.set(betId, { data: valid, ts: Date.now(), inFlight: null });
      return valid;
    } finally {
      const c = participantsCache.get(betId);
      if (c) c.inFlight = null;
    }
  })();

  const existing = participantsCache.get(betId);
  participantsCache.set(betId, { data: existing?.data || [], ts: existing?.ts || 0, inFlight: promise });
  return promise;
}

export async function getBetCount(): Promise<number> {
  const now = Date.now();
  if (now - betCountCache.ts < CACHE_TTL && betCountCache.data > 0) return betCountCache.data;
  if (betCountCache.inFlight) return betCountCache.inFlight;

  const promise = (async () => {
    try {
      const provider = getProvider();
      const result = await provider.callContract({
        contractAddress: CONTRACT_ADDRESS,
        entrypoint: 'get_bet_count',
        calldata: [],
      });
      const count = Number(BigInt(result[0]));
      betCountCache.data = count;
      betCountCache.ts = Date.now();
      return count;
    } catch (err) {
      console.error('getBetCount failed:', err);
      return 0;
    } finally {
      betCountCache.inFlight = null;
    }
  })();

  betCountCache.inFlight = promise;
  return promise;
}

export async function getAllBets(): Promise<Bet[]> {
  const count = await getBetCount();
  const promises = [];
  for (let i = 1; i <= count; i++) {
    promises.push(getBet(String(i)));
  }
  const results = await Promise.all(promises);
  return results.filter((b): b is Bet => b !== null);
}

/**
 * Fetches all bets WITH per-option participant counts.
 * Slightly slower than getAllBets since it also fetches participants.
 */
export async function getAllBetsWithCounts(): Promise<Bet[]> {
  const count = await getBetCount();
  const promises = [];
  for (let i = 1; i <= count; i++) {
    promises.push(getBet(String(i)));
  }
  const results = await Promise.all(promises);
  const validBets = results.filter((b): b is Bet => b !== null);

  const participantsPromises = validBets.map(bet => getParticipants(bet.id, bet.participantCount));
  const participantsResults = await Promise.all(participantsPromises);

  validBets.forEach((bet, index) => {
    const participants = participantsResults[index];
    bet.optionACount = participants.filter((p) => p.option === 'A').length;
    bet.optionBCount = participants.filter((p) => p.option === 'B').length;
  });

  return validBets;
}

/**
 * Fetches all bets the specified user has either created or participated in.
 */
export async function getUserBets(userAddress: string): Promise<Bet[]> {
  if (!userAddress) return [];
  const count = await getBetCount();

  const normalizedUser = userAddress.toLowerCase().replace(/^0x0*/, '');

  const betPromises = [];
  for (let i = 1; i <= count; i++) {
    betPromises.push(getBet(String(i)));
  }
  const betsResult = await Promise.all(betPromises);
  const validBets = betsResult.filter((b): b is Bet => b !== null);

  const participantsPromises = validBets.map(bet => getParticipants(bet.id, bet.participantCount));
  const participantsResults = await Promise.all(participantsPromises);

  const userBets: Bet[] = [];

  validBets.forEach((bet, index) => {
    const participants = participantsResults[index];
    const creatorNormalized = bet.creator.toLowerCase().replace(/^0x0*/, '');
    const isCreator = creatorNormalized === normalizedUser;
    const isParticipant = participants.some(p => p.address.toLowerCase().replace(/^0x0*/, '') === normalizedUser);

    if (isCreator || isParticipant) {
      bet.optionACount = participants.filter((p) => p.option === 'A').length;
      bet.optionBCount = participants.filter((p) => p.option === 'B').length;
      userBets.push(bet);
    }
  });

  return userBets;
}

// ─── STRK balance read ───

export async function getSTRKBalance(address: string): Promise<string> {
  try {
    const provider = getProvider();
    const result = await provider.callContract({
      contractAddress: STRK_TOKEN_ADDRESS,
      entrypoint: 'balanceOf',
      calldata: [address],
    });
    // u256 = (low, high)
    const balance = u256FromPair(result[0], result[1] || '0');
    return formatSTRK(balance);
  } catch (err) {
    console.error('getSTRKBalance failed:', err);
    return '0';
  }
}
