// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { connectFirestoreEmulator } from "firebase/firestore";
import { connectStorageEmulator } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "miramar-rentals-manager",
  "appId": "1:720916580948:web:d084f764e635bda76f3bc1",
  "storageBucket": "miramar-rentals-manager.appspot.com",
  "apiKey": "AIzaSyCeewCiDeeQ8CCPdAKQdx6TlpedNZnCE5Y",
  "authDomain": "miramar-rentals-manager.firebaseapp.com",
  "messagingSenderId": "720916580948"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
