
'use client';

import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { ShieldAlert } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function UnauthorizedContent() {
    const { signOut } = useAuth();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <ShieldAlert className="h-12 w-12 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl">Acceso No Autorizado</CardTitle>
                    <CardDescription>
                        Tu cuenta de Google no está registrada para acceder a esta aplicación.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    {email && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                            <p className="text-sm text-destructive font-semibold">
                                El email que se intentó usar es:
                            </p>
                            <p className="text-lg font-mono text-destructive">{email}</p>
                        </div>
                    )}
                    <p className="text-muted-foreground">
                        Por favor, confirma que este es el email correcto y contacta al administrador para que lo registre.
                    </p>
                    <Button variant="outline" onClick={signOut}>
                        Volver al Inicio de Sesión
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

export default function UnauthorizedPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Cargando...</div>}>
            <UnauthorizedContent />
        </Suspense>
    )
}
