// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// These variables are populated by Next.js using the .env file
// and the environment variables set in your hosting provider (e.g., Netlify).
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const configKeys: (keyof typeof firebaseConfig)[] = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingConfig = configKeys.filter(key => !firebaseConfig[key]);

if (missingConfig.length > 0) {
  // Do not throw an error for measurementId as it is often optional
  if(!(missingConfig.length === 1 && missingConfig[0] === 'measurementId')) {
    throw new Error(`Missing Firebase config environment variables: ${missingConfig.join(", ")}. Please set them in your deployment environment.`);
  }
}


// Initialize Firebase
// We check if any apps are already initialized to prevent re-initialization errors.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };
