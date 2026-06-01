import { NextResponse } from 'next/server';
import { getVapidConfigFromEnv } from '@/lib/push-notifications';

export async function GET() {
  const { publicKey } = getVapidConfigFromEnv();
  if (!publicKey) {
    return NextResponse.json({ error: 'VAPID public key not configured' }, { status: 500 });
  }
  return NextResponse.json(
    { publicKey },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
