
import { getAlertSettings, getBookings, savePushSubscription, getPushSubscriptions, deletePushSubscription } from '@/lib/data';
import { differenceInDays, startOfToday } from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

// Configure web-push with your VAPID details
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_MAILTO) {
    webpush.setVapidDetails(
        process.env.VAPID_MAILTO,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}


export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const CRON_SECRET = process.env.CRON_SECRET;

    if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const [alertSettings, allBookings, subscriptions] = await Promise.all([
            getAlertSettings(),
            getBookings(),
            getPushSubscriptions()
        ]);
        
        if (!alertSettings) {
            return NextResponse.json({ success: true, message: 'No alert settings configured. Skipping.', notificationsSent: 0 });
        }
        if (subscriptions.length === 0) {
            return NextResponse.json({ success: true, message: 'No active push subscriptions. Skipping.', notificationsSent: 0 });
        }

        const today = startOfToday();
        const checkInDays = alertSettings.checkInDays;
        const checkOutDays = alertSettings.checkOutDays;
        const notificationsToSend = [];

        for (const booking of allBookings) {
            if (!booking.status || booking.status !== 'active') {
                continue;
            }

            // Check-in Reminders
            const checkInDate = new Date(booking.startDate);
            const daysUntilCheckIn = differenceInDays(checkInDate, today);
            if (daysUntilCheckIn === checkInDays) {
                notificationsToSend.push({
                    title: `Recordatorio Check-in (${booking.property?.name})`,
                    body: `${booking.tenant?.name} llega en ${checkInDays} días.`,
                    icon: '/icons/icon-192x192.png',
                    tag: `checkin-${booking.id}`
                });
            }

            // Check-out Reminders
            const checkOutDate = new Date(booking.endDate);
            const daysUntilCheckOut = differenceInDays(checkOutDate, today);
            if (daysUntilCheckOut === checkOutDays) {
                 notificationsToSend.push({
                    title: `Recordatorio Check-out (${booking.property?.name})`,
                    body: `${booking.tenant?.name} se retira en ${checkOutDays} días.`,
                    icon: '/icons/icon-192x192.png',
                    tag: `checkout-${booking.id}`
                });
            }
        }
        
        // Send notifications
        const sendPromises = subscriptions.map(sub => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.keys.p256dh,
                    auth: sub.keys.auth,
                },
            };
            
            return Promise.all(notificationsToSend.map(payload => 
                webpush.sendNotification(pushSubscription, JSON.stringify(payload)).catch(error => {
                    console.error(`Error sending notification to ${sub.endpoint}:`, error);
                    // If the subscription is no longer valid, delete it
                    if (error.statusCode === 404 || error.statusCode === 410) {
                        console.log(`Subscription ${sub.id} has expired or is invalid. Deleting.`);
                        return deletePushSubscription(sub.id);
                    }
                })
            ));
        });

        await Promise.all(sendPromises);

        return NextResponse.json({ success: true, notificationsSent: notificationsToSend.length * subscriptions.length });

    } catch (error) {
        console.error('Cron job failed:', error);
        if (error instanceof Error) {
            return new Response(error.message, { status: 500 });
        }
        return new Response('An unknown error occurred', { status: 500 });
    }
}
