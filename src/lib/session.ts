
'use server'

import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { AUTH_COOKIE_NAME, JWT_SECRET } from './constants'

const key = new TextEncoder().encode(JWT_SECRET)

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(key)
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    })
    return payload
  } catch (error) {
    return null
  }
}

export async function setSession() {
  // Create the session
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const session = await encrypt({ expires })
 
  // Save the session in a cookie
  cookies().set(AUTH_COOKIE_NAME, session, { expires, httpOnly: true })
}

export async function deleteSession() {
  cookies().delete(AUTH_COOKIE_NAME)
}
 
export async function getSession() {
  const cookie = cookies().get(AUTH_COOKIE_NAME)?.value
  if (!cookie) return null
  return await decrypt(cookie)
}
