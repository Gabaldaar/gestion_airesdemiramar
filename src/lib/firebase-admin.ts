
import admin from 'firebase-admin';

// This configuration is for the client-side SDK and is used for reference.
// The admin SDK is initialized by the environment.
const firebaseConfig = {
  "projectId": "miramar-rentals-manager",
  "appId": "1:720916580948:web:d084f764e635bda76f3bc1",
  "storageBucket": "miramar-rentals-manager.appspot.com",
  "apiKey": "AIzaSyCeewCiDeeQ8CCPdAKQdx6TlpedNZnCE5Y",
  "authDomain": "miramar-rentals-manager.firebaseapp.com",
  "messagingSenderId": "720916580948"
};

// The Firebase Admin SDK is automatically initialized by the App Hosting environment.
// We can check if it's already initialized to avoid errors.
if (!admin.apps.length) {
  // This initialization is a fallback for local development or other environments
  // and will only work if the GOOGLE_APPLICATION_CREDENTIALS environment variable is set.
  // In the managed App Hosting environment, this block is typically not needed.
  console.log("Initializing Firebase Admin SDK...");
  admin.initializeApp();
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminDb, adminAuth };
