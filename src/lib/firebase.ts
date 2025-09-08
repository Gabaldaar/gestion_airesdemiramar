
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

// Your web app's Firebase configuration
// These values will be replaced by the system.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_AUTH_DOMAIN_HERE",
  projectId: "YOUR_PROJECT_ID_HERE",
  storageBucket: "YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE",
  appId: "YOUR_APP_ID_HERE",
  measurementId: "YOUR_MEASUREMENT_ID_HERE"
};


const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };
