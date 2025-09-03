
'use server';

import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, APP_PASSWORD } from './constants';

/**
 * Checks if the user is authenticated by verifying the cookie.
 * This should only be called from server components, server actions, or middleware.
 */
export async function checkAuth(): Promise<boolean> {
  const cookieStore = cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
  return authCookie?.value === APP_PASSWORD;
}


/**
 * Deletes the authentication cookie to log the user out.
 * This is a server action.
 */
export async function deleteAuthCookie(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}
