
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

  const isPublicPage = pathname === '/login' || pathname === '/register' || pathname.startsWith('/contract');
  const isStatusPage = pathname === '/pending-activation' || pathname === '/unauthorized';

  useEffect(() => {
    if (loading) {
      return; // Wait until authentication is resolved
    }

    if (!user && !isPublicPage && !isStatusPage) {
      router.push('/login');
      return;
    }

    if (user) {
      if (!appUser) {
        // This case might happen transiently or if getProviderByEmail fails.
        // The failsafe in AuthProvider should prevent this, but as a backup, redirect.
        if (!isStatusPage) router.push('/unauthorized');
        return;
      }
      
      if (appUser.status === 'pending' && pathname !== '/pending-activation') {
        router.push('/pending-activation');
      } else if (appUser.status === 'active' && (isStatusPage || (isPublicPage && !pathname.startsWith('/contract')))) {
        router.push('/');
      }
    }
  }, [user, appUser, loading, pathname, isPublicPage, isStatusPage, router]);
  
  // Show loading screen while auth state is being determined
  if (loading) {
     return (
      <div className="flex h-screen items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-4 text-muted-foreground">Verificando acceso...</span>
      </div>
     );
  }

  // If loading is finished, determine what to render
  if (!user && !isPublicPage) {
    // If not logged in and trying to access a protected page, show loading while redirecting.
     return (
      <div className="flex h-screen items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-4 text-muted-foreground">Redirigiendo...</span>
      </div>
     );
  }

  if (isPublicPage || isStatusPage) {
    return <>{children}</>;
  }

  if (user && appUser?.status === 'active') {
    return <MainLayout>{children}</MainLayout>;
  }

  // Fallback for any other transient state during redirection
  return (
      <div className="flex h-screen items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
}
