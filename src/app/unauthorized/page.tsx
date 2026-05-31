'use client';

import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { ShieldAlert, ShieldCheck, LogOut, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

function UnauthorizedContent() {
    const { signOut, user, orgId } = useAuth();
    const searchParams = useSearchParams();
    const [isExiting, setIsExiting] = useState(false);
    
    // Obtener email de varias fuentes para el diagnóstico
    const emailFromAuth = user?.email || user?.providerData[0]?.email;
    const emailFromURL = searchParams.get('email');
    const displayEmail = emailFromAuth || emailFromURL || '(no detectado)';

    const handleForceExit = async () => {
        setIsExiting(true);
        try {
            await signOut();
            window.localStorage.clear();
            window.sessionStorage.clear();
            window.location.href = '/login';
        } catch (e) {
            window.location.reload();
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <ShieldAlert className="h-12 w-12 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl font-black uppercase italic text-primary tracking-tighter">Acceso No Autorizado</CardTitle>
                    <CardDescription>
                        Tu cuenta de Google no está registrada para acceder a esta aplicación.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                    <div className="p-4 bg-muted rounded-xl border text-left space-y-3">
                        <div className="flex items-center gap-2 text-primary border-b pb-2">
                            <ShieldCheck className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Información de Diagnóstico</span>
                        </div>
                        <div className="space-y-2 font-mono text-[11px]">
                            <p><span className="text-muted-foreground">Email Google:</span> <br/>{displayEmail}</p>
                            <p><span className="text-muted-foreground">UID Firebase:</span> <br/>{user?.uid || '(no disponible)'}</p>
                            <p><span className="text-muted-foreground">Org ID Asignado:</span> <br/>{orgId || '(ninguno)'}</p>
                        </div>
                    </div>

                    <p className="text-muted-foreground text-sm">
                        Si eres el administrador, verifica que el email arriba indicado coincida exactamente con el que figura en tu base de datos.
                    </p>
                    
                    <div className="pt-4 border-t space-y-3">
                        <Button 
                            variant="destructive" 
                            onClick={handleForceExit} 
                            className="w-full h-12 font-bold uppercase tracking-widest"
                            disabled={isExiting}
                        >
                            {isExiting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                            Limpiar y Reintentar
                        </Button>
                    </div>
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