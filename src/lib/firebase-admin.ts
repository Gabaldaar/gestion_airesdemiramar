
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccount: admin.ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    };
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const adminDb = admin.firestore();
