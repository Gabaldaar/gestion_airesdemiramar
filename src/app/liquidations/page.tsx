'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Briefcase, Loader2 } from "lucide-react";
import { 
    Provider, 
    Property, 
    TaskScope, 
    LiquidationWithProvider,
    getProperties,
    getProviders,
    getTaskScopes,
    getLiquidations
} from "@/lib/data";
import { useAuth } from "@/components/auth-provider";
import { useEffect, useState, useCallback } from "react";
import LiquidationsClient from "@/components/liquidations-client";
import { useTranslation } from "@/i18n/useTranslation";

interface LiquidationsData {
    providers: Provider[];
    properties: Property[];
    scopes: TaskScope[];
    liquidations: LiquidationWithProvider[];
}

export default function LiquidationsPage() {
    const { user, orgId } = useAuth();
    const { t } = useTranslation();
    const [data, setData] = useState<LiquidationsData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!user || !orgId) return;
        setLoading(true);
        try {
            const currentOrgId = orgId || 'global';

            const [providers, properties, scopes, liquidations] = await Promise.all([
                getProviders(currentOrgId),
                getProperties(currentOrgId),
                getTaskScopes(currentOrgId),
                getLiquidations(currentOrgId)
            ]);

            const sortByName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });

            providers.sort(sortByName);
            properties.sort(sortByName);
            scopes.sort(sortByName);

            setData({ providers, properties, scopes, liquidations });
        } catch (error) {
            console.error("Error fetching liquidations:", error);
        } finally {
            setLoading(false);
        }
    }, [user, orgId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading || !data) {
        return (
             <div className="space-y-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-primary">{t('liquidations.title')}</h2>
                    <p className="text-muted-foreground">{t('liquidations.description')}</p>
                </div>
                <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-primary">{t('liquidations.title')}</h2>
                <p className="text-muted-foreground">{t('liquidations.description')}</p>
            </div>
            <LiquidationsClient
                providers={data.providers}
                properties={data.properties}
                scopes={data.scopes}
                liquidations={data.liquidations}
                onDataNeedsRefresh={fetchData}
            />
        </div>
    );
}
