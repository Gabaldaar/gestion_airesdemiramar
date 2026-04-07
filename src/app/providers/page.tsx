

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProviders, Provider, getProviderCategories, ProviderCategory } from "@/lib/data";
import ProvidersClient from "@/components/providers-client";
import { useAuth } from "@/components/auth-provider";
import { useEffect, useState, useCallback } from "react";
import { ProviderAddForm } from "@/components/provider-add-form";

interface ProvidersData {
    providers: Provider[];
    categories: ProviderCategory[];
}

export default function ProvidersPage() {
    const { user } = useAuth();
    const [data, setData] = useState<ProvidersData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filteredProviderCount, setFilteredProviderCount] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        if (user) {
            setLoading(true);
            const [providers, categories] = await Promise.all([
                getProviders(),
                getProviderCategories(),
            ]);
            setData({ providers, categories });
            setFilteredProviderCount(providers.length);
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading || !data) {
        return <p>Cargando colaboradores...</p>;
    }

    const countDisplay = filteredProviderCount !== null 
        ? `${filteredProviderCount} / ${data.providers.length}`
        : data.providers.length;

    return (
        <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
            <CardTitle className="flex items-center gap-2">
                Colaboradores
                <span className="text-sm font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-md">
                    {countDisplay}
                </span>
            </CardTitle>
            <CardDescription>
                Administra y filtra la información de tus colaboradores y administradores.
            </CardDescription>
            </div>
            <ProviderAddForm categories={data.categories} onProviderAdded={fetchData} />
        </CardHeader>
        <CardContent>
            <ProvidersClient 
                initialProviders={data.providers}
                categories={data.categories}
                onFilteredProvidersChange={setFilteredProviderCount}
                onDataChanged={fetchData}
            />
        </CardContent>
        </Card>
    );
}
