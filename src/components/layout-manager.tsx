
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

  // This effect handles all redirection logic
  useEffect(() => {
    if (loading || authError) {
      return; // Stop if we're still loading or if there's an error
    }

    const isPublicPage = pathname === '/login' || pathname.startsWith('/contract');
    const isStatusPage = pathname === '/pending-activation' || pathname === '/unauthorized';

    // Case 1: User is NOT logged in
    if (!user) {
      if (!isPublicPage) {
        router.push('/login');
      }
      return;
    }

    // Case 2: User IS logged in
    if (!appUser) {
      if (!isStatusPage) {
        router.push('/unauthorized');
      }
      return;
    }

    // Case 3: User has a profile but is pending
    if (appUser.status === 'pending') {
      if (!isStatusPage) {
        router.push('/pending-activation');
      }
      return;
    }
    
    // Case 4: User is active and authorized
    if (appUser.status === 'active') {
        if (appUser.role === 'admin' && pathname.startsWith('/colaborador')) {
          router.push('/');
          return;
        }

        if (appUser.role === 'provider' && !pathname.startsWith('/colaborador')) {
          router.push('/colaborador/dashboard');
          return;
        }

        if (isPublicPage || isStatusPage) {
           if (!pathname.startsWith('/contract')) router.push('/');
        }
    }
  }, [user, appUser, loading, pathname, router, authError]);

  // This block handles what to RENDER based on the current state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-4 text-muted-foreground">Verificando acceso...</span>
      </div>
    );
  }

  if (authError) {
    return <AuthErrorDisplay error={authError} onSignOut={signOut} />;
  }
  
  const needsMainLayout = user && appUser?.status === 'active' && appUser?.role === 'admin';
  const isCollaboratorPage = user && appUser?.status === 'active' && appUser?.role === 'provider';
  
  // Decide which top-level layout to render
  if (needsMainLayout && !pathname.startsWith('/colaborador') && !pathname.startsWith('/contract')) {
      return <MainLayout>{children}</MainLayout>;
  }
  
  if (isCollaboratorPage && pathname.startsWith('/colaborador')) {
      return <>{children}</>;
  }
  
  // For login, status pages, contract view, or during redirection, just render the page content.
  return <>{children}</>;
}
