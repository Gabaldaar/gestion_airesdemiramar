'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OwnersRedirectPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/settings?tab=owners');
    }, [router]);

    return (
        <div className="flex h-screen items-center justify-center">
            <p className="text-muted-foreground animate-pulse">Redirigiendo a Configuración...</p>
        </div>
    );
}
