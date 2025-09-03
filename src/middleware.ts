
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkAuth } from './lib/auth';

const PROTECTED_ROUTES = ['/', '/properties', '/bookings', '/tenants', '/expenses', '/reports', '/settings'];
const LOGIN_ROUTE = '/login';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = await checkAuth();

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route) && (route !== '/' || pathname === '/'));

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL(LOGIN_ROUTE, request.url));
  }

  if (pathname === LOGIN_ROUTE && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
