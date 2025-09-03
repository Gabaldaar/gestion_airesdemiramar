
'use server';

import { cookies } from 'next/headers';

const AUTH_COOKIE_NAME = 'auth';
// En una aplicación real, esta contraseña NUNCA debería estar en el código fuente.
// Debería ser una variable de entorno.
const APP_PASSWORD = process.env.APP_PASSWORD || 'miramar2024';

/**
 * Checks if the user is authenticated by verifying the cookie against the app password.
 * This should only be called from server components or server actions.
 */
export async function checkAuth(): Promise<boolean> {
  const cookieStore = cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
  return authCookie?.value === APP_PASSWORD;
}

/**
 * Sets the authentication cookie if the provided password is correct.
 * This is a server action to be called from a client component (login form).
 * @param password The password entered by the user.
 * @returns A promise that resolves to an object with a success boolean.
 */
export async function setAuthCookie(password: string): Promise<{ success: boolean }> {
  if (password === APP_PASSWORD) {
    const cookieStore = cookies();
    cookieStore.set(AUTH_COOKIE_NAME, password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    return { success: true };
  }
  return { success: false };
}

/**
 * Deletes the authentication cookie to log the user out.
 * This is a server action.
 */
export async function deleteAuthCookie(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}
