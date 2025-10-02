
'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from './auth-provider';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const MainLayout = dynamic(() => import('./main-layout'), {
  loading: () => <div className="flex h-screen items-center justify-center">Cargando...</div>,
});


export default function LayoutManager({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();

  const isPublicPage = pathname === '/login' || pathname === '/contract';

  useEffect(() => {
    if (loading) {
      return; // No hacer nada mientras se carga el estado de autenticación
    }

    if (user && isPublicPage && pathname !== '/contract') {
        // Si el usuario está logueado y está en una página pública (que no sea el contrato), redirigir al dashboard
        router.push('/');
    } else if (!user && !isPublicPage) {
        // Si el usuario no está logueado y no está en una página pública, redirigir al login
        router.push('/login');
    }
  }, [user, loading, isPublicPage, pathname, router]);
  
  // Si estamos en una página pública, simplemente renderizamos el contenido.
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Si estamos en una página privada y la sesión aún se está cargando, mostramos un mensaje.
  if (loading) {
     return <div className="flex h-screen items-center justify-center">Cargando sesión...</div>;
  }
  
  // Si no hay usuario y estamos en una página privada (después de cargar), el useEffect ya habrá redirigido.
  // Pero podemos mostrar un loader para evitar un parpadeo.
  if (!user) {
    return <div className="flex h-screen items-center justify-center">Redirigiendo a login...</div>;
  }

  // Si hay usuario y es una página privada, mostramos el layout principal con el contenido.
  return <MainLayout>{children}</MainLayout>;
}
