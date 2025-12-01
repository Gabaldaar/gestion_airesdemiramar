
import type { Handler } from '@netlify/functions';
import admin from 'firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import webpush, { type PushSubscription } from 'web-push';
import { differenceInDays, startOfToday } from 'date-fns';

// --- Firebase Admin SDK Initialization ---
try {
    const privateKey = process.env.FB_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!process.env.FB_PROJECT_ID || !privateKey || !process.env.FB_CLIENT_EMAIL) {
        throw new Error('Missing required Firebase environment variables (FB_PROJECT_ID, FB_PRIVATE_KEY, FB_CLIENT_EMAIL).');
    }

    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.FB_PROJECT_ID,
      private_key_id: process.env.FB_PRIVATE_KEY_ID,
      private_key: privateKey,
      client_email: process.env.FB_CLIENT_EMAIL,
      client_id: process.env.FB_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FB_CLIENT_X509_CERT_URL,
    };
    
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
        });
    }
} catch (error: any) {
    console.error(`[CRON] Failed to initialize Firebase Admin SDK: ${error.message}`);
    // No lanzamos un error aquí para que Netlify no mate la función antes de que pueda devolver una respuesta.
}


const db = getFirestore();

// --- Type definitions adapted for this function ---

type Booking = {
  id: string;
  tenantId: string;
  propertyId: string;
  startDate: string;
  endDate: string;
  status?: 'active' | 'cancelled' | 'pending';
};

type Tenant = { id: string; name: string; };
type Property = { id: string; name: string; };
type AlertSettings = { checkInDays: number; };
type StoredPushSubscription = { endpoint: string; keys: { p256dh: string; auth: string; } };

// Helper to process Firestore documents
const processDoc = (doc: admin.firestore.DocumentSnapshot) => {
    const data = doc.data();
    if (!data) return null;
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate().toISOString();
        }
    }
    return { id: doc.id, ...data };
};

// --- Data fetching functions adapted for Firebase Admin SDK ---

async function getAlertSettings(): Promise<AlertSettings | null> {
    const docRef = db.collection('settings').doc('alerts');
    const docSnap = await docRef.get();
    return docSnap.exists ? docSnap.data() as AlertSettings : null;
}

async function getActiveBookings(): Promise<Booking[]> {
    const q = db.collection('bookings').where('status', '==', 'active');
    const snapshot = await q.get();
    return snapshot.docs.map(doc => processDoc(doc) as Booking);
}

async function getDocById<T>(collection: string, id: string): Promise<T | null> {
    if (!id) return null;
    const docSnap = await db.collection(collection).doc(id).get();
    return docSnap.exists ? processDoc(docSnap) as T : null;
}

async function getAllSubscriptions(): Promise<StoredPushSubscription[]> {
    const subscriptionsSnap = await db.collection('pushSubscriptions').get();
    if (subscriptionsSnap.empty) {
        return [];
    }
    return subscriptionsSnap.docs.map(doc => doc.data() as StoredPushSubscription);
}

async function deleteSubscription(subscriptionEndpoint: string): Promise<void> {
    const safeId = Buffer.from(subscriptionEndpoint).toString('base64');
    await db.collection('pushSubscriptions').doc(safeId).delete();
}

async function sendNotification(subscription: StoredPushSubscription, payload: string) {
  try {
    await webpush.sendNotification(subscription, payload);
    console.log('[CRON] Notification sent successfully.');
  } catch (error: any) {
    console.error(`[CRON] Error sending notification: ${error.message}`);
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log('[CRON] Subscription has expired or is invalid. Deleting.');
      await deleteSubscription(subscription.endpoint).catch(delErr => {
          console.error(`[CRON] Failed to delete expired subscription ${subscription.endpoint}:`, delErr);
      });
    }
  }
}

// --- Main Handler Logic ---

export const handler: Handler = async () => {
    console.log('[Netlify Function] - checkReminders: Cron job triggered.');

    // Check if Firebase was initialized correctly
    if (!admin.apps.length) {
        const errorMessage = 'Firebase Admin SDK not initialized. Check environment variables.';
        console.error(`[CRON] ${errorMessage}`);
        return { statusCode: 500, body: errorMessage };
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidMailto = process.env.VAPID_MAILTO;

    if (!vapidPublicKey || !vapidPrivateKey || !vapidMailto) {
        console.error("[CRON] VAPID keys or mailto are not set.");
        return { statusCode: 500, body: 'VAPID keys are not configured.' };
    }

    try {
        webpush.setVapidDetails(`mailto:${vapidMailto}`, vapidPublicKey, vapidPrivateKey);
        console.log('[CRON] VAPID details set.');

        const alertSettings = await getAlertSettings();
        if (!alertSettings) {
            console.log('[CRON] No alert settings found. Skipping checks.');
            return { statusCode: 200, body: 'No alert settings configured.' };
        }

        const [allBookings, allSubscriptions] = await Promise.all([
            getActiveBookings(),
            getAllSubscriptions()
        ]);

        if (allSubscriptions.length === 0) {
            console.log('[CRON] No active push subscriptions found.');
            return { statusCode: 200, body: 'No subscriptions to send notifications to.' };
        }

        const today = startOfToday();
        let notificationsSentCount = 0;

        for (const booking of allBookings) {
            const checkInDate = new Date(booking.startDate);
            const daysUntilCheckIn = differenceInDays(checkInDate, today);

            if (daysUntilCheckIn >= 0 && daysUntilCheckIn <= alertSettings.checkInDays) {
                const [tenant, property] = await Promise.all([
                    getDocById<Tenant>('tenants', booking.tenantId),
                    getDocById<Property>('properties', booking.propertyId)
                ]);

                const notificationPayload = JSON.stringify({
                    title: 'Recordatorio de Check-in',
                    body: `El inquilino ${tenant?.name || 'N/A'} llega a ${property?.name || 'N/A'} en ${daysUntilCheckIn} día(s).`,
                    icon: '/icons/icon-192x192.png'
                });

                const sendPromises = allSubscriptions.map(sub => sendNotification(sub, notificationPayload));
                await Promise.all(sendPromises);
                notificationsSentCount++;
            }
        }
        
        if (notificationsSentCount === 0) {
            console.log('[CRON] No notifications to send today.');
        }

        const successMessage = `CRON job executed. Sent ${notificationsSentCount} notification type(s) to ${allSubscriptions.length} subscription(s).`;
        console.log(`[CRON] ${successMessage}`);
        return { statusCode: 200, body: successMessage };

    } catch (error: any) {
        console.error('[CRON] An unexpected error occurred:', error);
        return { statusCode: 500, body: `Internal Server Error: ${error.message}` };
    }
};
