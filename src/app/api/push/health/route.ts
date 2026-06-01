import { NextResponse } from 'next/server';
import * as webpush from 'web-push';
import { getVapidConfigFromEnv } from '@/lib/push-notifications';

export async function GET() {
  const { publicKey, privateKey, subject } = getVapidConfigFromEnv();

  if (!publicKey || !privateKey || !subject) {
    return NextResponse.json({
      ok: false,
      error: 'Faltan variables VAPID en el servidor',
    });
  }

  let keyPairValid = false;
  let keyPairError: string | null = null;

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    keyPairValid = true;
  } catch (e: unknown) {
    keyPairError = e instanceof Error ? e.message : 'Par VAPID inválido';
  }

  return NextResponse.json({
    ok: keyPairValid,
    publicKeyLength: publicKey.length,
    subjectStartsWithMailto: subject.startsWith('mailto:'),
    keyPairValid,
    keyPairError,
    hint: keyPairValid
      ? 'El servidor tiene un par VAPID coherente. Si Android sigue fallando, revisa Google Play Services o regenera las llaves con npx web-push generate-vapid-keys'
      : 'Regenera las llaves VAPID y actualízalas en Netlify y functions/.env',
  });
}
