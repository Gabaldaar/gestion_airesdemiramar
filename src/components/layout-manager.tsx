
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const MainLayout = dynamic(() => import('./main-layout'), {
  loading: () => <div className="flex h-screen items-center justify-center">Cargando...</div>,
});


export default function LayoutManager({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, appUser, loading } = useAuth();
  const router = useRouter();

  const isPublicPage = pathname === '/login' || pathname === '/register' || pathname.startsWith('/contract') || pathname === '/pending-activation' || pathname === '/unauthorized';

  useEffect(() => {
    if (loading) {
      return; // Wait until auth state and app user profile are fully loaded.
    }

    // --- After loading is complete ---

    // CASE 1: User is NOT logged in
    if (!user) {
      if (!isPublicPage) {
        router.push('/login');
      }
      // If on a public page, do nothing and allow access.
      return;
    }

    // CASE 2: User IS logged in (user object exists)
    // Because loading is false, the appUser object is guaranteed to be either a user profile or null.

    if (!appUser) {
        // This can happen if the user's email is not in the provider list and the admin failsafe didn't run.
        // This is the gate for unauthorized users.
        if (pathname !== '/unauthorized') {
            router.push('/unauthorized');
        }
        return;
    }

    // `appUser` is now guaranteed to exist.
    if (appUser.status === 'pending') {
      if (pathname !== '/pending-activation') {
        router.push('/pending-activation');
      }
    } else if (appUser.status === 'active') {
      // User is active. If they are trying to access a public page, redirect them to the dashboard.
      if (isPublicPage && pathname !== '/contract') { // Allow direct access to contract pages
        router.push('/');
      }
    }

  }, [user, appUser, loading, isPublicPage, pathname, router]);
  
  // Show a loading screen while auth is being determined on protected pages.
  if (loading && !isPublicPage) {
     return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-4 text-muted-foreground">Verificando acceso...</span>
      </div>
     );
  }

  // If on a public page, just render the content without the main layout.
  // This also covers the brief moment before a redirect happens.
  if (isPublicPage) {
    return <>{children}</>;
  }

  // If we've passed all checks, user is authenticated and authorized. Render the main app layout.
  if (user && appUser?.status === 'active') {
    return <MainLayout>{children}</MainLayout>;
  }

  // Fallback loader for any other intermediate states during redirects.
  return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
}
