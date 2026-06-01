import { NextResponse } from 'next/server';
import { getAuth, getDb } from '@/lib/firebase/admin';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const idToken = authHeader.slice('Bearer '.length);
    const decoded = await getAuth().verifyIdToken(idToken);

    const { subscription, orgId } = await req.json();
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: 'Suscripción inválida' }, { status: 400 });
    }
    if (!orgId) {
      return NextResponse.json({ error: 'orgId requerido' }, { status: 400 });
    }

    const db = getDb();
    const providerSnap = await db.collection('providers').doc(decoded.uid).get();
    const userOrgId = providerSnap.data()?.orgId;
    if (userOrgId && userOrgId !== orgId) {
      return NextResponse.json({ error: 'Organización no permitida' }, { status: 403 });
    }

    const docId = encodeURIComponent(subscription.endpoint);
    await db.collection('pushSubscriptions').doc(docId).set({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      orgId,
      userId: decoded.uid,
      createdAt: new Date().toISOString(),
      expirationTime: subscription.expirationTime ?? null,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[PUSH REGISTER API]', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
