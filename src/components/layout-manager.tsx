'use client';

import { usePathname } from 'next/navigation';
import MainLayout from './main-layout';

export default function LayoutManager({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // La página del contrato tiene su propio layout y no debe usar el MainLayout.
  if (pathname === '/contract') {
    return <>{children}</>;
  }

  return <MainLayout>{children}</MainLayout>;
}
