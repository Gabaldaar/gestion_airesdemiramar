
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
    // Si la carga ha terminado y hay un usuario, redirigir al dashboard.
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Mientras Firebase está inicializando y comprobando el estado de autenticación,
  // es mejor mostrar una pantalla de carga genérica.
  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40">
            <p className="text-muted-foreground">Cargando...</p>
        </div>
    );
  }

  // Si el usuario ya está logueado, será redirigido por el useEffect.
  // Se puede mostrar un mensaje mientras eso sucede.
  if (user) {
     return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40">
            <p className="text-muted-foreground">Sesión iniciada, redirigiendo...</p>
        </div>
    );
  }
  
  // Si no está cargando y no hay usuario, mostrar la página de login.
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
          <Button className="w-full" onClick={signInWithGoogle}>
            Iniciar sesión con Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
