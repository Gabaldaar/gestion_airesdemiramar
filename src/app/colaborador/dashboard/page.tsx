'use server';

import { getProperties, getTaskScopes } from '@/lib/data';
import ColaboradorDashboard from '@/components/colaborador-dashboard';
import { Suspense } from 'react';

export default async function ColaboradorDashboardPage() {
    // Fetch data that the client component will need, like properties and scopes for assignments.
    const [properties, scopes] = await Promise.all([
        getProperties(),
        getTaskScopes(),
    ]);

    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Cargando datos...</div>}>
            <ColaboradorDashboard properties={properties} scopes={scopes} />
        </Suspense>
    );
}
