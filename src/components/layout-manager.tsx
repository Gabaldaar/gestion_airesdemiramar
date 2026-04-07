
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const MainLayout = dynamic(() => import('./main-layout'), {
  loading: () => <div className="flex h-screen items-center justify-center">Cargando Interfaz...</div>,
});


export default function LayoutManager({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, appUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Do nothing while we are figuring out auth state
    }

    const isPublicPage = pathname === '/login' || pathname.startsWith('/contract');
    const isStatusPage = pathname === '/pending-activation' || pathname === '/unauthorized';

    // Logged out users
    if (!user) {
      if (!isPublicPage) {
        router.push('/login');
      }
      return;
    }

    // --- User is logged in at this point ---

    // The user has a specific profile in the database (provider or admin role)
    if (appUser) {
      if (appUser.status === 'pending' && pathname !== '/pending-activation') {
        router.push('/pending-activation');
      } else if (appUser.status === 'active' && (isPublicPage || isStatusPage)) {
         if (!pathname.startsWith('/contract')) {
            router.push('/');
         }
      }
    } 
    // The user is logged in but has no profile in DB -> they are the default admin or unauthorized
    else {
      // Let's check if they are trying to access a provider-only page
       if (isStatusPage) {
         router.push('/unauthorized');
       } else if (isPublicPage && !pathname.startsWith('/contract')) {
         router.push('/');
       }
       // Otherwise, they are the admin on an admin page, so we let them be.
    }

  }, [user, appUser, loading, pathname, router]);

  // --- Render Logic ---

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-4 text-muted-foreground">Verificando acceso...</span>
      </div>
    );
  }
  
  const isAuthPage = pathname === '/login' || pathname === '/pending-activation' || pathname === '/unauthorized';
  
  // If user is logged in and everything is resolved, show the main app layout
  if (user) {
    // If the user is on a status page they shouldn't be, show loading while redirecting
    if (appUser?.status === 'active' && isAuthPage) {
         return (
            <div className="flex h-screen items-center justify-center bg-muted/40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
         );
    }
    // If user is pending and on the right page, or on an auth page while logged out
    if ((appUser?.status === 'pending' && pathname === '/pending-activation') || (!appUser && pathname === '/unauthorized')) {
        return <>{children}</>;
    }

    return <MainLayout>{children}</MainLayout>;
  }

  // If not logged in, show the children (which should be the login page)
  return <>{children}</>;
}
