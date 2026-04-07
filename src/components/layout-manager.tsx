
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
      return; // Wait for auth to finish
    }

    const isPublicPage = pathname === '/login' || pathname.startsWith('/contract');
    const isStatusPage = pathname === '/pending-activation' || pathname === '/unauthorized';

    // 1. If not logged in, redirect to login unless it's a public page
    if (!user) {
      if (!isPublicPage) {
        router.push('/login');
      }
      return;
    }

    // --- User IS logged in from here ---
    
    // 2. If user is NOT in the database, they are unauthorized.
    if (!appUser) {
      if (pathname !== '/unauthorized') {
        router.push('/unauthorized');
      }
      return;
    }
    
    // 3. User IS in the database (appUser exists).
    // Handle pending status
    if (appUser.status === 'pending') {
        if (pathname !== '/pending-activation') {
            router.push('/pending-activation');
        }
        return;
    }

    // Handle active status
    if (appUser.status === 'active') {
        // If an admin is on the collaborator page, redirect to home
        if (appUser.role === 'admin' && pathname.startsWith('/colaborador')) {
            router.push('/');
            return;
        }
        // If a provider is NOT on their dashboard, redirect them there
        if (appUser.role === 'provider' && !pathname.startsWith('/colaborador')) {
            router.push('/colaborador/dashboard');
            return;
        }
        // If an active user lands on a public/status page, redirect home
        if (isPublicPage || isStatusPage) {
            if (!pathname.startsWith('/contract')) {
                 router.push('/');
            }
        }
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

  if (!user) {
    // Show login page, or any other public page content
    return <>{children}</>;
  }

  if (!appUser) {
    // Show unauthorized page while redirecting
    return <>{children}</>;
  }
  
  if (appUser.status === 'pending') {
      // Show pending page
      return <>{children}</>;
  }

  if (appUser.role === 'provider') {
    // Show collaborator dashboard
    return <>{children}</>;
  }

  if (appUser.role === 'admin') {
    // Show full app layout for admin
    return <MainLayout>{children}</MainLayout>;
  }

  // Fallback loader, should ideally not be reached.
  return (
      <div className="flex h-screen items-center justify-center bg-muted/40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
  );
}
