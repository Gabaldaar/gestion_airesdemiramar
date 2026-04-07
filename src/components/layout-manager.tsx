'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import MainLayout to avoid circular dependencies if it uses useAuth
const MainLayout = dynamic(() => import('./main-layout'), {
  loading: () => <div className="flex h-screen items-center justify-center">Cargando Interfaz...</div>,
});


export default function LayoutManager({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, appUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't do anything while auth state is loading
    if (loading) {
      return;
    }

    const isPublicPage = pathname === '/login' || pathname === '/register' || pathname.startsWith('/contract');
    const isStatusPage = pathname === '/pending-activation' || pathname === '/unauthorized';

    // If user is not logged in and not on a public/status page, redirect to login
    if (!user && !isPublicPage && !isStatusPage) {
      router.push('/login');
      return;
    }

    // If user is logged in, handle routing based on their app status
    if (user && appUser) {
      if (appUser.status === 'pending' && pathname !== '/pending-activation') {
        router.push('/pending-activation');
        return;
      }
      
      // If user is active but on a page they shouldn't be (like login), redirect to home
      if (appUser.status === 'active' && (isPublicPage || isStatusPage)) {
        if (!pathname.startsWith('/contract')) { // Contracts are public but need to be accessible while logged in
          router.push('/');
          return;
        }
      }
    }

  // The dependency array is crucial. It re-runs the effect when these values change.
  }, [user, appUser, loading, pathname, router]);
  
  // --- Render Logic ---

  // 1. Primary Loading State: Show this while the AuthProvider is figuring out who the user is.
  if (loading) {
     return (
      <div className="flex h-screen items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-4 text-muted-foreground">Verificando acceso...</span>
      </div>
     );
  }
  
  const isPublicPage = pathname === '/login' || pathname === '/register' || pathname.startsWith('/contract');
  const isStatusPage = pathname === '/pending-activation' || pathname === '/unauthorized';

  // 2. Public Pages: If on a public page, just render it. This allows login/register to be seen.
  if (isPublicPage || isStatusPage) {
    return <>{children}</>;
  }

  // 3. Authenticated User with Active Status: The user is logged in and cleared to see the app.
  if (user && appUser?.status === 'active') {
    return <MainLayout>{children}</MainLayout>;
  }

  // 4. Fallback: This renders a spinner during the brief moment of redirection, preventing flashes of incorrect content.
  return (
      <div className="flex h-screen items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
}
