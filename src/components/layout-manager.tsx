'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';

const MainLayout = dynamic(() => import('./main-layout'), {
  loading: () => <div className="flex h-screen items-center justify-center">Cargando Interfaz...</div>,
});

function AuthErrorDisplay({ error, onSignOut }: { error: string, onSignOut: () => void }) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <AlertTriangle className="h-12 w-12 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl">Error de Autenticación</CardTitle>
                    <CardDescription>
                        Ocurrió un error crítico al verificar tu cuenta.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">Detalle del error:</p>
                    <pre className="text-xs p-2 bg-muted rounded-md whitespace-pre-wrap">
                        {error}
                    </pre>
                    <Button variant="outline" onClick={onSignOut} className="w-full">
                        Volver al Inicio de Sesión
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

export default function LayoutManager({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, appUser, loading, authError, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't run redirection logic if there's an error or we are still loading
    if (loading || authError) {
      return;
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
  }, [user, appUser, loading, authError, pathname, router]);

  // --- Render Logic ---
  
  if (authError) {
      return <AuthErrorDisplay error={authError} onSignOut={signOut} />;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-4 text-muted-foreground">Verificando acceso...</span>
      </div>
    );
  }

  const isAuthPage = !pathname.startsWith('/login') && !pathname.startsWith('/contract');
  const needsAuthData = isAuthPage && (!user || !appUser);

  if(needsAuthData && pathname !== '/unauthorized' && pathname !== '/pending-activation') {
      return (
          <div className="flex h-screen items-center justify-center bg-muted/40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-4 text-muted-foreground">Verificando acceso...</span>
          </div>
      );
  }
  
  if (appUser?.role === 'admin' && !pathname.startsWith('/colaborador')) {
      return <MainLayout>{children}</MainLayout>;
  }

  return <>{children}</>;
}
