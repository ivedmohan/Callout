/**
 * GET /api/health
 *
 * Simple health check endpoint.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    network: process.env.NEXT_PUBLIC_NETWORK || 'sepolia',
  });
}
