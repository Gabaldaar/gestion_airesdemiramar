
'use client';

import { useAuth } from './auth-provider';
import { usePathname } from 'next/navigation';
import Sidebar from './sidebar';
import Header from './header';
import { Toaster } from './ui/toaster';

export default function LayoutManager({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  
  const isLoginPage = pathname === '/login';
  const isContractPage = pathname === '/contract';

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Cargando...</p>
        </div>
    );
  }

  // If on a special page like contract or login, render it without the main layout
  if (isLoginPage || isContractPage) {
    return <>{children}</>;
  }

  // If no user, and not on a public page, this part will typically be handled by redirects in a real app,
  // but for now, we just show the content, which should be the login page if routing is set up correctly.
  // The login page itself will redirect if a user is found.
  if (!user) {
     return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40">
            {/* This should ideally be the login page rendered by Next.js router */}
            {children}
        </div>
     )
  }

  // If user is logged in, show the main dashboard layout
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <div className="flex flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
       <Toaster />
    </div>
  );
}
