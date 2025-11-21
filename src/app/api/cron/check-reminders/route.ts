
import { getAlertSettings, getBookings, savePushSubscription, getPushSubscriptions, deletePushSubscription } from '@/lib/data';
import { differenceInDays, startOfToday } from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

// --- TEMPORARY DEBUGGING ---
// Hardcoding VAPID details to eliminate environment variable issues.
const VAPID_PUBLIC_KEY = "<TU_NUEVA_CLAVE_PUBLICA>";
const VAPID_PRIVATE_KEY = "<TU_NUEVA_CLAVE_PRIVADA>";
const VAPID_MAILTO = "<TU_EMAIL_DE_CONTACTO>";
// --- END TEMPORARY DEBUGGING ---

// Configure web-push with your VAPID details
webpush.setVapidDetails(
    VAPID_MAILTO.startsWith('mailto:') ? VAPID_MAILTO : `mailto:${VAPID_MAILTO}`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);


export async function POST(request: NextRequest) {
    console.log("CRON JOB: Iniciando ejecución...");
    const authHeader = request.headers.get('authorization');
    const CRON_SECRET = process.env.CRON_SECRET;

    if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET.trim()}`) {
        console.error("CRON JOB: Error de autenticación. El CRON_SECRET no coincide o no se proporcionó.");
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const [alertSettings, allBookings, subscriptions] = await Promise.all([
            getAlertSettings(),
            getBookings(),
            getPushSubscriptions()
        ]);
        
        console.log(`CRON JOB: Encontradas ${subscriptions.length} suscripciones a notificaciones.`);
        if (subscriptions.length === 0) {
            console.log("CRON JOB: No hay suscripciones activas. Saltando.");
            return NextResponse.json({ success: true, message: 'No active push subscriptions. Skipping.', notificationsSent: 0 });
        }

        const today = startOfToday();
        console.log(`CRON JOB: Fecha de hoy (inicio del día, UTC): ${today.toISOString()}`);
        
        const checkInAlertDays = [7, 3, 1, 0];
        const checkOutAlertDays = [7, 3, 1, 0];
        const notificationsToSend = [];

        console.log(`CRON JOB: Revisando ${allBookings.length} reservas en total.`);

        for (const booking of allBookings) {
            if (!booking.status || booking.status !== 'active') {
                continue;
            }

            // Check-in Reminders
            const checkInDate = new Date(booking.startDate);
            const daysUntilCheckIn = differenceInDays(checkInDate, today);
            
            console.log(`CRON JOB: Reserva ${booking.id} (${booking.tenant?.name}) - Check-in: ${booking.startDate}. Días restantes: ${daysUntilCheckIn}`);

            if (checkInAlertDays.includes(daysUntilCheckIn)) {
                console.log(`CRON JOB: ¡COINCIDENCIA DE CHECK-IN! Reserva ${booking.id} coincide con el hito de ${daysUntilCheckIn} días.`);
                notificationsToSend.push({
                    title: `Recordatorio Check-in (${booking.property?.name})`,
                    body: `${booking.tenant?.name} llega ${daysUntilCheckIn === 0 ? 'hoy' : `en ${daysUntilCheckIn} día(s)`}.`,
                    icon: '/icons/icon-192x192.png',
                    tag: `checkin-${booking.id}-${daysUntilCheckIn}`
                });
            }

            // Check-out Reminders
            const checkOutDate = new Date(booking.endDate);
            const daysUntilCheckOut = differenceInDays(checkOutDate, today);

            console.log(`CRON JOB: Reserva ${booking.id} (${booking.tenant?.name}) - Check-out: ${booking.endDate}. Días restantes: ${daysUntilCheckOut}`);
            
            if (checkOutAlertDays.includes(daysUntilCheckOut)) {
                console.log(`CRON JOB: ¡COINCIDENCIA DE CHECK-OUT! Reserva ${booking.id} coincide con el hito de ${daysUntilCheckOut} días.`);
                 notificationsToSend.push({
                    title: `Recordatorio Check-out (${booking.property?.name})`,
                    body: `${booking.tenant?.name} se retira ${daysUntilCheckOut === 0 ? 'hoy' : `en ${daysUntilCheckOut} día(s)`}.`,
                    icon: '/icons/icon-192x192.png',
                    tag: `checkout-${booking.id}-${daysUntilCheckOut}`
                });
            }
        }
        
        console.log(`CRON JOB: Se prepararon ${notificationsToSend.length} notificaciones para enviar.`);

        if (notificationsToSend.length > 0) {
            // Send notifications
            const sendPromises = subscriptions.map(sub => {
                const pushSubscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.keys.p256dh,
                        auth: sub.keys.auth,
                    },
                };
                
                console.log(`CRON JOB: Enviando ${notificationsToSend.length} notificaciones a ${sub.endpoint.substring(0, 40)}...`);
                return Promise.all(notificationsToSend.map(payload => 
                    webpush.sendNotification(pushSubscription, JSON.stringify(payload)).catch(error => {
                        console.error(`CRON JOB: Error enviando notificación a ${sub.id}:`, error.body);
                        // If the subscription is no longer valid, delete it
                        if (error.statusCode === 404 || error.statusCode === 410 || error.message.includes('do not correspond')) {
                            console.log(`CRON JOB: Suscripción ${sub.id} ha expirado o es inválida. Borrando.`);
                            return deletePushSubscription(sub.id);
                        }
                    })
                ));
            });

            await Promise.all(sendPromises);
            console.log("CRON JOB: Todas las promesas de envío de notificaciones se han completado.");
        }

        console.log("CRON JOB: Ejecución finalizada con éxito.");
        return NextResponse.json({ success: true, notificationsSent: notificationsToSend.length * subscriptions.length });

    } catch (error) {
        console.error('CRON JOB: La ejecución falló con un error inesperado:', error);
        if (error instanceof Error) {
            return new Response(error.message, { status: 500 });
        }
        return new Response('An unknown error occurred', { status: 500 });
    }
}
