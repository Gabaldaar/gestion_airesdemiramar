import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase/admin';
import * as webpush from 'web-push';
import { differenceInDays, startOfToday } from 'date-fns';
import {
    getVapidConfigFromEnv,
    isStalePushSubscriptionError,
    toWebPushSubscription,
} from '@/lib/push-notifications';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
    try {
        console.log("[CRON] Iniciando ciclo global de notificaciones Push...");
        const { publicKey, privateKey, subject } = getVapidConfigFromEnv();

        if (!publicKey || !privateKey || !subject) {
            console.error("[CRON] Error: VAPID keys no configuradas.");
            return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
        }

        webpush.setVapidDetails(subject, publicKey, privateKey);
        const db = getDb();
        const today = startOfToday();

        // Obtener todos los suscriptores
        const subsSnap = await db.collection('pushSubscriptions').get();
        if (subsSnap.empty) {
            console.log("[CRON] No se encontraron suscriptores registrados.");
            return NextResponse.json({ success: true, message: "No subscribers found.", sent: 0 });
        }

        // Agrupar por orgId
        const subsByOrg: Record<string, any[]> = {};
        subsSnap.docs.forEach(doc => {
            const data = doc.data();
            if (data.orgId) {
                if (!subsByOrg[data.orgId]) subsByOrg[data.orgId] = [];
                subsByOrg[data.orgId].push({ ref: doc.ref, push: toWebPushSubscription(data) });
            }
        });

        let totalSent = 0;

        for (const orgId of Object.keys(subsByOrg)) {
            console.log(`[CRON] Procesando Organización: ${orgId}`);
            const settingsSnap = await db.collection('settings').doc(`alerts_${orgId}`).get();
            const settings = settingsSnap.data();
            const maxCheckInDays = settings?.checkInDays ?? 7;
            const maxCheckOutDays = settings?.checkOutDays ?? 3;

            const [bookingsSnap, propsSnap, tenantsSnap] = await Promise.all([
                db.collection('bookings').where('orgId', '==', orgId).where('status', 'in', ['active', 'pending']).get(),
                db.collection('properties').where('orgId', '==', orgId).get(),
                db.collection('tenants').where('orgId', '==', orgId).get(),
            ]);

            if (bookingsSnap.empty) continue;

            const propsMap = new Map(propsSnap.docs.map(d => [d.id, d.data().name]));
            const tenantsMap = new Map(tenantsSnap.docs.map(d => [d.id, d.data().name]));
            const subscriptions = subsByOrg[orgId];

            for (const doc of bookingsSnap.docs) {
                const booking = doc.data();
                const start = booking.startDate ? new Date(booking.startDate) : null;
                const end = booking.endDate ? new Date(booking.endDate) : null;
                const propName = propsMap.get(booking.propertyId) || "Propiedad";

                if (!start || !end || isNaN(start.getTime())) continue;

                const diffIn = differenceInDays(start, today);
                const diffOut = differenceInDays(end, today);

                const sendToOrg = async (title: string, body: string, tag: string) => {
                    const payload = JSON.stringify({ title, body, tag, url: '/bookings', icon: '/icons/icon-192x192.png' });
                    await Promise.all(subscriptions.map(async ({ ref, push }) => {
                        try {
                            await webpush.sendNotification(push, payload);
                        } catch (e: any) {
                            if (isStalePushSubscriptionError(e.statusCode)) {
                                await ref.delete().catch(() => {});
                            }
                        }
                    }));
                    totalSent++;
                };

                if (diffIn >= 0 && diffIn <= maxCheckInDays) {
                    console.log(`[CRON] Enviando Check-in para ${propName} (T-${diffIn} días)`);
                    await sendToOrg(`Check-in: ${propName}`, `${tenantsMap.get(booking.tenantId) || "Inquilino"} llega en ${diffIn === 0 ? "HOY" : diffIn + " días"}.`, `in-${doc.id}`);
                }
                
                if (diffOut >= 0 && diffOut <= maxCheckOutDays) {
                    console.log(`[CRON] Enviando Check-out para ${propName} (T-${diffOut} días)`);
                    await sendToOrg(`Check-out: ${propName}`, `${tenantsMap.get(booking.tenantId) || "Inquilino"} sale en ${diffOut === 0 ? "HOY" : diffOut + " días"}.`, `out-${doc.id}`);
                }

                const hasDebt = (booking.balance || 0) > 0.01;
                const isUpcomingDebt = diffIn >= 0 && diffIn <= 3;
                const isOngoing = diffIn < 0 && diffOut >= 0;

                if (hasDebt && (isUpcomingDebt || isOngoing)) {
                    const formattedDebt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: booking.currency || 'USD' }).format(booking.balance);
                    console.log(`[CRON] Enviando Deuda Pendiente para ${propName} (${formattedDebt})`);
                    await sendToOrg(`Deuda Pendiente: ${propName}`, `${tenantsMap.get(booking.tenantId) || "Inquilino"} debe ${formattedDebt}.`, `debt-${doc.id}`);
                }
            }
        }

        console.log(`[CRON] Ciclo completado. Total de alertas disparadas: ${totalSent}`);
        return NextResponse.json({ success: true, message: "Ciclo ejecutado correctamente.", sent: totalSent });

    } catch (error: any) {
        console.error("[CRON ERROR]:", error);
        return NextResponse.json({ error: error.message || "Error interno." }, { status: 500 });
    }
}
