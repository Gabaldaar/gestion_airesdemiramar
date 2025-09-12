
'use client';

import { useAuth } from '@/components/auth-provider';
import MainLayout from '@/components/main-layout';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Cookies from 'js-cookie';

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (user) {
                user.getIdToken().then(token => {
                    Cookies.set('firebaseIdToken', token, { path: '/' });
                });
            } else {
                Cookies.remove('firebaseIdToken', { path: '/' });
                router.push('/login');
            }
        }
    }, [user, loading, router]);


    if (loading || !user) {
        return (
            <div className="flex h-screen items-center justify-center bg-muted/40">
                <p className="text-muted-foreground">Verificando sesión...</p>
            </div>
        );
    }

    return <MainLayout>{children}</MainLayout>;
}
