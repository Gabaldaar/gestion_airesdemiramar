
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
      // While loading, do nothing and show the loading screen.
      return;
    }

    if (!user) {
      // If not loading and no user, redirect to login if not on a public page.
      if (!isPublicPage) {
        router.push('/login');
      }
      return;
    }

    // If we reach here, user is logged in. Now check appUser profile.
    if (appUser) {
      if (appUser.status === 'pending') {
        if (pathname !== '/pending-activation') {
          router.push('/pending-activation');
        }
      } else if (appUser.status === 'active') {
        if (isPublicPage && pathname !== '/contract') {
          router.push('/');
        }
      }
    } else {
        // This case should theoretically not be hit due to the failsafe in AuthProvider,
        // but as an extra guard, we redirect to unauthorized.
        if (pathname !== '/unauthorized') {
            router.push('/unauthorized');
        }
    }

  }, [user, appUser, loading, isPublicPage, pathname, router]);
  
  if (loading && !isPublicPage) {
     return (
      <div className="flex h-screen items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-4 text-muted-foreground">Verificando acceso...</span>
      </div>
     );
  }

  if (isPublicPage) {
    return <>{children}</>;
  }

  // If user is logged in and their profile is determined and active, show the layout.
  if (user && appUser?.status === 'active') {
    return <MainLayout>{children}</MainLayout>;
  }

  // Fallback for any other intermediate state (like redirects being processed).
  return (
      <div className="flex h-screen items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
}
