
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
  const { signInWithGoogle, user, loading, signInWithEmail, sendPasswordReset } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
       if (error.code === 'auth/cancelled-popup-request') {
            return;
        }
      console.error('Error during Google sign-in:', error);
      setError('Error al iniciar sesión con Google.');
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await signInWithEmail(email, password);
    } catch (error: any) {
      console.error('Error during email sign-in:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setError('Email o contraseña incorrectos.');
      } else if (error.code === 'auth/operation-not-allowed') {
        setError('El inicio de sesión con email/contraseña no está habilitado. Por favor, actívalo en la consola de Firebase.');
      }
      else {
        setError('Error al iniciar sesión.');
      }
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!email) {
        setError('Por favor, ingresa tu email para restablecer la contraseña.');
        return;
    }
    try {
        await sendPasswordReset(email);
        setMessage('Se ha enviado un enlace para restablecer tu contraseña a tu email.');
        setShowResetForm(false);
    } catch (error: any) {
        console.error('Error sending password reset email:', error);
        setError('Error al enviar el email de restablecimiento. Verifica que el email sea correcto.');
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
          <CardTitle className="text-2xl">{showResetForm ? 'Restablecer Contraseña' : 'Bienvenido'}</CardTitle>
          <CardDescription>
            {showResetForm ? 'Ingresa tu email para recibir un enlace de restablecimiento.' : 'Inicia sesión para administrar tus propiedades.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
            {message && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md mb-4">{message}</p>}
            {showResetForm ? (
                <form onSubmit={handlePasswordReset} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="tu@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <Button type="submit" className="w-full" disabled={loading}>
                        Enviar Enlace
                    </Button>
                     <Button type="button" variant="link" className="w-full" onClick={() => {setShowResetForm(false); setError(''); setMessage('');}}>
                        Volver a Iniciar Sesión
                    </Button>
                </form>
            ) : (
                 <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                    <TabsTrigger value="register">Registrarse</TabsTrigger>
                    </TabsList>
                    <TabsContent value="login">
                    <form onSubmit={handleEmailLogin} className="space-y-4 pt-4">
                        <div className="space-y-2">
                        <Label htmlFor="email-login">Email</Label>
                        <Input id="email-login" type="email" placeholder="tu@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Contraseña</Label>
                             <button type="button" onClick={() => {setShowResetForm(true); setError(''); setMessage('');}} className="ml-auto inline-block text-sm underline">
                                Olvidé mi contraseña
                            </button>
                        </div>
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
            )}
        </CardContent>
      </Card>
    </div>
  );
}
