
import { getPropertiesByOwnerEmail } from '@/lib/data';
import { getAuth } from '@/lib/firebase/admin';
import OwnerDashboard from '@/components/owner-dashboard';
import { Suspense } from 'react';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function OwnerDashboardPage() {
    // In a real environment, we would get the user from the session cookie
    // For now, since we are in a Client Component focused app, 
    // the heavy lifting will be done by the client component.
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Cargando Portal...</div>}>
            <OwnerDashboard />
        </Suspense>
    );
}
