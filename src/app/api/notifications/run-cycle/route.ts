import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase/admin';
import * as webpush from 'web-push';
import { differenceInDays, startOfToday } from 'date-fns';
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
            return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
        }

        webpush.setVapidDetails(subject, publicKey, privateKey);
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
        const subscriptions = subsSnap.docs.map(d => ({
            ref: d.ref,
            push: toWebPushSubscription(d.data()),
        }));

        let sentCount = 0;
        let skippedCount = 0;

        const sendToAll = async (title: string, body: string, tag: string) => {
            const payload = JSON.stringify({
                title,
                body,
                tag,
                url: '/bookings',
                icon: '/icons/icon-192x192.png',
            });

            await Promise.all(subscriptions.map(async ({ ref, push }) => {
                try {
                    await webpush.sendNotification(push, payload);
                } catch (e: any) {
                    console.error("[MANUAL PUSH] Error enviando a un dispositivo:", e.statusCode);
                    if (isStalePushSubscriptionError(e.statusCode)) {
                        await ref.delete().catch(() => {});
                    }
                }
            }));
            sentCount++;
        };

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
            let notified = false;

            if (diffIn >= 0 && diffIn <= maxCheckInDays) {
                await sendToAll(
                    `Check-in: ${propName}`,
                    `${tenantsMap.get(booking.tenantId) || "Inquilino"} llega en ${diffIn === 0 ? "HOY" : diffIn + " días"}.`,
                    `in-${doc.id}`
                );
                notified = true;
            }

            if (diffOut >= 0 && diffOut <= maxCheckOutDays) {
                await sendToAll(
                    `Check-out: ${propName}`,
                    `${tenantsMap.get(booking.tenantId) || "Inquilino"} sale en ${diffOut === 0 ? "HOY" : diffOut + " días"}.`,
                    `out-${doc.id}`
                );
                notified = true;
            }

            const hasDebt = (booking.balance || 0) > 0.01;
            const isUpcomingDebt = diffIn >= 0 && diffIn <= 3;
            const isOngoing = diffIn < 0 && diffOut >= 0;

            if (hasDebt && (isUpcomingDebt || isOngoing)) {
                const formattedDebt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: booking.currency || 'USD' }).format(booking.balance);
                await sendToAll(
                    `Deuda Pendiente: ${propName}`,
                    `${tenantsMap.get(booking.tenantId) || "Inquilino"} debe ${formattedDebt}.`,
                    `debt-${doc.id}`
                );
                notified = true;
            }

            if (!notified) {
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
