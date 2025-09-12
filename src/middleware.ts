
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getClientSideToken } from './components/auth-provider';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  
  // This is a workaround to pass the client-side token to server actions
  // as middleware doesn't have access to client-side module state directly.
  // In a real app, you might get this token from an HttpOnly cookie.
  const token = request.cookies.get('firebaseIdToken')?.value;

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/:path*',
}
