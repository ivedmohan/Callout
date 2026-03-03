'use client';

/**
 * Starkzap SDK initialization and wallet management.
 *
 * Uses Privy for social login + AVNU paymaster for gasless txs.
 * The SDK handles wallet creation, deployment, signing, and paymaster.
 */

import { StarkZap, OnboardStrategy, PrivySigner, accountPresets, getPresets } from 'starkzap';
import { NETWORK } from './constants';
import type { SignerContext } from '@/types';

// ─── Base URL helper (client-side) ───

function getBaseUrl(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

// ─── SDK singleton ───

let sdkInstance: StarkZap | null = null;

export function getSDK(): StarkZap {
  if (!sdkInstance) {
    sdkInstance = new StarkZap({
      network: NETWORK,
      paymaster: { nodeUrl: `${getBaseUrl()}/api/paymaster` },
    });
  }
  return sdkInstance;
}

// ─── Onboard with Privy ───

export async function onboardWithPrivy(accessToken: string) {
  const sdk = getSDK();

  const privyResolve = async () => {
    const res = await fetch('/api/wallet/starknet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) throw new Error('Failed to get wallet from backend');

    const { wallet } = await res.json();
    return {
      walletId: wallet.id,
      publicKey: wallet.publicKey,
      serverUrl: `${getBaseUrl()}/api/wallet/sign`,
    } satisfies SignerContext;
  };

  const onboardOpts = (deploy: 'if_needed' | 'never') => ({
    strategy: OnboardStrategy.Privy,
    privy: { resolve: privyResolve },
    // OpenZeppelin AccountUpgradeable — supports SNIP-9 V2 (execute_from_outside_v2)
    // which is required by the AVNU paymaster for sponsored (gasless) transactions.
    // ArgentX v0.5.0 (the SDK Privy default) does NOT support SNIP-9.
    accountPreset: accountPresets.openzeppelin,
    feeMode: 'sponsored' as const,
    deploy,
  });

  try {
    // First try with deploy: 'if_needed'
    const { wallet } = await sdk.onboard(onboardOpts('if_needed'));
    return wallet;
  } catch (err: any) {
    const msg = err?.message || String(err);
    // If the account is already deployed, retry without deploying
    if (msg.includes('already deployed') || msg.includes('TRANSACTION_EXECUTION_ERROR')) {
      console.log('[starkzap] Account already deployed, retrying with deploy: never');
      const { wallet } = await sdk.onboard(onboardOpts('never'));
      return wallet;
    }
    throw err;
  }
}

// ─── Token helpers ───

export function getSTRKToken(chainId: any) {
  return getPresets(chainId).STRK;
}
