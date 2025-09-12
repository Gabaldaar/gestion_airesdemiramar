
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  
  // Pass the token from the cookie to the request headers for server actions
  const token = request.cookies.get('firebaseIdToken')?.value;

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  // You can also set request headers from cookies.
  // request.headers.set('x-hello-from-middleware1', 'hello')
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// See "Matching Paths" below to learn more
export const config = {
  // Match all paths except for static files and the login page image assets
  matcher: [
    '/((?!_next/static|favicon.ico|logo.png|logocont.png|firma.png|login).*)',
  ],
}
