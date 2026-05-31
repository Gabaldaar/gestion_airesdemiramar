import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase/admin';
import * as webpush from 'web-push';

export async function POST(req: Request) {
    try {
        const { orgId } = await req.json();

        if (!orgId) {
            return NextResponse.json({ error: "OrgId is required" }, { status: 400 });
        }

        const pubKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').replace(/["']/g, '').trim();
        const privKey = (process.env.VAPID_PRIVATE_KEY || '').replace(/["']/g, '').trim();
        const mailTo = (process.env.VAPID_MAILTO || '').replace(/["']/g, '').trim();

        if (!pubKey || !privKey || !mailTo) {
            return NextResponse.json({ error: "VAPID keys not configured in Netlify environment" }, { status: 500 });
        }

        webpush.setVapidDetails(mailTo, pubKey, privKey);
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
            const sub = doc.data();
            try {
                await webpush.sendNotification(sub, payload);
                return { success: true };
            } catch (error: any) {
                if (error.statusCode === 410 || error.statusCode === 404) {
                    await doc.ref.delete();
                }
                return { success: false, error: error.message };
            }
        }));

        const successCount = results.filter(r => r.success).length;

        if (successCount === 0) {
            return NextResponse.json({ 
                success: false, 
                error: "No se pudo entregar a ningún dispositivo. Asegúrate de haber 'Activado' las alertas en el móvil." 
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
