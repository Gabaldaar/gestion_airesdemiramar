
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

// Your web app's Firebase configuration
// These values will be replaced by the system.
const firebaseConfig = {
  "projectId": "miramar-rentals-manager",
  "appId": "1:720916580948:web:d084f764e635bda76f3bc1",
  "storageBucket": "miramar-rentals-manager.appspot.com",
  "apiKey": "AIzaSyCeewCiDeeQ8CCPdAKQdx6TlpedNZnCE5Y",
  "authDomain": "miramar-rentals-manager.firebaseapp.com",
  "messagingSenderId": "720916580948"
};


const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };
