'use client';

import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { APP_CONFIG } from '@/lib/app-config';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BrandingSettings } from '@/lib/data';
import { Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPage() {
  const { signInWithGoogle, loading: authLoading } = useAuth();
  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    getDoc(doc(db, 'settings', 'branding')).then(snap => {
        if (snap.exists()) setBranding(snap.data() as BrandingSettings);
    }).catch(() => {});
  }, []);

  const handleLogin = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Error during sign-in:', error);
      setErrorMsg(error.message || 'Error al intentar iniciar sesión.');
      setIsSigningIn(false);
    }
  };

  const appName = branding?.appName || APP_CONFIG.name;
  const appSlogan = branding?.appSlogan || APP_CONFIG.slogan;
  const logoSrc = branding?.logoMainUrl || APP_CONFIG.logo.main;

  const isUnauthorizedDomain = errorMsg?.includes('auth/unauthorized-domain');

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Card className="w-full max-w-sm shadow-xl border-2 border-primary/5">
        <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
               <div className="relative w-64 h-24">
                   <Image 
                      src={logoSrc} 
                      alt={appName} 
                      fill
                      priority 
                      unoptimized
                      className="object-contain"
                   />
               </div>
            </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black uppercase tracking-tight text-primary italic">
                {appName}
            </CardTitle>
            <CardDescription className="font-bold text-muted-foreground text-xs uppercase tracking-widest text-center">
                {appSlogan}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          <p className="text-center text-sm text-muted-foreground px-6">
              Ingresa con tu cuenta de Google para gestionar tus propiedades de forma profesional.
          </p>

          {errorMsg && (
            <Alert variant="destructive" className="animate-in fade-in zoom-in duration-300">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Fallo en el Sistema</AlertTitle>
                <AlertDescription className="text-xs mt-2 space-y-3">
                    <p className="font-mono bg-black/5 p-2 rounded">{errorMsg}</p>
                    {isUnauthorizedDomain && (
                        <div className="p-3 bg-white/10 rounded-md border border-white/20 mt-2 space-y-2">
                            <p className="font-bold uppercase text-[9px] tracking-widest">Solución técnica necesaria:</p>
                            <p>El dominio debe ser autorizado en la Consola de Firebase.</p>
                            <Button variant="link" size="sm" asChild className="p-0 h-auto text-[10px] text-white underline">
                                <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer">
                                    Ir a la Consola <ExternalLink className="ml-1 h-3 w-3 inline" />
                                </a>
                            </Button>
                        </div>
                    )}
                </AlertDescription>
            </Alert>
          )}

          <Button 
              className="w-full h-12 text-base font-bold shadow-lg" 
              onClick={handleLogin} 
              disabled={isSigningIn}
          >
              {isSigningIn ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                  <svg className="mr-3 h-5 w-5 shrink-0" viewBox="0 0 24 24">
                      <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c1.61-3.3 2.53-7.14 2.53-10.45z"
                      />
                      <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                      />
                  </svg>
              )}
              {isSigningIn ? "Verificando..." : "Iniciar sesión con Google"}
          </Button>
        </CardContent>
        <CardFooter className="justify-center pt-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-50">
                Plataforma v{APP_CONFIG.version}
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
