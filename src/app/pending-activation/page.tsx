
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { History, ShieldCheck, LogOut, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function PendingActivationPage() {
    const { signOut, user, appUser } = useAuth();
    const [isExiting, setIsExiting] = useState(false);
    
    // Extracción mejorada del email para diagnóstico
    const displayEmail = user?.email || user?.providerData.find(p => p.email)?.email || '(no detectado)';

    const handleForceExit = async () => {
        setIsExiting(true);
        try {
            await signOut();
            // Limpieza extra de seguridad para romper el bucle del navegador
            window.localStorage.clear();
            window.location.href = '/login';
        } catch (e) {
            window.location.reload();
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <Card className="w-full max-w-md shadow-2xl border-2 border-primary/10">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-4 bg-primary/10 rounded-full animate-pulse">
                            <History className="h-12 w-12 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-black text-primary uppercase italic tracking-tighter">Activación Pendiente</CardTitle>
                    <CardDescription>
                        Tu cuenta ha sido registrada, pero necesita ser habilitada por el administrador.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                    <p className="text-muted-foreground text-sm">
                        Por favor, contacta al administrador principal para que active tu cuenta. Una vez activada, podrás acceder a tus funciones.
                    </p>

                    <div className="p-4 bg-muted rounded-xl border text-left space-y-3">
                        <div className="flex items-center gap-2 text-primary border-b pb-2">
                            <ShieldCheck className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Información de Diagnóstico</span>
                        </div>
                        <div className="space-y-2 font-mono text-[11px]">
                            <p><span className="text-muted-foreground">Email Google:</span> <br/>{displayEmail}</p>
                            <p><span className="text-muted-foreground">ID Aplicación:</span> <br/>{appUser?.id || '(no registrado)'}</p>
                            <p><span className="text-muted-foreground">ID Organización:</span> <br/>{appUser?.orgId || '(no asignada)'}</p>
                            <p><span className="text-muted-foreground">Rol Detectado:</span> <br/>{appUser?.role || 'Ninguno'}</p>
                            <p><span className="text-muted-foreground">Estado Actual:</span> <br/><span className="text-destructive font-bold">{appUser?.status || 'Desconocido'}</span></p>
                        </div>
                    </div>

                    <div className="pt-4 border-t space-y-3">
                        <Button 
                            variant="destructive" 
                            onClick={handleForceExit} 
                            className="w-full h-12 font-bold uppercase tracking-widest"
                            disabled={isExiting}
                        >
                            {isExiting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                            Cerrar Sesión (Limpiar Memoria)
                        </Button>
                        <p className="text-[10px] text-muted-foreground italic">
                            Si eres el administrador y estás viendo esto, utiliza el botón de arriba para reiniciar la sesión. El sistema te restaurará el acceso automáticamente al entrar.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
