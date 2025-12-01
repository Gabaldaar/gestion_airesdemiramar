
import type { Handler } from '@netlify/functions';
import admin from 'firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import webpush, { type PushSubscription } from 'web-push';
import { differenceInDays, startOfToday } from 'date-fns';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.");
    }
    
    // Parse the service account key from a base64 encoded string
    const decodedKey = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(decodedKey);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
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
