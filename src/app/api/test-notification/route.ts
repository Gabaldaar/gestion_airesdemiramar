import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase/admin';
import * as webpush from 'web-push';
import {
    getVapidConfigFromEnv,
    isStalePushSubscriptionError,
    toWebPushSubscription,
} from '@/lib/push-notifications';

export async function POST(req: Request) {
    try {
        const { orgId } = await req.json();

        if (!orgId) {
            return NextResponse.json({ error: "OrgId is required" }, { status: 400 });
        }

        const { publicKey, privateKey, subject } = getVapidConfigFromEnv();

        if (!publicKey || !privateKey || !subject) {
            return NextResponse.json({ error: "VAPID keys not configured in Netlify environment" }, { status: 500 });
        }

        webpush.setVapidDetails(subject, publicKey, privateKey);
        const db = getDb();
        
        const subsSnap = await db.collection('pushSubscriptions').where('orgId', '==', orgId).get();

        if (subsSnap.empty) {
            return NextResponse.json({ error: "No hay dispositivos registrados para esta organización. Abre esta página en tu móvil y pulsa 'Activar' en la pestaña Alertas." }, { status: 404 });
        }

        const payload = JSON.stringify({
            title: "¡Prueba Exitosa! 🎉",
            body: "Las notificaciones de Regentum están configuradas correctamente en este dispositivo.",
            icon: "/icons/icon-192x192.png",
            tag: "test-notification",
            url: "/settings?tab=alerts"
        });

        const results = await Promise.all(subsSnap.docs.map(async (doc) => {
            try {
                await webpush.sendNotification(toWebPushSubscription(doc.data()), payload);
                return { success: true };
            } catch (error: any) {
                if (isStalePushSubscriptionError(error.statusCode)) {
                    await doc.ref.delete();
                }
                return { success: false, error: error.message };
            }
        }));

        const successCount = results.filter(r => r.success).length;

        if (successCount === 0) {
            return NextResponse.json({ 
                success: false, 
                error: "No se pudo entregar a ningún dispositivo. Vuelve a pulsar 'Activar' en este móvil o revisa que las llaves VAPID coincidan en Netlify." 
            }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            message: `Prueba enviada a ${successCount} dispositivo(s) registrado(s).` 
        });

    } catch (error: any) {
        console.error("[TEST PUSH ERROR]:", error);
        return NextResponse.json({ error: error.message || "Error interno." }, { status: 500 });
    }
}
