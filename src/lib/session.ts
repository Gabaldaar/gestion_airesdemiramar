
'use server';

import { auth, db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { headers } from 'next/headers';
import { User, getAuth } from 'firebase/auth';

const SESSION_COLLECTION = '_sessions';

/**
 * Saves the user's session token to Firestore.
 * This is called from the client-side when the user logs in.
 * @param idToken The Firebase ID token of the logged-in user.
 */
export async function setSession(idToken: string) {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const sessionDocRef = doc(db, SESSION_COLLECTION, uid);
    await setDoc(sessionDocRef, { 
        idToken,
        // Add a timestamp to know when it was created/updated
        timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error("Error verifying and setting session:", error);
    throw new Error("Failed to create session on the server.");
  }
}

/**
 * Gets the current user's session from the server-side context.
 * This should be called at the beginning of any server action
 * that needs to perform an authenticated operation.
 * It throws an error if the user is not authenticated.
 */
export async function getSession(): Promise<{ uid: string }> {
    const headerPayload = headers();
    const idToken = headerPayload.get('Authorization')?.split('Bearer ')[1];
    
    if (!idToken) {
        throw new Error("7 PERMISSION_DENIED: No authentication token provided.");
    }

    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Additionally, check if the session exists in our Firestore collection
        // This validates that the session was set by our app's login flow.
        const sessionDocRef = doc(db, SESSION_COLLECTION, uid);
        const sessionDoc = await getDoc(sessionDocRef);

        if (!sessionDoc.exists()) {
             throw new Error("7 PERMISSION_DENIED: Session does not exist or has been cleared.");
        }
        
        return { uid };
    } catch (error: any) {
        console.error("Error verifying token in getSession:", error.message);
        throw new Error(`7 PERMISSION_DENIED: ${error.message}`);
    }
}
