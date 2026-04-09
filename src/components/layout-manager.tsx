
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
    let parsedError;
    try {
        parsedError = JSON.parse(error);
    } catch(e) {
        // Not a JSON error, display as is.
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40">
            <Card className="w-full max-w-lg">
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
                    {parsedError ? (
                        <>
                            <p className="text-sm text-center text-destructive font-semibold">{parsedError.message}</p>
                            <div className="text-xs p-2 bg-muted rounded-md whitespace-pre-wrap">
                                <h4 className="font-bold mb-2">Datos de depuración:</h4>
                                <pre><code>{JSON.stringify(parsedError.googleUser, null, 2)}</code></pre>
                            </div>
                        </>
                    ) : (
                         <pre className="text-xs p-2 bg-muted rounded-md whitespace-pre-wrap">
                            {error}
                        </pre>
                    )}
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
    // Prevent redirection if the user is performing a "soft exit"
    if (sessionStorage.getItem('soft_exit') === 'true' && pathname === '/login') {
      sessionStorage.removeItem('soft_exit');
      return; // Early exit to stay on the login page
    }

    // 1. Wait until authentication process is fully complete.
    if (loading) {
      return;
    }

    // 2. Handle Authentication Errors
    if (authError) {
        return;
    }

    const isPublicPage = pathname === '/login' || pathname.startsWith('/contract');
    const isStatusPage = pathname === '/pending-activation' || pathname === '/unauthorized';

    // 3. State: User is not logged into Firebase.
    if (!user) {
      if (!isPublicPage && !pathname.includes('/print')) {
        router.push('/login');
      }
      return;
    }
    
    // --- From this point, we know a Firebase user exists. ---

    // 4. State: Firebase user exists, but no profile in our app's database.
    if (!appUser) {
      if (!isStatusPage) { // Prevent redirect loop if already on a status page.
        const debugParams = new URLSearchParams();
        if (user.email) debugParams.set('email', user.email);
        if (user.displayName) debugParams.set('displayName', user.displayName);
        if (user.uid) debugParams.set('uid', user.uid);
        router.push(`/unauthorized?${debugParams.toString()}`);
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
        if ((isPublicPage || isStatusPage || isWrongDashboard) && !pathname.startsWith('/contract') && !pathname.includes('/print')) {
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
  const isPrintPage = pathname.includes('/print');

  // If the user is a collaborator, and they are not on a collaborator page or contract page, show a loader
  // while the useEffect redirects them. This avoids showing the admin layout.
  if (isCollaboratorPage && !pathname.startsWith('/colaborador') && !pathname.startsWith('/contract') && !isPrintPage && pathname !== '/login') {
     return (
      <div className="flex h-screen items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-4 text-muted-foreground">Redirigiendo...</span>
      </div>
    );
  }
  
  if (needsMainLayout && !pathname.startsWith('/colaborador') && !pathname.startsWith('/contract') && !isPrintPage) {
      return <MainLayout>{children}</MainLayout>;
  }
  
  // For collaborator dashboard, login, status pages, contract view, and print pages.
  return <>{children}</>;
}
