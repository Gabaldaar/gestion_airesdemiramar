

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

  const isPublicPage = pathname === '/login' || pathname.startsWith('/contract') || pathname === '/pending-activation' || pathname === '/unauthorized';

  useEffect(() => {
    if (loading) {
      return; // Wait until auth state is loaded
    }
    
    // If not authenticated and not on a public page, redirect to login
    if (!user && !isPublicPage) {
      router.push('/login');
      return;
    }
    
    // If authenticated, handle routing based on appUser status
    if (user && appUser) {
        if (appUser.status === 'pending') {
            if (pathname !== '/pending-activation') {
                router.push('/pending-activation');
            }
        } else if (appUser.status === 'active') {
            // If user is active and tries to access a public page (like login), redirect to dashboard
            if (isPublicPage && pathname !== '/contract') { // Allow access to contract pages
                 router.push('/');
            }
        }
    } else if (user && !appUser && !isPublicPage) {
        // User is authenticated with Firebase, but not found in our DB
        router.push('/unauthorized');
    }

  }, [user, appUser, loading, isPublicPage, router, pathname]);
  
  // While initial user/appUser loading is in progress, show a loader on protected pages
  if (loading && !isPublicPage) {
     return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-4 text-muted-foreground">Verificando acceso...</span>
      </div>
     );
  }

  // If on a public page, just render the content
  if (isPublicPage) {
    return <>{children}</>;
  }

  // If user is authenticated and has an active appUser, render the main layout
  if (user && appUser && appUser.status === 'active') {
    return <MainLayout>{children}</MainLayout>;
  }

  // Fallback loader while redirects are happening
  return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
}

