
'use client';

import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Logo from '@/assets/logo.png';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { signInWithGoogle, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If the user is logged in, redirect to the dashboard.
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSignIn = () => {
    signInWithGoogle().catch(error => {
        console.error("Sign in failed", error);
    });
  }

  // While Firebase is initializing and checking the auth state
  if (loading) {
    return <p>Cargando...</p>;
  }
  
  // If user is already logged in, show a redirecting message
  if (user) {
     return <p>Sesión iniciada, redirigiendo...</p>;
  }
  
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
          <Button className="w-full" onClick={handleSignIn}>
            Iniciar sesión con Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
