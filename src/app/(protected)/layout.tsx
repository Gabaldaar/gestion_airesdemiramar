'use client';

import { useAuth } from '@/components/auth-provider';
import MainLayout from '@/components/main-layout';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Si no estamos en estado de carga y no hay usuario, redirigir a login.
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Mientras se carga la información del usuario, mostrar un estado de carga.
    // Esto previene que se muestre el contenido protegido antes de tiempo.
    if (loading || !user) {
        return (
            <div className="flex h-screen items-center justify-center bg-muted/40">
                <p className="text-muted-foreground">Verificando sesión...</p>
            </div>
        );
    }

    // Si la carga ha terminado y hay un usuario, mostrar el layout principal con el contenido.
    return <MainLayout>{children}</MainLayout>;
}
