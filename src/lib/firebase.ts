
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth }from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "miramar-rentals-manager",
  "appId": "1:720916580948:web:d084f764e635bda76f3bc1",
  "storageBucket": "miramar-rentals-manager.appspot.com",
  "apiKey": "AIzaSyCeewCiDeeQ8CCPdAKQdx6TlpedNZnCE5Y",
  "authDomain": "miramar-rentals-manager.firebaseapp.com",
  "messagingSenderId": "720916580948"
};

// Initialize Firebase for SSR
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);


export { app, auth, db };
