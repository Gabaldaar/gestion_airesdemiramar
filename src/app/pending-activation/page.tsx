
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { Clock } from 'lucide-react';

export default function PendingActivationPage() {
    const { signOut } = useAuth();

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <Clock className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Activación Pendiente</CardTitle>
                    <CardDescription>
                        Tu cuenta ha sido creada exitosamente, pero necesita ser activada por un administrador.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground">
                        Por favor, contacta al administrador para que revise y active tu cuenta. Una vez activada, podrás iniciar sesión y acceder a la aplicación.
                    </p>
                    <Button variant="outline" onClick={signOut}>
                        Volver al Inicio de Sesión
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
