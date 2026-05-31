
// CLIENT-SIDE FIREBASE CONFIGURATION
import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "miramar-rentals-manager.firebaseapp.com",
  projectId: "miramar-rentals-manager",
  storageBucket: "miramar-rentals-manager.firebasestorage.app",
  messagingSenderId: "720916580948",
  appId: "1:720916580948:web:d084f764e635bda76f3bc1"
  // measurementId eliminado de aquí. Se gestiona de forma independiente en analytics.ts 
  // para evitar conflictos de validación del SDK.
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const storage = getStorage(app);
export const db = getFirestore(app);
