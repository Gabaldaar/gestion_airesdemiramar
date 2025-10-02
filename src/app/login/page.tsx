
'use client';

import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Logo from '@/assets/logo.png';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function LoginPage() {
  const { signInWithGoogle, user, loading } = useAuth();
  const router = useRouter();
  const [origin, setOrigin] = useState<string | null>(null);

  useEffect(() => {
    // This code runs only in the browser
    const currentOrigin = window.location.origin;
    setOrigin(currentOrigin);
    // Log the origin to help debug domain authorization issues
    console.log("El dominio que debes autorizar en Firebase es:", currentOrigin);

    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      router.push('/');
    } catch (error) {
      console.error('Error during sign-in:', error);
      // Optionally, show an error message to the user
    }
  };

  if (loading || user) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40">
            <p className="text-muted-foreground">Cargando...</p>
        </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
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
          {origin && origin.includes('localhost') === false && (
            <Alert variant="destructive" className="mb-4">
              <Terminal className="h-4 w-4" />
              <AlertTitle>¡Acción Requerida!</AlertTitle>
              <AlertDescription>
                Para habilitar el login, añade el siguiente dominio a la lista de "Dominios Autorizados" en tu configuración de Firebase Authentication:
                <div className="font-mono bg-destructive-foreground/20 p-2 rounded-md my-2 text-destructive text-center">
                  {origin}
                </div>
              </AlertDescription>
            </Alert>
          )}
          <Button className="w-full" onClick={handleLogin} disabled={loading}>
            Iniciar sesión con Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
