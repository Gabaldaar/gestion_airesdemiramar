
// netlify/functions/checkReminders.ts
'use server';

import type { Handler } from '@netlify/functions';
import admin from 'firebase-admin';
import webpush, { type PushSubscription } from 'web-push';
import { differenceInDays, startOfToday, endOfDay, addDays } from 'date-fns';

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
  fieldToUpdate: 'initialCheckoutNotificationSent' | 'initialCheckinNotificationSent' | 'finalCheckoutNotificationSent' | 'finalCheckinNotificationSent';
}

async function checkAndSendNotifications() {
    let notificationsSent = 0;
    // Lee la configuración guardada por el usuario, o usa valores por defecto (7 días para check-in, 3 para check-out).
    const alertSettingsDoc = await db.collection('settings').doc('alerts').get();
    const alertSettings = alertSettingsDoc.exists ? alertSettingsDoc.data() : { checkInDays: 7, checkOutDays: 3 };


    const notificationTriggers: NotificationTriggerData[] = [];
    const today = startOfToday();

    // --- 1. Lógica para Check-outs ---
    const checkOutLimitDate = endOfDay(addDays(today, alertSettings?.checkOutDays || 3));
    const checkOutsSnap = await db.collection('rentals')
                              .where('status', '==', 'active')
                              .where('endDate', '>=', today)
                              .where('endDate', '<=', checkOutLimitDate)
                              .get();
                              
    if (!checkOutsSnap.empty) {
        for (const doc of checkOutsSnap.docs) {
            const rental = doc.data();
            const rentalEndDate = new Date(rental.endDate.toDate ? rental.endDate.toDate() : rental.endDate);
            const daysUntilCheckout = differenceInDays(rentalEndDate, today);

            // Condición 1: Primer aviso (si no se ha enviado antes)
            if (!rental.initialCheckoutNotificationSent) {
                notificationTriggers.push({
                    id: `${doc.id}-checkout-initial`,
                    title: 'Check-out Próximo',
                    body: `El check-out de ${rental.tenantName} en "${rental.propertyName}" es pronto.`,
                    icon: '/icons/icon-192x192.png',
                    docPath: doc.ref.path,
                    fieldToUpdate: 'initialCheckoutNotificationSent'
                });
            }
            // Condición 2: Aviso final (si no se ha enviado antes y falta 1 día)
            if (daysUntilCheckout === 1 && !rental.finalCheckoutNotificationSent) {
                 notificationTriggers.push({
                    id: `${doc.id}-checkout-final`,
                    title: '¡Mañana es el Check-out!',
                    body: `Recuerda el check-out de ${rental.tenantName} en "${rental.propertyName}" mañana.`,
                    icon: '/icons/icon-192x192.png',
                    docPath: doc.ref.path,
                    fieldToUpdate: 'finalCheckoutNotificationSent'
                });
            }
        }
    }
    
    // --- 2. Lógica para Check-ins ---
    const checkInLimitDate = endOfDay(addDays(today, alertSettings?.checkInDays || 7));
    const checkInsSnap = await db.collection('rentals')
                              .where('status', '==', 'active')
                              .where('startDate', '>=', today)
                              .where('startDate', '<=', checkInLimitDate)
                              .get();

    if (!checkInsSnap.empty) {
        for (const doc of checkInsSnap.docs) {
            const rental = doc.data();
            const rentalStartDate = new Date(rental.startDate.toDate ? rental.startDate.toDate() : rental.startDate);
            const daysUntilCheckin = differenceInDays(rentalStartDate, today);

            // Condición 1: Primer aviso
            if (!rental.initialCheckinNotificationSent) {
                notificationTriggers.push({
                    id: `${doc.id}-checkin-initial`,
                    title: 'Check-in Próximo',
                    body: `El check-in de ${rental.tenantName} en "${rental.propertyName}" es pronto.`,
                    icon: '/icons/icon-192x192.png',
                    docPath: doc.ref.path,
                    fieldToUpdate: 'initialCheckinNotificationSent'
                });
            }
            // Condición 2: Aviso final
            if (daysUntilCheckin === 1 && !rental.finalCheckinNotificationSent) {
                 notificationTriggers.push({
                    id: `${doc.id}-checkin-final`,
                    title: '¡Mañana hay un Check-in!',
                    body: `Recuerda el check-in de ${rental.tenantName} en "${rental.propertyName}" mañana.`,
                    icon: '/icons/icon-192x192.png',
                    docPath: doc.ref.path,
                    fieldToUpdate: 'finalCheckinNotificationSent'
                });
            }
        }
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

        // Marcar el tipo de notificación específica como enviada.
        await db.doc(trigger.docPath).update({
            [trigger.fieldToUpdate]: new Date().toISOString()
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
