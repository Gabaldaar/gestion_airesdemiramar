
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Github, GitBranch, CheckCircle, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


type Step = 'connect' | 'select' | 'push' | 'done';

export default function GitHubPage() {
  const [step, setStep] = useState<Step>('connect');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = () => {
    setIsConnecting(true);
    setError(null);
    // Simula una llamada a la API para la autenticación de GitHub
    setTimeout(() => {
      // En un caso real, la respuesta de la API determinaría el éxito.
      // Aquí, asumimos que siempre tiene éxito para la demostración.
      setStep('select');
      setIsConnecting(false);
    }, 1500);
  };

  const handleSelect = () => {
    // Aquí iría la lógica para confirmar el repositorio y la rama.
    setStep('push');
  };
  
  const handlePush = () => {
    setIsPushing(true);
    setError(null);
    // Simula una llamada a la API para hacer push a GitHub
    setTimeout(() => {
        // Simula un posible error
        const didFail = Math.random() > 0.8;
        if (didFail) {
            setError('Error al subir a la rama. Por favor, asegúrate de que tienes cambios para subir e inténtalo de nuevo.');
            setIsPushing(false);
        } else {
            setStep('done');
            setIsPushing(false);
        }
    }, 2000);
  };

  const handleReset = () => {
    setStep('connect');
    setError(null);
  }

  return (
    <div className="flex-1 space-y-4">
        <div className="flex items-center gap-4">
            <Github className="h-10 w-10 text-primary" />
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-primary">Conectar con GitHub</h2>
                <p className="text-muted-foreground">Sube tu proyecto a un repositorio de GitHub paso a paso.</p>
            </div>
        </div>

        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Guía de Conexión a GitHub</CardTitle>
                <CardDescription>Sigue estos pasos para subir tu código.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* --- PASO 1: CONECTAR --- */}
                <div className="flex items-start gap-4">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step === 'connect' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {step !== 'connect' && isConnecting === false ? <CheckCircle className="h-5 w-5" /> : '1'}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold">Conecta tu cuenta de GitHub</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Necesitas autorizar a la aplicación para que pueda acceder a tus repositorios.
                        </p>
                        {step === 'connect' && (
                            <Button onClick={handleConnect} disabled={isConnecting}>
                                {isConnecting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Conectando...
                                    </>
                                ) : (
                                    <>
                                        <Github className="mr-2 h-4 w-4" />
                                        Conectar con GitHub
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>

                <Separator />

                {/* --- PASO 2: SELECCIONAR --- */}
                <div className="flex items-start gap-4">
                     <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step === 'select' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {step !== 'select' && step !== 'connect' ? <CheckCircle className="h-5 w-5" /> : '2'}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold">Selecciona tu Repositorio y Rama</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Elige dónde quieres subir tu código. La rama `main` está seleccionada por defecto.
                        </p>
                        {step === 'select' && (
                           <div className="space-y-4 p-4 border rounded-lg">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Repositorio</label>
                                     <Select defaultValue="mi-proyecto-app">
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="mi-proyecto-app">mi-proyecto-app</SelectItem>
                                            <SelectItem value="otro-repo">otro-repo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Rama</label>
                                     <Select defaultValue="main">
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="main">main</SelectItem>
                                            <SelectItem value="develop">develop</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                             </div>
                             <Button onClick={handleSelect}>
                                Confirmar Selección
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                           </div>
                        )}
                    </div>
                </div>
                
                <Separator />

                {/* --- PASO 3: SUBIR --- */}
                <div className="flex items-start gap-4">
                     <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step === 'push' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {step === 'done' ? <CheckCircle className="h-5 w-5" /> : '3'}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold">Sube tu Código</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                           Todo está listo. Haz clic en el botón para subir la versión actual de tu código a la rama `main`.
                        </p>
                        {step === 'push' && (
                            <Button onClick={handlePush} disabled={isPushing}>
                                {isPushing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Subiendo a `main`...
                                    </>
                                ) : (
                                    <>
                                        <GitBranch className="mr-2 h-4 w-4" />
                                        Subir a `main`
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>

            </CardContent>
             <CardFooter>
                {step === 'done' && (
                    <div className="w-full text-center p-4 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-lg">
                        <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">¡Subida completada!</h3>
                        <p className="text-sm text-green-700 dark:text-green-300">
                            Tu código ha sido subido a la rama `main` con éxito.
                        </p>
                         <Button onClick={handleReset} variant="link" className="mt-2">Subir a otra rama</Button>
                    </div>
                )}
                 {error && (
                    <div className="w-full text-center p-4 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg">
                        <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Hubo un error</h3>
                        <p className="text-sm text-red-700 dark:text-red-300">
                           {error}
                        </p>
                         <Button onClick={handlePush} variant="link" className="mt-2">Intentar de nuevo</Button>
                    </div>
                )}
            </CardFooter>
        </Card>
    </div>
  );
}
