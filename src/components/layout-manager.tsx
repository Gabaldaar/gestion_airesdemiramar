
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
    if (!loading && !user && !isPublicPage) {
      router.push('/login');
    }
  }, [user, loading, isPublicPage, router]);
  
  if (isPublicPage) {
    return <>{children}</>;
  }

  if (loading) {
     return <div className="flex h-screen items-center justify-center">Cargando sesión...</div>;
  }
  
  if (!user) {
    // This will be briefly visible before the useEffect redirects.
    return <div className="flex h-screen items-center justify-center">Redirigiendo a login...</div>;
  }

  return <MainLayout>{children}</MainLayout>;
}
