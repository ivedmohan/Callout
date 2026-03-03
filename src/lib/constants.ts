// ─── Network & Contract Constants ───

export const NETWORK = (process.env.NEXT_PUBLIC_NETWORK || 'sepolia') as 'sepolia' | 'mainnet';

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';

// Starknet RPC endpoints
export const RPC_URLS: Record<string, string> = {
  sepolia: 'https://api.cartridge.gg/x/starknet/sepolia',
  mainnet: 'https://api.cartridge.gg/x/starknet/mainnet',
};

export const RPC_URL = process.env.RPC_URL || RPC_URLS[NETWORK];

// Block explorer
export const EXPLORER_URLS: Record<string, string> = {
  sepolia: 'https://sepolia.voyager.online',
  mainnet: 'https://voyager.online',
};

export const EXPLORER_URL = EXPLORER_URLS[NETWORK];

// STRK token address on Starknet
export const STRK_TOKEN_ADDRESS = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';
