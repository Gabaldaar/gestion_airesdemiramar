// /src/app/api/cron/check-reminders/route.ts

import { NextResponse } from 'next/server';
import { getAlertSettings, getBookings, getPushSubscriptions, deletePushSubscription } from '@/lib/data';
import webpush from 'web-push';
import { differenceInDays, startOfToday } from 'date-fns';

export const dynamic = 'force-dynamic'; // MUY IMPORTANTE: Evita que Next.js intente hacer esta ruta estática.

// Tipos de datos para mayor claridad
interface NotificationData {
  title: string;
  body: string;
  icon?: string;
}

interface Subscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

async function sendNotification(subscription: Subscription, payload: string) {
  try {
    await webpush.sendNotification(subscription, payload);
    console.log('[CRON] Notification sent successfully.');
  } catch (error: any) {
    console.error('[CRON] Error sending notification:', error.message);
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log('[CRON] Subscription has expired or is invalid. Deleting.');
      // El endpoint es el identificador único que usamos como ID del documento
      const safeId = btoa(subscription.endpoint);
      await deletePushSubscription(safeId).catch(delErr => {
        console.error(`[CRON] Failed to delete expired subscription ${safeId}:`, delErr);
      });
    }
  }
}

export async function GET(request: Request) {
  // 1. Configurar VAPID dentro del handler para evitar errores de build
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidMailto = process.env.VAPID_MAILTO;

  if (!vapidPublicKey || !vapidPrivateKey || !vapidMailto) {
    console.error("[CRON] VAPID keys or mailto are not set. Cannot send push notifications.");
    return NextResponse.json({ error: 'VAPID keys are not configured on the server.' }, { status: 500 });
  }

  webpush.setVapidDetails(
    `mailto:${vapidMailto}`,
    vapidPublicKey,
    vapidPrivateKey
  );
  
  console.log('[CRON] VAPID details set.');

  try {
    // 2. Obtener la configuración de las alertas
    const alertSettings = await getAlertSettings();
    if (!alertSettings) {
      console.log('[CRON] No alert settings found. Skipping checks.');
      return NextResponse.json({ message: 'No alert settings configured.' });
    }

    // 3. Obtener todas las reservas y suscripciones push
    const [allBookings, allSubscriptions] = await Promise.all([
      getBookings(),
      getPushSubscriptions()
    ]);
    
    if (allSubscriptions.length === 0) {
        console.log('[CRON] No active push subscriptions found.');
        return NextResponse.json({ message: 'No subscriptions to send notifications to.' });
    }

    // 4. Lógica para determinar qué notificaciones enviar
    const today = startOfToday();
    const notificationsToSend: NotificationData[] = [];

    // Lógica para Check-ins
    allBookings.forEach(booking => {
      const isActive = !booking.status || booking.status === 'active';
      if (!isActive) return;

      const checkInDate = new Date(booking.startDate);
      const daysUntilCheckIn = differenceInDays(checkInDate, today);

      if (daysUntilCheckIn >= 0 && daysUntilCheckIn <= alertSettings.checkInDays) {
        notificationsToSend.push({
          title: 'Recordatorio de Check-in',
          body: `El inquilino ${booking.tenant?.name || 'N/A'} llega a ${booking.property?.name || 'N/A'} en ${daysUntilCheckIn} día(s).`,
          icon: '/icons/icon-192x192.png'
        });
      }
    });

    if (notificationsToSend.length === 0) {
      console.log('[CRON] No notifications to send today.');
      return NextResponse.json({ message: 'No relevant events for notifications today.' });
    }

    // 5. Enviar las notificaciones a todas las suscripciones
    let notificationsSentCount = 0;
    for (const notification of notificationsToSend) {
        const payload = JSON.stringify(notification);
        const sendPromises = allSubscriptions.map(sub => sendNotification(sub, payload));
        await Promise.all(sendPromises);
        notificationsSentCount++;
    }
    
    const successMessage = `CRON job executed. Sent ${notificationsSentCount} notification(s) to ${allSubscriptions.length} subscription(s).`;
    console.log(`[CRON] ${successMessage}`);
    return NextResponse.json({ message: successMessage });

  } catch (error: any) {
    console.error('[CRON] An unexpected error occurred:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}