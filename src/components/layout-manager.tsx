
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

  // This effect handles all redirection logic based on a stable auth state.
  useEffect(() => {
    // 1. Wait until authentication process is fully complete.
    if (loading) {
      return;
    }

    // 2. Handle Authentication Errors
    if (authError) {
        // The AuthErrorDisplay component will be shown, so no redirection is needed here.
        return;
    }

    const isPublicPage = pathname === '/login' || pathname.startsWith('/contract');
    const isStatusPage = pathname === '/pending-activation' || pathname === '/unauthorized';

    // 3. State: User is not logged into Firebase.
    if (!user) {
      if (!isPublicPage) {
        router.push('/login');
      }
      return;
    }
    
    // --- From this point, we know a Firebase user exists. ---

    // 4. State: Firebase user exists, but no profile in our app's database.
    if (!appUser) {
      if (!isStatusPage) { // Prevent redirect loop if already on a status page.
        // Redirect with email for debugging
        router.push(`/unauthorized?email=${encodeURIComponent(user.email!)}`);
      }
      return;
    }

    // 5. State: User has a profile but is pending activation.
    if (appUser.status === 'pending') {
      if (pathname !== '/pending-activation') {
        router.push('/pending-activation');
      }
      return;
    }
    
    // 6. State: User is active and authorized.
    if (appUser.status === 'active') {
        const isWrongDashboard = (appUser.role === 'admin' && pathname.startsWith('/colaborador')) ||
                                 (appUser.role === 'provider' && !pathname.startsWith('/colaborador'));

        // If user is on a public/status page or the wrong dashboard, redirect to their correct home.
        if ((isPublicPage || isStatusPage || isWrongDashboard) && !pathname.startsWith('/contract')) {
            const targetPath = appUser.role === 'admin' ? '/' : '/colaborador/dashboard';
            router.push(targetPath);
        }
    }

  }, [user, appUser, loading, pathname, router, authError]);


  // This block handles what to RENDER based on the current state.
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
  
  if (needsMainLayout && !pathname.startsWith('/colaborador') && !pathname.startsWith('/contract')) {
      return <MainLayout>{children}</MainLayout>;
  }
  
  if (isCollaboratorPage && pathname.startsWith('/colaborador')) {
      return <>{children}</>;
  }
  
  // For login, status pages, contract view, or during the brief moment of redirection, render the page content.
  return <>{children}</>;
}
