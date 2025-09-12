
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "miramar-rentals-manager",
  "appId": "1:720916580948:web:d084f764e635bda76f3bc1",
  "storageBucket": "miramar-rentals-manager.firebasestorage.app",
  "apiKey": "AIzaSyCeewCiDeeQ8CCPdAKQdx6TlpedNZnCE5Y",
  "authDomain": "miramar-rentals-manager.firebaseapp.com",
  "messagingSenderId": "720916580948"
};

// Initialize Firebase for the client
function getFirebaseApp(): FirebaseApp {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  } else {
    return getApp();
  }
}

const app = getFirebaseApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
