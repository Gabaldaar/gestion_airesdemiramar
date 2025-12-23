
// netlify/functions/checkReminders.ts
'use server';

import type { Handler } from '@netlify/functions';
import admin from 'firebase-admin';
import webpush, { type PushSubscription } from 'web-push';
import { differenceInDays, startOfToday } from 'date-fns';

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
  fieldToUpdate: string; // Campo dinámico para la bandera de notificación
}

async function checkAndSendNotifications() {
    let notificationsSent = 0;
    
    // Arrays con los días específicos en los que se debe notificar
    const CHECKIN_NOTIFICATION_DAYS = [7, 4, 2, 1];
    const CHECKOUT_NOTIFICATION_DAYS = [3, 2, 1];

    const notificationTriggers: NotificationTriggerData[] = [];
    const today = startOfToday();

    // Consulta corregida: Obtener todas las reservas que NO estén canceladas.
    // Esto es más robusto y permite que el código filtre por fechas.
    const bookingsSnap = await db.collection('bookings').where('status', '!=', 'cancelled').get();


    if (bookingsSnap.empty) {
        console.log('[CRON] No hay alquileres activos, futuros o pendientes.');
        return 0;
    }

    for (const doc of bookingsSnap.docs) {
        const rental = doc.data();
        // Ignorar si el estado es 'pending' (en espera), ya que no requiere notificación aún.
        if (rental.status === 'pending') {
            continue;
        }

        // Conversión segura de Timestamps o strings a Date
        const rentalStartDate = rental.startDate?.toDate ? rental.startDate.toDate() : new Date(rental.startDate);
        const rentalEndDate = rental.endDate?.toDate ? rental.endDate.toDate() : new Date(rental.endDate);
        
        // Ignorar si las fechas son inválidas
        if (isNaN(rentalStartDate.getTime()) || isNaN(rentalEndDate.getTime())) {
            console.warn(`[CRON] Saltando reserva ${doc.id} por tener fechas inválidas.`);
            continue;
        }
        
        // Solo procesar reservas que no hayan terminado ya
        if (rentalEndDate < today) {
            continue;
        }

        const daysUntilCheckin = differenceInDays(rentalStartDate, today);
        const daysUntilCheckout = differenceInDays(rentalEndDate, today);

        // --- Lógica de Notificación para Check-in ---
        if (daysUntilCheckin >= 0) {
            for (const day of CHECKIN_NOTIFICATION_DAYS) {
                const flagField = `checkin_notification_sent_${day}_days`;
                if (daysUntilCheckin === day && !rental[flagField]) {
                    notificationTriggers.push({
                        id: `${doc.id}-checkin-${day}d`,
                        title: `Próximo Check-in en ${day} ${day > 1 ? 'días' : 'día'}`,
                        body: `El check-in de ${rental.tenantName} en "${rental.propertyName}" es en ${day} ${day > 1 ? 'días' : 'día'}.`,
                        icon: '/icons/icon-192x192.png',
                        docPath: doc.ref.path,
                        fieldToUpdate: flagField
                    });
                }
            }
        }
        
        // --- Lógica de Notificación para Check-out ---
        if (daysUntilCheckout >= 0) {
            for (const day of CHECKOUT_NOTIFICATION_DAYS) {
                const flagField = `checkout_notification_sent_${day}_days`;
                if (daysUntilCheckout === day && !rental[flagField]) {
                    notificationTriggers.push({
                        id: `${doc.id}-checkout-${day}d`,
                        title: `Próximo Check-out en ${day} ${day > 1 ? 'días' : 'día'}`,
                        body: `El check-out de ${rental.tenantName} en "${rental.propertyName}" es en ${day} ${day > 1 ? 'días' : 'día'}.`,
                        icon: '/icons/icon-192x192.png',
                        docPath: doc.ref.path,
                        fieldToUpdate: flagField
                    });
                }
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

        // Marcar la bandera específica de esta notificación como enviada.
        await db.doc(trigger.docPath).update({
            [trigger.fieldToUpdate]: true // Usamos un booleano
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
