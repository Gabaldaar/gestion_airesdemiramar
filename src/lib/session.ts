
'use server';

import { auth } from './firebase-admin'; // Using admin SDK on the server
import { headers } from 'next/headers';
import { cookies } from 'next/headers';

/**
 * Gets the current user's UID by verifying the Authorization header from a cookie.
 * This should be called at the beginning of any server action
 * that needs to perform an authenticated operation.
 * It throws an error if the user is not authenticated.
 */
export async function getSession(): Promise<{ uid: string }> {
    const cookieStore = cookies();
    const idToken = cookieStore.get('firebaseIdToken')?.value;
    
    if (!idToken) {
        throw new Error("7 PERMISSION_DENIED: No authentication token found in cookies.");
    }

    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        return { uid: decodedToken.uid };
    } catch (error: any) {
        console.error("Error verifying token in getSession:", error.message);
        throw new Error(`7 PERMISSION_DENIED: Invalid or expired token. ${error.message}`);
    }
}
