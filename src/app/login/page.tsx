
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
import Link from 'next/link';

export default function LoginPage() {
  const { signInWithGoogle, user, loading, signInWithEmail, signUpWithEmail, sendPasswordReset } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      if (activeTab === 'login') {
        await signInWithEmail(email, password);
      } else {
        // This is a simplified registration flow from the login page
        await signUpWithEmail(email, password);
      }
      router.push('/');
    } catch (error: any) {
      console.error(`Error during ${activeTab}:`, error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setError('Email o contraseña incorrectos.');
      } else if (error.code === 'auth/email-already-in-use') {
        setError('Este email ya está registrado. Intenta iniciar sesión.');
      } else if (error.code === 'auth/weak-password') {
          setError('La contraseña debe tener al menos 6 caracteres.');
      } else if (error.code === 'auth/operation-not-allowed') {
        setError('El inicio de sesión con email/contraseña no está habilitado. Por favor, actívalo en la consola de Firebase.');
      }
      else {
        setError('Ocurrió un error. Por favor, intenta de nuevo.');
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
        setMessage('¡Email enviado! Revisa tu bandeja de entrada (y la carpeta de spam) para encontrar el enlace de restablecimiento.');
        setShowResetForm(false);
    } catch (error: any) {
        console.error('Error sending password reset email:', error);
        setError('Error al enviar el email. Verifica que la dirección sea correcta e inténtalo de nuevo.');
    }
  };

  if (loading || (!isPublicPage && user)) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40">
            <p className="text-muted-foreground">Cargando...</p>
        </div>
    );
  }
  
  const isPublicPage = true;


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
                        <Label htmlFor="email-reset">Email</Label>
                        <Input id="email-reset" type="email" placeholder="tu@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
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
                 <Tabs defaultValue="login" className="w-full" onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                      <TabsTrigger value="register">Registrarse</TabsTrigger>
                    </TabsList>
                    <form onSubmit={handleEmailSubmit}>
                      <TabsContent value="login" className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label htmlFor="email-login">Email</Label>
                            <Input id="email-login" type="email" placeholder="tu@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center">
                                <Label htmlFor="password-login">Contraseña</Label>
                                <button type="button" onClick={() => {setShowResetForm(true); setError(''); setMessage('');}} className="ml-auto inline-block text-sm underline">
                                    Olvidé mi contraseña
                                </button>
                            </div>
                            <Input id="password-login" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                          </div>
                          {error && <p className="text-sm text-red-500">{error}</p>}
                          <Button type="submit" className="w-full" disabled={loading}>
                            Iniciar Sesión
                          </Button>
                      </TabsContent>
                      <TabsContent value="register" className="space-y-4 pt-4">
                           <div className="space-y-2">
                            <Label htmlFor="email-register">Email</Label>
                            <Input id="email-register" type="email" placeholder="tu@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="password-register">Contraseña</Label>
                            <Input id="password-register" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                          </div>
                          {error && <p className="text-sm text-red-500">{error}</p>}
                          <Button type="submit" className="w-full" disabled={loading}>
                            Crear Cuenta
                          </Button>
                      </TabsContent>
                    </form>
                 </Tabs>
            )}
             {!showResetForm && (
                <>
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
                     <div className="mt-4 text-center text-sm">
                        {activeTab === 'login' ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'} {' '}
                        <button 
                            onClick={() => setActiveTab(activeTab === 'login' ? 'register' : 'login')} 
                            className="underline"
                        >
                          {activeTab === 'login' ? 'Regístrate' : 'Inicia Sesión'}
                        </button>
                    </div>
                </>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

    