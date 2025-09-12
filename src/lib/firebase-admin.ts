
import admin from 'firebase-admin';

// The Firebase Admin SDK is automatically initialized by the App Hosting environment.
// We can check if it's already initialized to avoid errors.
if (!admin.apps.length) {
  // This initialization is a fallback for local development or other environments
  // and will only work if the GOOGLE_APPLICATION_CREDENTIALS environment variable is set.
  // In the managed App Hosting environment, this block is typically not needed.
  console.log("Initializing Firebase Admin SDK for local development...");
  admin.initializeApp();
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminDb, adminAuth };
