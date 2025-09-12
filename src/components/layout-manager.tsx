
'use client';

import { usePathname } from 'next/navigation';
import MainLayout from './main-layout';
import { useAuth } from './auth-provider';
import { useRouter } from 'next/navigation';

export default function LayoutManager({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();

  const isPublicPage = pathname === '/login' || pathname === '/contract';
  const isProtectedPage = !isPublicPage;

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }

  if (isProtectedPage) {
    if (!user) {
      // Redirect to login if not authenticated
      if (typeof window !== 'undefined') {
        router.push('/login');
      }
      return <div className="flex h-screen items-center justify-center">Redirigiendo a login...</div>;
    }
    // Render the protected layout
    return <MainLayout>{children}</MainLayout>;
  }

  // For public pages, just render the children
  return <>{children}</>;
}
