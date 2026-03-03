// ─── Bet Types ───

export type BetOption = 'A' | 'B';

export type BetStatus = 'open' | 'settled' | 'expired';

export interface Bet {
  id: string;
  creator: string;
  title: string;
  optionA: string;
  optionB: string;
  stakeAmount: string; // STRK amount as string (e.g., "10")
  deadline: number; // Unix timestamp
  settled: boolean;
  winner: BetOption | null;
  totalPot: string;
  participantCount: number;
}

export interface Participant {
  address: string;
  option: BetOption;
  hasClaimed: boolean;
}

export interface BetWithParticipants extends Bet {
  participants: Participant[];
}

// ─── Wallet / Auth Types ───

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  isLoading: boolean;
}

export interface SignerContext {
  walletId: string;
  publicKey: string;
  serverUrl: string;
}

// ─── UI Types ───

export interface CreateBetForm {
  title: string;
  optionA: string;
  optionB: string;
  stakeAmount: string;
  deadline: string; // ISO date string from input
}

export interface TransactionResult {
  hash: string;
  explorerUrl: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}
