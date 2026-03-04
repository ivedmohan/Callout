/**
 * POST /api/wallet/sign
 *
 * Signs a transaction hash using Privy's rawSign.
 * Called by the Starkzap SDK's PrivySigner during tx execution.
 *
 * Wallets are app-owned (no user owner), so the app API key
 * is sufficient for signing — no user JWT needed.
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

export async function POST(req: NextRequest) {
  const { walletId, hash } = await req.json();

  if (!walletId || !hash) {
    return NextResponse.json({ error: 'walletId and hash are required' }, { status: 400 });
  }

  try {
    const result = await getPrivy().wallets().rawSign(walletId, {
      params: { hash },
    });

    return NextResponse.json({ signature: result.signature });
  } catch (error: any) {
    console.error('Sign error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Failed to sign' }, { status: 500 });
  }
}
