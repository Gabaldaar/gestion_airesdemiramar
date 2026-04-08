
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
    const displayName = searchParams.get('displayName');
    const uid = searchParams.get('uid');

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
                    {(email || displayName || uid) && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-left text-sm">
                            <p className="font-semibold text-destructive">
                                Datos del intento de inicio de sesión:
                            </p>
                            <ul className="list-disc pl-5 mt-2 font-mono text-destructive/80">
                                {displayName && <li>Nombre: {displayName}</li>}
                                {email && <li>Email: {email}</li>}
                                {uid && <li>ID: {uid}</li>}
                                {!email && <li className="font-semibold">El email no fue proporcionado por Google.</li>}
                            </ul>
                        </div>
                    )}
                    <p className="text-muted-foreground">
                        Por favor, confirma que estos son los datos correctos y contacta al administrador para que registre tu cuenta.
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
