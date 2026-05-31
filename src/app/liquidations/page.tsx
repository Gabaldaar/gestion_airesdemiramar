'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Briefcase, Loader2 } from "lucide-react";
import { Provider, Property, TaskScope, LiquidationWithProvider } from "@/lib/data";
import { useAuth } from "@/components/auth-provider";
import { useEffect, useState, useCallback } from "react";
import LiquidationsClient from "@/components/liquidations-client";
import { collection, getDocs, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useTranslation } from "@/i18n/useTranslation";

interface LiquidationsData {
    providers: Provider[];
    properties: Property[];
    scopes: TaskScope[];
    liquidations: LiquidationWithProvider[];
}

export default function LiquidationsPage() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [data, setData] = useState<LiquidationsData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (user) {
            setLoading(true);
            try {
                // Función de seguridad para buscar en ambas posibles colecciones (snake_case y camelCase)
                const safeGetDocs = async (collName: string, altName: string) => {
                    try {
                        let snap = await getDocs(collection(db, collName));
                        if (snap.empty) {
                            snap = await getDocs(collection(db, altName));
                        }
                        return snap;
                    } catch (e) {
                        return { docs: [] } as any;
                    }
                };

                const [provSnap, propsSnap, scopesSnap, liqSnap] = await Promise.all([
                    getDocs(collection(db, 'providers')),
                    getDocs(collection(db, 'properties')),
                    safeGetDocs('task_scopes', 'taskScopes'),
                    getDocs(collection(db, 'liquidations')),
                ]);

                const sortByName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });

                const providers = provSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Provider)).sort(sortByName);
                const properties = propsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Property)).sort(sortByName);
                const scopes = scopesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as TaskScope)).sort(sortByName);
                const providersMap = new Map(providers.map(p => [p.id, p.name]));

                const liquidations: LiquidationWithProvider[] = liqSnap.docs.map((d: any) => {
                    const l = { id: d.id, ...d.data() } as any;
                    return {
                        ...l,
                        providerName: providersMap.get(l.providerId) || 'Desconocido'
                    };
                });

                setData({ providers, properties, scopes, liquidations });
            } catch (error) {
                console.error("Error fetching liquidations:", error);
            } finally {
                setLoading(false);
            }
        }
    }, [user]);

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
