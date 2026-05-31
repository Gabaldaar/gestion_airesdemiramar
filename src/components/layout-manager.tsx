
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';
import { useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';

const MainLayout = dynamic(() => import('./main-layout'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-muted/40">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-muted-foreground animate-pulse">Iniciando sistema...</span>
        </div>
    </div>
  ),
});

function AuthErrorDisplay({ title, error, onSignOut }: { title: string, error: string, onSignOut: () => void }) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <Card className="w-full max-w-lg shadow-2xl">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-4 bg-destructive/10 rounded-full">
                            <AlertTriangle className="h-12 w-12 text-destructive" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">{title}</CardTitle>
                    <CardDescription>Ocurrió un problema con su sesión de usuario.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                     <div className="text-sm p-4 bg-muted rounded-lg whitespace-pre-wrap text-destructive font-semibold border border-destructive/20">
                        {error}
                     </div>
                    <Button variant="outline" onClick={onSignOut} className="w-full">Cerrar Sesión</Button>
                </CardContent>
            </Card>
        </div>
    );
}

export default function LayoutManager({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, appUser, loading, authError, signOut, activeRole, roleConflict, orgId } = useAuth();
  const router = useRouter();
  const lastRedirect = useRef<string | null>(null);

  const isLoginPage = pathname === '/login';
  const isPublicPage = useMemo(() => {
    return isLoginPage || 
           pathname?.startsWith('/contract') || 
           pathname?.startsWith('/sign') || 
           pathname?.startsWith('/liquidation-view');
  }, [pathname, isLoginPage]);

  const isStatusPage = useMemo(() => {
    return pathname === '/pending-activation' || pathname === '/unauthorized' || pathname === '/onboarding';
  }, [pathname]);

  const isPrintPage = pathname?.includes('/print');

  // Sistema de Auto-Siembra para usuarios con base vacía
  useEffect(() => {
    if (!loading && appUser && orgId && (activeRole === 'admin' || activeRole === 'socio' || activeRole === 'staff')) {
        // Ejecutamos como efecto secundario sin bloquear el renderizado
        import('@/lib/actions').then(({ ensureSeedData }) => {
            ensureSeedData(orgId);
        }).catch(err => console.error("[LayoutManager] Error loading seed action:", err));
    }
  }, [loading, appUser, orgId, activeRole]);

  useEffect(() => {
    // Si todavía está cargando la sesión, no tomamos decisiones de ruta
    if (loading || authError || roleConflict) return;

    const safePush = (url: string) => {
        if (pathname !== url && lastRedirect.current !== url) {
            console.log(`[LayoutManager] Redirecting: ${pathname} -> ${url}`);
            lastRedirect.current = url;
            router.push(url);
        }
    };

    // 1. SI NO HAY USUARIO DE FIREBASE
    if (!user) {
      if (!isPublicPage && !isPrintPage) {
        safePush('/login');
      }
      return;
    }
    
    // 2. SI EL USUARIO ESTÁ EN LOGIN PERO YA ESTÁ AUTENTICADO
    if (isLoginPage) {
        if (appUser) {
            safePush('/');
        } else {
            safePush('/onboarding');
        }
        return;
    }

    // 3. SI EL USUARIO NO TIENE PERFIL (appUser)
    if (!appUser) {
      if (!isPublicPage && !isStatusPage && pathname !== '/onboarding') {
        // Esperamos un momento por si el perfil está tardando en cargar de la DB
        const timer = setTimeout(() => {
            if (!appUser) safePush('/onboarding');
        }, 800);
        return () => clearTimeout(timer);
      }
      return;
    }

    // 4. SI EL USUARIO YA TIENE PERFIL PERO ESTÁ EN ONBOARDING
    if (appUser && pathname === '/onboarding') {
        safePush('/');
        return;
    }

    // 5. REDIRECCIONES POR ROL
    const isSystemUser = activeRole === 'admin' || activeRole === 'socio' || activeRole === 'staff';

    if (isSystemUser) {
        if (pathname === '/pending-activation' || pathname === '/onboarding' || pathname === '/unauthorized') {
            safePush('/');
        }
        return;
    }

    if (activeRole === 'owner') {
        if (!pathname.startsWith('/owner/dashboard') && !isPublicPage && !isPrintPage) {
            safePush('/owner/dashboard');
        }
        return;
    }

    if (activeRole === 'provider') {
        if (!pathname.startsWith('/colaborador') && !isPublicPage && !isPrintPage) {
            safePush('/colaborador/dashboard');
        }
        return;
    }

    // 6. CHEQUEO DE ESTADO PENDIENTE
    if (appUser.status === 'pending') {
        if (pathname !== '/pending-activation') {
            safePush('/pending-activation');
        }
        return;
    }

  }, [user, appUser, loading, pathname, router, authError, activeRole, isLoginPage, isPublicPage, isStatusPage, isPrintPage, roleConflict]);

  if (roleConflict) return <AuthErrorDisplay title="Conflicto de Roles" error={roleConflict} onSignOut={signOut} />;
  if (authError) return <AuthErrorDisplay title="Error de Conexión" error={authError} onSignOut={signOut} />;
  
  if (loading) {
    if (isPublicPage) return <>{children}</>;
    return (
      <div className="flex h-screen items-center justify-center bg-muted/40">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-muted-foreground animate-pulse">Verificando sesión...</span>
        </div>
      </div>
    );
  }

  const showSidebar = user && appUser && !isPublicPage && !isPrintPage && !isStatusPage;

  if (showSidebar) {
      return <MainLayout>{children}</MainLayout>;
  }
  
  return <>{children}</>;
}
