import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase/admin';
import * as webpush from 'web-push';
import { differenceInDays, startOfToday } from 'date-fns';

export async function POST(req: Request) {
    try {
        const { orgId } = await req.json();

        if (!orgId) {
            return NextResponse.json({ error: "OrgId is required" }, { status: 400 });
        }

        // Obtener llaves VAPID de Netlify (v1.6.7)
        const pubKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').replace(/["']/g, '').trim();
        const privKey = (process.env.VAPID_PRIVATE_KEY || '').replace(/["']/g, '').trim();
        const mailTo = (process.env.VAPID_MAILTO || '').replace(/["']/g, '').trim();

        if (!pubKey || !privKey || !mailTo) {
            return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
        }

        webpush.setVapidDetails(mailTo, pubKey, privKey);
        const db = getDb();
        const today = startOfToday();

        // 1. Obtener Configuraciones
        const settingsSnap = await db.collection('settings').doc(`alerts_${orgId}`).get();
        const settings = settingsSnap.data();
        const maxCheckInDays = settings?.checkInDays ?? 7;
        const maxCheckOutDays = settings?.checkOutDays ?? 3;

        // 2. Obtener Reservas y Datos Auxiliares
        const [bookingsSnap, propsSnap, tenantsSnap, subsSnap] = await Promise.all([
            db.collection('bookings').where('orgId', '==', orgId).where('status', 'in', ['active', 'pending']).get(),
            db.collection('properties').where('orgId', '==', orgId).get(),
            db.collection('tenants').where('orgId', '==', orgId).get(),
            db.collection('pushSubscriptions').where('orgId', '==', orgId).get()
        ]);

        if (subsSnap.empty) {
            return NextResponse.json({ 
                success: true, 
                message: "No hay dispositivos registrados en esta organización. Ve a la pestaña Alertas en cada móvil y pulsa 'Activar'.", 
                sent: 0 
            });
        }

        const propsMap = new Map(propsSnap.docs.map(d => [d.id, d.data().name]));
        const tenantsMap = new Map(tenantsSnap.docs.map(d => [d.id, d.data().name]));
        const subscriptions = subsSnap.docs.map(d => d.data());

        let sentCount = 0;
        let skippedCount = 0;

        for (const doc of bookingsSnap.docs) {
            const booking = doc.data();
            const start = booking.startDate ? new Date(booking.startDate) : null;
            const end = booking.endDate ? new Date(booking.endDate) : null;
            const propName = propsMap.get(booking.propertyId) || "Propiedad";

            if (!start || !end || isNaN(start.getTime())) {
                skippedCount++;
                continue;
            }

            const diffIn = differenceInDays(start, today);
            const diffOut = differenceInDays(end, today);
            
            let shouldNotify = false;
            let title = "";
            let body = "";
            let tag = "";

            if (diffIn >= 0 && diffIn <= maxCheckInDays) {
                shouldNotify = true;
                title = `Check-in: ${propName}`;
                body = `${tenantsMap.get(booking.tenantId) || "Inquilino"} llega en ${diffIn === 0 ? "HOY" : diffIn + " días"}.`;
                tag = `in-${doc.id}`;
            } else if (diffOut >= 0 && diffOut <= maxCheckOutDays) {
                shouldNotify = true;
                title = `Check-out: ${propName}`;
                body = `${tenantsMap.get(booking.tenantId) || "Inquilino"} sale en ${diffOut === 0 ? "HOY" : diffOut + " días"}.`;
                tag = `out-${doc.id}`;
            }

            if (shouldNotify) {
                const payload = JSON.stringify({ 
                    title, 
                    body, 
                    tag,
                    url: '/bookings', 
                    icon: '/icons/icon-192x192.png' 
                });

                await Promise.all(subscriptions.map(sub => 
                    webpush.sendNotification(sub as any, payload).catch(e => {
                        console.error("[MANUAL PUSH] Error enviando a un dispositivo:", e.statusCode);
                    })
                ));
                sentCount++;
            } else {
                skippedCount++;
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Análisis finalizado: ${sentCount} alertas enviadas a todos tus dispositivos registrados.`,
            sent: sentCount,
            skipped: skippedCount
        });

    } catch (error: any) {
        console.error("[MANUAL PUSH ERROR]:", error);
        return NextResponse.json({ error: error.message || "Error interno." }, { status: 500 });
    }
}
