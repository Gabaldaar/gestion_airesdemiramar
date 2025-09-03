
'use server'
 
import { redirect } from 'next/navigation'
import { getSession, setSession, deleteSession } from '@/lib/session';
import { APP_PASSWORD } from './constants';
 
export async function loginAction(formData: FormData) {
  const password = formData.get('password')
 
  if (password !== APP_PASSWORD) {
    return { error: 'Clave incorrecta.' };
  }
 
  await setSession();
  redirect('/')
}

export async function logoutAction() {
  await deleteSession();
  redirect('/login');
}
