'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import LayoutManager from "@/components/layout-manager";
import PwaSetup from "@/components/pwa-setup";
import dynamic from 'next/dynamic';
import { Loader2 } from "lucide-react";
import { FirebaseErrorListener } from "@/components/FirebaseErrorListener";
import { TooltipProvider } from "@/components/ui/tooltip";
import { APP_CONFIG } from "@/lib/app-config";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { useEffect } from "react";
import { logEvent } from "@/lib/analytics";

const AuthProvider = dynamic(() => import('@/components/auth-provider').then(mod => mod.AuthProvider), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-4 text-muted-foreground">Cargando Autenticación...</span>
    </div>
  )
});

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  useEffect(() => {
    logEvent('app_open', { 
        platform: typeof window !== 'undefined' && 'serviceWorker' in navigator ? 'pwa' : 'web',
        version: APP_CONFIG.version 
    });
  }, []);

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <title>{APP_CONFIG.name} | {APP_CONFIG.slogan}</title>
        <meta name="description" content={APP_CONFIG.slogan} />
        
        {/* PWA y Mobile Optimization */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#17628d" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={APP_CONFIG.name} />
        <meta name="application-name" content={APP_CONFIG.name} />
        
        {/* Icons locales */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" href="/icons/icon-192x192.png" />
        <link rel="shortcut icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <LanguageProvider>
          <AuthProvider>
            <TooltipProvider delayDuration={300}>
              <LayoutManager>{children}</LayoutManager>
              <FirebaseErrorListener />
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
        <PwaSetup />
      </body>
    </html>
  );
}