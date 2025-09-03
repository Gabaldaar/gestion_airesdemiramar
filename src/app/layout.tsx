
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster"
import MainLayout from '@/components/main-layout';
import { checkAuth } from '@/lib/auth';
import LoginPage from './login/page';

export const metadata: Metadata = {
  title: 'Aires de Miramar - Admin',
  description: 'Gestiona tus alquileres de temporada en Miramar',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isAuthenticated = await checkAuth();

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased", "min-h-screen bg-background font-sans")}>
        {isAuthenticated ? (
          <MainLayout>
            {children}
          </MainLayout>
        ) : (
          <LoginPage />
        )}
        <Toaster />
      </body>
    </html>
