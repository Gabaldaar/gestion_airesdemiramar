
'use client';

import { usePathname } from 'next/navigation';
import MainLayout from './main-layout';

export default function LayoutManager({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Rutas que no deben usar el MainLayout
  const noLayoutRoutes = ['/contract'];

  if (noLayoutRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  return <MainLayout>{children}</MainLayout>;
}
