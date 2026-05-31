'use client';

import { getProperties, getTaskScopes } from '@/lib/data';
import ColaboradorDashboard from '@/components/colaborador-dashboard';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useTranslation } from '@/i18n/useTranslation';
import { Loader2 } from 'lucide-react';

export default function ColaboradorDashboardPage() {
    const { orgId } = useAuth();
    const { t } = useTranslation();
    const [data, setData] = useState<{ properties: any[]; scopes: any[] } | null>(null);

    useEffect(() => {
        if (orgId) {
            Promise.all([
                getProperties(orgId),
                getTaskScopes(orgId),
            ]).then(([p, s]) => {
                setData({ properties: p, scopes: s });
            }).catch(err => {
                console.error("Error loading collaborator data:", err);
            });
        }
    }, [orgId]);

    if (!data) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">{t('common.loading')}</p>
            </div>
        );
    }

    return (
        <ColaboradorDashboard properties={data.properties} scopes={data.scopes} />
    );
}
