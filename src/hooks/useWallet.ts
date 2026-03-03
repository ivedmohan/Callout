'use client';

/**
 * Custom hook for Starkzap wallet management.
 *
 * Handles onboarding, wallet connection, and provides
 * the wallet object for contract interactions.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { onboardWithPrivy } from '@/lib/starkzap';
import { getSTRKBalance } from '@/lib/contract';
import type { WalletState } from '@/types';

export function useWallet() {
  const { login, logout, authenticated, ready, getAccessToken, user } = usePrivy();
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isLoading: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const walletRef = useRef<any>(null);
  const onboardingRef = useRef(false); // prevent duplicate onboarding calls

  // Core onboarding logic — separated so it can be called from both
  // the manual connectWallet click AND the automatic useEffect.
  const doOnboard = useCallback(async () => {
    // Guard: already connected or already in progress
    if (walletRef.current || onboardingRef.current) return;
    onboardingRef.current = true;

    setWalletState((prev) => ({ ...prev, isLoading: true }));
    setError(null);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error('No access token');

      const wallet = await onboardWithPrivy(accessToken);
      walletRef.current = wallet;

      const addr = wallet.address.toString();
      setWalletState({
        address: addr,
        isConnected: true,
        isLoading: false,
      });

      // Fetch balance
      getSTRKBalance(addr).then(setBalance).catch(() => setBalance('0'));
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      setError(err.message || 'Failed to connect wallet');
      setWalletState((prev) => ({ ...prev, isLoading: false }));
    } finally {
      onboardingRef.current = false;
    }
  }, [getAccessToken]);

  // Auto-onboard: as soon as Privy reports authenticated + SDK ready,
  // automatically run Starkzap onboarding so the user only clicks "Sign In" once.
  useEffect(() => {
    if (ready && authenticated && !walletRef.current && !onboardingRef.current) {
      doOnboard();
    }
  }, [ready, authenticated, doOnboard]);

  const connectWallet = useCallback(async () => {
    if (!authenticated) {
      // Opens Privy login modal — the useEffect above will auto-onboard
      // once authentication completes.
      login();
      return;
    }
    // Already authenticated but wallet not connected (edge case)
    await doOnboard();
  }, [authenticated, login, doOnboard]);

  const refreshBalance = useCallback(async () => {
    if (walletState.address) {
      const bal = await getSTRKBalance(walletState.address);
      setBalance(bal);
    }
  }, [walletState.address]);

  const disconnectWallet = useCallback(async () => {
    walletRef.current = null;
    setBalance(null);
    setWalletState({ address: null, isConnected: false, isLoading: false });
    await logout();
  }, [logout]);

  return {
    // Privy state
    authenticated,
    ready,
    user,
    login,
    // Wallet state
    wallet: walletRef.current,
    address: walletState.address,
    isConnected: walletState.isConnected,
    isLoading: walletState.isLoading,
    error,
    // Balance
    balance,
    refreshBalance,
    // Actions
    connectWallet,
    disconnectWallet,
  };
}
