
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
    const { signOut } = useAuth();

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
                    <p className="text-muted-foreground">
                        Si crees que esto es un error, por favor, contacta al administrador para que registre tu dirección de email y te conceda acceso.
                    </p>
                    <Button variant="outline" onClick={signOut}>
                        Volver al Inicio de Sesión
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
