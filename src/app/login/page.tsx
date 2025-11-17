
'use client';

import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Logo from '@/assets/logo.png';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { signInWithGoogle, user, loading } = useAuth();
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // If the user is authenticated and loading is complete, redirect to dashboard.
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      // This will trigger the redirect to Google's login page.
      // After login, the user will be redirected back and the
      // AuthProvider's onAuthStateChanged will handle the session.
      await signInWithGoogle();
    } catch (error) {
      console.error('Error during sign-in:', error);
      setIsLoggingIn(false); // Only reset if there's an error during the redirect initiation.
    }
  };
  
  // While Firebase is initializing and checking the auth state,
  // it's better to show a generic loading screen.
  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40">
            <p className="text-muted-foreground">Cargando...</p>
        </div>
    );
  }

  // If the user is already logged in, they will be redirected by the useEffect.
  // We can show a loading state while that happens.
  if (user) {
     return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40">
            <p className="text-muted-foreground">Sesión iniciada, redirigiendo...</p>
        </div>
    );
  }
  
  // If not loading and no user, show the login page.
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
               <Image src={Logo} alt="Aires de Miramar" width={240} />
            </div>
          <CardTitle className="text-2xl">Bienvenido</CardTitle>
          <CardDescription>
            Inicia sesión para administrar tus propiedades.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={handleLogin} disabled={isLoggingIn}>
            {isLoggingIn ? 'Redirigiendo a Google...' : 'Iniciar sesión con Google'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
