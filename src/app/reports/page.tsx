
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectToInformes() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/informes');
    }, [router]);
    return null;
}
