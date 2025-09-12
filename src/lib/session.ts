
'use server';

import { auth } from './firebase-admin'; // Using admin SDK on the server
import { headers } from 'next/headers';

/**
 * Gets the current user's UID by verifying the Authorization header.
 * This should be called at the beginning of any server action
 * that needs to perform an authenticated operation.
 * It throws an error if the user is not authenticated.
 */
export async function getSession(): Promise<{ uid: string }> {
    const headerPayload = headers();
    const idToken = headerPayload.get('Authorization')?.split('Bearer ')[1];
    
    if (!idToken) {
        throw new Error("7 PERMISSION_DENIED: No authentication token provided in headers.");
    }

    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        return { uid: decodedToken.uid };
    } catch (error: any) {
        console.error("Error verifying token in getSession:", error.message);
        throw new Error(`7 PERMISSION_DENIED: Invalid or expired token. ${error.message}`);
    }
}
