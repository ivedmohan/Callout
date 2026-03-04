/**
 * POST /api/wallet/starknet
 *
 * Retrieves an existing Starknet wallet for the authenticated user,
 * or creates one if they don't have one yet.
 * Called by the Starkzap SDK during onboarding.
 *
 * Wallets are app-owned (no `owner`) so rawSign works with just the
 * app API key — no per-user JWT required for signing.
 * We store the wallet mapping in Privy's user custom_metadata
 * so it works on serverless (Vercel) with no filesystem.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/node';

let _privy: PrivyClient | null = null;
function getPrivy() {
  if (!_privy) {
    _privy = new PrivyClient({
      appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
      appSecret: process.env.PRIVY_APP_SECRET!,
    });
  }
  return _privy;
}

type WalletData = { id: string; address: string; publicKey: string };

export async function POST(req: NextRequest) {
  try {
    const accessToken = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!accessToken) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const privy = getPrivy();

    // 1. Verify the access token and extract the user ID
    const { user_id } = await privy.utils().auth().verifyAccessToken(accessToken);

    // 2. Check if the user already has a wallet stored in their custom_metadata
    const user = await privy.users.get(user_id);
    const existing = user.custom_metadata as { starknet_wallet?: WalletData } | null;

    if (existing?.starknet_wallet) {
      console.log(`[wallet/starknet] Found existing wallet for user ${user_id}`);
      return NextResponse.json({ wallet: existing.starknet_wallet });
    }

    // 3. No wallet yet — create a new app-owned wallet
    console.log(`[wallet/starknet] Creating new Starknet wallet for user ${user_id}`);
    const newWallet = await privy.wallets().create({
      chain_type: 'starknet',
    });

    const walletData: WalletData = {
      id: newWallet.id,
      address: newWallet.address,
      publicKey: newWallet.public_key || '',
    };

    // 4. Store the mapping in the user's custom_metadata
    await privy.users.setCustomMetadata(user_id, {
      custom_metadata: {
        ...((user.custom_metadata as Record<string, unknown>) || {}),
        starknet_wallet: walletData,
      },
    });

    console.log(`[wallet/starknet] Wallet created and saved for user ${user_id}: ${walletData.address}`);
    return NextResponse.json({ wallet: walletData });
  } catch (error: any) {
    console.error('Create/get wallet error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Failed to create wallet' }, { status: 500 });
  }
}
