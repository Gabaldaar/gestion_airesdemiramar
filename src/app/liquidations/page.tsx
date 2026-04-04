
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Briefcase } from "lucide-react";
import { getProviders, Provider, getProperties, Property, getTaskScopes, TaskScope, getPendingWorkLogs, WorkLog, getPendingManualAdjustments, ManualAdjustment } from "@/lib/data";
import { useAuth } from "@/components/auth-provider";
import { useEffect, useState, useCallback } from "react";
import LiquidationsClient from "@/components/liquidations-client";


interface LiquidationsData {
    providers: Provider[];
    properties: Property[];
    scopes: TaskScope[];
}

export default function LiquidationsPage() {
    const { user } = useAuth();
    const [data, setData] = useState<LiquidationsData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (user) {
            setLoading(true);
            try {
                const [providers, properties, scopes] = await Promise.all([
                    getProviders(),
                    getProperties(),
                    getTaskScopes(),
                ]);
                setData({ providers, properties, scopes });
            } catch (error) {
                console.error("Error fetching initial data for liquidations:", error);
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
                <div className="flex items-center gap-4">
                    <Briefcase className="h-10 w-10 text-primary" />
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-primary">Liquidaciones</h2>
                        <p className="text-muted-foreground">Gestiona los pagos a tus colaboradores recurrentes.</p>
                    </div>
                </div>
                <Card>
                    <CardContent>
                        <p className="text-center p-8">Cargando datos...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Briefcase className="h-10 w-10 text-primary" />
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-primary">Liquidaciones</h2>
                    <p className="text-muted-foreground">Gestiona los pagos a tus colaboradores recurrentes.</p>
                </div>
            </div>
            <LiquidationsClient
                providers={data.providers}
                properties={data.properties}
                scopes={data.scopes}
            />
        </div>
    );
}
