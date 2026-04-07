'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const MainLayout = dynamic(() => import('./main-layout'), {
  loading: () => <div className="flex h-screen items-center justify-center">Cargando Interfaz...</div>,
});
const ColaboradorDashboard = dynamic(() => import('./colaborador-dashboard'), {
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
    const isCollaboratorDashboard = pathname.startsWith('/colaborador');

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
      } else if (appUser.status === 'active') {
        if (appUser.role === 'provider' && !isCollaboratorDashboard) {
            router.push('/colaborador/dashboard');
        } else if (appUser.role === 'admin' && isCollaboratorDashboard) {
            router.push('/');
        } else if (appUser.role === 'admin' && (isPublicPage || isStatusPage)) {
            if (!pathname.startsWith('/contract')) {
                router.push('/');
             }
        }
      }
    } 
    else {
       if (isStatusPage) {
         router.push('/unauthorized');
       } else if (isPublicPage && !pathname.startsWith('/contract')) {
         router.push('/');
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
  
  const isAuthPage = pathname === '/login' || pathname === '/pending-activation' || pathname === '/unauthorized';
  
  // If user is logged in and everything is resolved...
  if (user) {
    if (appUser?.status === 'active') {
        if (appUser.role === 'provider') {
            // Render the collaborator layout directly
            return <>{children}</>;
        }
        // If admin, show main layout
        return <MainLayout>{children}</MainLayout>;
    }
    
    // Handle pending/unauthorized users on their respective pages
    if ((appUser?.status === 'pending' && pathname === '/pending-activation') || (!appUser && pathname === '/unauthorized')) {
        return <>{children}</>;
    }

    // Fallback loading state while redirecting
    return (
        <div className="flex h-screen items-center justify-center bg-muted/40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  // If not logged in, show the children (which should be the login page)
  return <>{children}</>;
}
