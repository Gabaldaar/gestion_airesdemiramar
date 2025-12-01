
// netlify/functions/checkReminders.ts
'use server';

import type { Handler } from '@netlify/functions';
import admin from 'firebase-admin';
import webpush, { type PushSubscription } from 'web-push';
import { differenceInHours, startOfToday, endOfDay, addDays } from 'date-fns';

// --- INICIALIZACIÓN DE FIREBASE ADMIN (MÉTODO ROBUSTO) ---
if (!admin.apps.length) {
    try {
        const serviceAccount = {
            projectId: process.env.FB_PROJECT_ID,
            privateKey: process.env.FB_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            clientEmail: process.env.FB_CLIENT_EMAIL,
        };

        if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
            throw new Error('Faltan variables de entorno cruciales de Firebase (FB_PROJECT_ID, FB_PRIVATE_KEY, FB_CLIENT_EMAIL).');
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log('[Firebase Admin] Inicializado correctamente desde variables de entorno individuales.');

    } catch (error: any) {
        console.error('[Firebase Admin] La inicialización falló catastróficamente:', error.message);
        throw error;
    }
}

const db = admin.firestore();


// ==================================================================
// ESTA ES LA SECCIÓN QUE DEBES ADAPTAR PARA TU NUEVA APLICACIÓN
// ==================================================================
interface NotificationTriggerData {
  id: string; 
  title: string;
  body: string;
  icon?: string;
  docPath: string;
}

async function checkAndSendNotifications() {
    let notificationsSent = 0;
    // Lee la configuración guardada por el usuario, o usa valores por defecto (7 días para check-in, 3 para check-out).
    const alertSettings = (await db.doc('settings/alerts').get()).data() || { checkInDays: 7, checkOutDays: 3 };

    const notificationTriggers: NotificationTriggerData[] = [];
    const today = startOfToday();

    // --- 1. Lógica para Check-outs próximos ---
    // Busca check-outs que estén en la ventana de aviso y que NUNCA hayan recibido una notificación
    const checkOutLimitDate = endOfDay(addDays(today, alertSettings.checkOutDays || 3));
    const checkOutsSnap = await db.collection('rentals')
                              .where('status', '==', 'active')
                              .where('endDate', '>=', today)
                              .where('endDate', '<=', checkOutLimitDate)
                              .where('lastCheckoutNotificationSent', '==', null)
                              .get();
                              
    if (!checkOutsSnap.empty) {
        console.log(`[CRON] Encontrados ${checkOutsSnap.size} check-outs próximos sin notificar.`);
        for (const doc of checkOutsSnap.docs) {
            const rental = doc.data();
            notificationTriggers.push({
                id: `${doc.id}-checkout`,
                title: 'Check-out Próximo',
                body: `El check-out de ${rental.tenantName} en "${rental.propertyName}" es pronto.`,
                icon: '/icons/icon-192x192.png',
                docPath: doc.ref.path
            });
        }
    } else {
        console.log('[CRON] No hay check-outs próximos que necesiten notificación.');
    }
    
    // --- 2. Lógica para Check-ins próximos ---
    // Busca check-ins que estén en la ventana de aviso y que NUNCA hayan recibido una notificación
    const checkInLimitDate = endOfDay(addDays(today, alertSettings.checkInDays || 7));
    const checkInsSnap = await db.collection('rentals')
                              .where('status', '==', 'active')
                              .where('startDate', '>=', today)
                              .where('startDate', '<=', checkInLimitDate)
                              .where('lastCheckinNotificationSent', '==', null)
                              .get();

    if (!checkInsSnap.empty) {
        console.log(`[CRON] Encontrados ${checkInsSnap.size} check-ins próximos sin notificar.`);
        for (const doc of checkInsSnap.docs) {
            const rental = doc.data();
            notificationTriggers.push({
                id: `${doc.id}-checkin`,
                title: 'Check-in Próximo',
                body: `El check-in de ${rental.tenantName} en "${rental.propertyName}" es pronto.`,
                icon: '/icons/icon-192x192.png',
                docPath: doc.ref.path
            });
        }
    } else {
        console.log('[CRON] No hay check-ins próximos que necesiten notificación.');
    }

    if (notificationTriggers.length === 0) {
        console.log('[CRON] No hay eventos que disparen una notificación.');
        return 0;
    }

    const subscriptions = await getAllSubscriptions();
    if (subscriptions.length === 0) {
        console.log('[CRON] No se encontraron suscripciones push activas.');
        return 0;
    }
    
    for (const trigger of notificationTriggers) {
        const payload = JSON.stringify({ title: trigger.title, body: trigger.body, icon: trigger.icon, tag: trigger.id });

        const sendPromises = subscriptions.map(subscription => 
            sendNotification(subscription, payload)
        );
        
        await Promise.all(sendPromises);
        notificationsSent++;

        // Actualizar el timestamp en el documento para evitar reenvíos futuros.
        // Una vez que se establece este campo, la consulta anterior lo ignorará.
        const fieldToUpdate = trigger.id.endsWith('-checkout') ? 'lastCheckoutNotificationSent' : 'lastCheckinNotificationSent';
        await db.doc(trigger.docPath).update({
            [fieldToUpdate]: new Date().toISOString()
        });
        console.log(`[CRON] Notificación para ${trigger.id} enviada y marcada.`)
    }

    return notificationsSent;
}

// ==================================================================
// FUNCIONES DE SOPORTE (Generalmente no necesitas cambiar esto)
// ==================================================================
async function getAllSubscriptions(): Promise<PushSubscription[]> {
    const subscriptionsSnap = await db.collection('pushSubscriptions').get();
    if (subscriptionsSnap.empty) {
        return [];
    }
    // El documento contiene el objeto de suscripción completo
    return subscriptionsSnap.docs.map(doc => doc.data() as PushSubscription);
}

async function sendNotification(subscription: PushSubscription, payload: string) {
    try {
        await webpush.sendNotification(subscription, payload);
        console.log('[CRON] Notificación enviada exitosamente.');
    } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
            console.log('[CRON] La suscripción ha expirado o no se encuentra. Eliminando de la BD...');
            const endpointEncoded = Buffer.from(subscription.endpoint).toString('base64');
            db.collection('pushSubscriptions').doc(endpointEncoded).delete().catch(delErr => {
                console.error(`[CRON] Falló la eliminación de la suscripción expirada ${endpointEncoded}:`, delErr);
            });
        } else {
            console.error(`[CRON] Falló el envío de la notificación:`, error.message);
        }
    }
}


/**
 * El handler principal de la función de Netlify.
 */
export const handler: Handler = async () => {
  console.log('[Netlify Function] - checkReminders: Cron job triggered.');

  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
     console.error("[CRON] Las claves VAPID no están configuradas. No se pueden enviar notificaciones push.");
     return { statusCode: 500, body: 'VAPID keys are not set on the server.' };
  }

  webpush.setVapidDetails(
      process.env.VAPID_MAILTO || 'mailto:your-email@example.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
  );
  console.log('[CRON] VAPID details set.');

  try {
    const totalNotificationsSent = await checkAndSendNotifications();
    const successMessage = `Cron job completado. Se enviaron notificaciones para ${totalNotificationsSent} eventos.`;
    console.log(`[Netlify Function] - checkReminders: ${successMessage}`);
    return { statusCode: 200, body: successMessage };

  } catch (error: any) {
    console.error('[Netlify Function] - checkReminders: Error durante la ejecución:', error);
    return { statusCode: 500, body: `Error interno del servidor: ${error.message}` };
  }
}
