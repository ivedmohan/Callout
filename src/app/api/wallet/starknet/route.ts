/**
 * POST /api/wallet/starknet
 *
 * Retrieves an existing Starknet wallet for the authenticated user,
 * or creates one if they don't have one yet.
 * Called by the Starkzap SDK during onboarding.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/node';

const privy = new PrivyClient({
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const accessToken = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!accessToken) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    // 1. Verify the access token and extract the user ID
    const { user_id } = await privy.utils().auth().verifyAccessToken(accessToken);

    // 2. Check if this user already has a Starknet wallet
    const existingWallets = await privy.wallets().list({
      chain_type: 'starknet',
      user_id,
    });

    // Iterate the cursor to find the first Starknet wallet
    let starknetWallet = null;
    for await (const w of existingWallets) {
      starknetWallet = w;
      break; // we only need the first one
    }

    if (starknetWallet) {
      console.log(`[wallet/starknet] Reusing existing wallet ${starknetWallet.id} for user ${user_id}`);
      return NextResponse.json({
        wallet: {
          id: starknetWallet.id,
          address: starknetWallet.address,
          publicKey: starknetWallet.public_key || '',
        },
      });
    }

    // 3. No existing wallet — create a new one, owned by this user
    console.log(`[wallet/starknet] Creating new Starknet wallet for user ${user_id}`);
    const newWallet = await privy.wallets().create({
      chain_type: 'starknet',
      owner: { user_id },
    });

    return NextResponse.json({
      wallet: {
        id: newWallet.id,
        address: newWallet.address,
        publicKey: newWallet.public_key || '',
      },
    });
  } catch (error: any) {
    console.error('Create/get wallet error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Failed to create wallet' }, { status: 500 });
  }
}
