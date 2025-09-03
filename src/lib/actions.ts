
'use server'
 
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { APP_PASSWORD, AUTH_COOKIE_NAME } from './constants'
 
export async function loginAction(prevState: { error: string } | undefined, formData: FormData) {
  const password = formData.get('password')
 
  if (password === APP_PASSWORD) {
    cookies().set(AUTH_COOKIE_NAME, password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })
    redirect('/')
  } else {
    return { error: 'La contraseña es incorrecta.' }
  }
}

export async function logoutAction() {
  cookies().delete(AUTH_COOKIE_NAME);
  redirect('/login');
}
