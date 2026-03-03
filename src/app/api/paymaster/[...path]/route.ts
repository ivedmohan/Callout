/**
 * ALL /api/paymaster/[...path]
 *
 * Proxies paymaster requests to AVNU, adding the API key server-side.
 * The Starkzap SDK points its paymaster config to this endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';

const AVNU_URL = (process.env.PAYMASTER_URL || 'https://sepolia.paymaster.avnu.fi').replace(/\/+$/, '');
const API_KEY = (process.env.PAYMASTER_API_KEY || '').trim();

async function proxyPaymaster(req: NextRequest, subPath: string) {
  try {
    const targetUrl = subPath ? `${AVNU_URL}/${subPath}` : AVNU_URL;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (API_KEY) {
      headers['x-paymaster-api-key'] = API_KEY;
    }

    const fetchOpts: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOpts.body = await req.text();
    }

    console.log(`[paymaster-proxy] ${req.method} -> ${targetUrl}`);
    const upstream = await fetch(targetUrl, fetchOpts);
    const text = await upstream.text();
    console.log(`[paymaster-proxy] ${upstream.status} (${text.length} bytes)`);

    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Paymaster proxy error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Paymaster proxy failed' }, { status: 502 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyPaymaster(req, (path || []).join('/'));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyPaymaster(req, (path || []).join('/'));
}
