'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Provider, ProviderCategory, getProviders, getProviderCategories } from "@/lib/data";
import ProvidersClient from "@/components/providers-client";
import { useAuth } from "@/components/auth-provider";
import { useEffect, useState, useCallback } from "react";
import { ProviderAddForm } from "@/components/provider-add-form";
import { Loader2, Wrench } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";

interface ProvidersData {
    providers: Provider[];
    categories: ProviderCategory[];
}

export default function ProvidersPage() {
    const { user, orgId } = useAuth();
    const { t } = useTranslation();
    const [data, setData] = useState<ProvidersData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filteredProviderCount, setFilteredProviderCount] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const currentOrgId = orgId || 'global';
            const [providersRaw, categories] = await Promise.all([
                getProviders(currentOrgId),
                getProviderCategories(currentOrgId),
            ]);
            
            const sortByName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });

            // FILTRO ESTRICTO: Solo Colaboradores
            const providers = providersRaw.filter(p => p.role === 'provider').sort(sortByName);
            
            setData({ providers, categories });
            setFilteredProviderCount(providers.length);
        } catch (err) {
            console.error("Error fetching providers:", err);
        } finally {
            setLoading(false);
        }
    }, [user, orgId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading && !data) {
        return (
            <div className="space-y-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-primary">{t('navigation.providers')}</h2>
                    <p className="text-muted-foreground">{t('providers.description')}</p>
                </div>
                <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
            </div>
        );
    }

    if (!data) return null;

    const totalDisplay = data.providers.length;
    const countDisplay = filteredProviderCount !== null 
        ? `${filteredProviderCount} / ${totalDisplay}`
        : totalDisplay;

    return (
        <div className="flex-1 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-primary">
                        {t('navigation.providers')}
                        <span className="ml-3 text-sm font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-md">
                            {countDisplay}
                        </span>
                    </h2>
                    <p className="text-muted-foreground">{t('providers.description')}</p>
                </div>
                <ProviderAddForm categories={data.categories} onProviderAdded={fetchData} allowedRoles={['provider']} />
            </div>

            <Card>
                <CardContent className="pt-6">
                    <ProvidersClient 
                        initialProviders={data.providers}
                        categories={data.categories}
                        onFilteredProvidersChange={setFilteredProviderCount}
                        onDataChanged={fetchData}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
