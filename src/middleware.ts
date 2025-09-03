
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/', '/properties', '/bookings', '/tenants', '/expenses', '/reports', '/settings'];
const LOGIN_ROUTE = '/login';
const AUTH_COOKIE_NAME = 'auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookie = request.cookies.get(AUTH_COOKIE_NAME);
  
  // Directly get password from environment variable. It might not be available here depending on build process,
  // but it's the correct way to reference it.
  const appPassword = process.env.APP_PASSWORD || 'miramar2024';
  const isAuthenticated = cookie?.value === appPassword;

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route) && (route !== '/' || pathname === '/'));
  
  if (isProtectedRoute && !isAuthenticated) {
    // Si no está autenticado y trata de acceder a una ruta protegida, redirigir a login.
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_ROUTE;
    return NextResponse.redirect(url);
  }

  if (pathname === LOGIN_ROUTE && isAuthenticated) {
    // Si ya está autenticado y trata de acceder a login, redirigir al dashboard.
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
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
