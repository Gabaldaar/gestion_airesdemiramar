
'use client';

import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Logo from '@/assets/logo.png';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const { signInWithGoogle, user, loading, signInWithEmail } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error during Google sign-in:', error);
      setError('Error al iniciar sesión con Google.');
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmail(email, password);
    } catch (error: any) {
      console.error('Error during email sign-in:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setError('Email o contraseña incorrectos.');
      } else {
        setError('Error al iniciar sesión.');
      }
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
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleEmailLogin} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="tu@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  Iniciar Sesión
                </Button>
              </form>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
                </div>
              </div>
              <Button className="w-full" variant="outline" onClick={handleGoogleLogin} disabled={loading}>
                Iniciar sesión con Google
              </Button>
            </TabsContent>
            <TabsContent value="register">
                <div className="py-4 text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                        Crea una cuenta para empezar a gestionar tus propiedades.
                    </p>
                    <Button onClick={() => router.push('/register')} className="w-full">
                        Ir a la página de registro
                    </Button>
                </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
