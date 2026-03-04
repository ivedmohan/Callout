/**
 * POST /api/wallet/starknet
 *
 * Retrieves an existing Starknet wallet for the authenticated user,
 * or creates one if they don't have one yet.
 * Called by the Starkzap SDK during onboarding.
 *
 * Wallets are app-owned (no `owner`) so rawSign works with just the
 * app API key — no per-user JWT required for signing.
 * We track user_id -> wallet mapping in a local JSON file (MVP).
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/node';
import fs from 'fs';
import path from 'path';

const privy = new PrivyClient({
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
});

// Simple file-based wallet mapping (MVP — use a database in production)
const WALLET_MAP_PATH = path.join(process.cwd(), '.wallet-map.json');

type WalletData = { id: string; address: string; publicKey: string };

function loadWalletMap(): Record<string, WalletData> {
  try {
    if (fs.existsSync(WALLET_MAP_PATH)) {
      const raw = fs.readFileSync(WALLET_MAP_PATH, 'utf-8');
      console.log(`[wallet/starknet] Loaded wallet map from ${WALLET_MAP_PATH}`);
      return JSON.parse(raw);
    }
    console.log(`[wallet/starknet] Wallet map file not found at ${WALLET_MAP_PATH}`);
  } catch (err: any) {
    console.error(`[wallet/starknet] Failed to load wallet map:`, err?.message);
  }
  return {};
}

function saveWalletMap(map: Record<string, WalletData>) {
  fs.writeFileSync(WALLET_MAP_PATH, JSON.stringify(map, null, 2));
}

export async function POST(req: NextRequest) {
  try {
    const accessToken = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!accessToken) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    // 1. Verify the access token and extract the user ID
    const { user_id } = await privy.utils().auth().verifyAccessToken(accessToken);
    console.log(`[wallet/starknet] user_id from token: ${user_id}`);

    // 2. Check our local mapping first
    const walletMap = loadWalletMap();
    console.log(`[wallet/starknet] Wallet map keys: ${Object.keys(walletMap).join(', ') || '(empty)'}`);
    console.log(`[wallet/starknet] Match for user? ${!!walletMap[user_id]}`);
    if (walletMap[user_id]) {
      console.log(`[wallet/starknet] Reusing mapped wallet ${walletMap[user_id].id} for user ${user_id}`);
      return NextResponse.json({ wallet: walletMap[user_id] });
    }

    // 3. No mapping — create a new app-owned wallet
    console.log(`[wallet/starknet] Creating new Starknet wallet for user ${user_id}`);
    const newWallet = await privy.wallets().create({
      chain_type: 'starknet',
    });

    const walletData: WalletData = {
      id: newWallet.id,
      address: newWallet.address,
      publicKey: newWallet.public_key || '',
    };

    // Save the mapping
    walletMap[user_id] = walletData;
    saveWalletMap(walletMap);

    return NextResponse.json({ wallet: walletData });
  } catch (error: any) {
    console.error('Create/get wallet error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Failed to create wallet' }, { status: 500 });
  }
}
