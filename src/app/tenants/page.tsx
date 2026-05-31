
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tenant, Booking, Origin, getTenants, getBookings, getOrigins } from "@/lib/data";
import { TenantAddForm } from "@/components/tenant-add-form";
import TenantsClient from "@/components/tenants-client";
import { useAuth } from "@/components/auth-provider";
import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";

interface TenantsData {
    tenants: Tenant[];
    bookings: Booking[];
    origins: Origin[];
}

export default function TenantsPage() {
    const { user, orgId } = useAuth();
    const { t } = useTranslation();
    const [data, setData] = useState<TenantsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filteredTenantCount, setFilteredTenantCount] = useState<number | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchData = useCallback(async () => {
        if (!user || !orgId) return;
        if (!data) setLoading(true);
        
        try {
            const currentOrgId = orgId || 'global';
            const [tenantsRaw, bookingsRaw, originsRaw] = await Promise.all([
                getTenants(currentOrgId),
                getBookings(currentOrgId),
                getOrigins(currentOrgId)
            ]);

            const sortByName = (a: any, b: any) => (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' });

            const tenants = tenantsRaw.sort(sortByName) as Tenant[];
            const bookings = bookingsRaw as Booking[];
            const origins = originsRaw.sort(sortByName) as Origin[];

            setData({ tenants, bookings, origins });
            if (filteredTenantCount === null) {
                setFilteredTenantCount(tenants.length);
            }
        } catch (err) {
            console.error("Failed to load tenants data:", err);
        } finally {
            setLoading(false);
        }
    }, [user, orgId, data, filteredTenantCount]);

    useEffect(() => {
        fetchData();
    }, [refreshKey, user, orgId, fetchData]);

    const handleDataChanged = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);

    const countDisplay = filteredTenantCount !== null 
        ? `${filteredTenantCount} / ${data?.tenants.length || 0}`
        : data?.tenants.length || 0;

    const renderSkeletons = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
            {[...Array(8)].map((_, i) => (
                <Card key={i} className="h-[180px] overflow-hidden border-2 border-zinc-100 p-4 space-y-4">
                    <div className="flex justify-between items-start">
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex justify-end pt-4">
                        <Skeleton className="h-8 w-24" />
                    </div>
                </Card>
            ))}
        </div>
    );

    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-primary">
                        {t('navigation.tenants')}
                        {!loading && data && (
                            <span className="ml-3 text-sm font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-md">
                                {countDisplay}
                            </span>
                        )}
                    </h2>
                    <p className="text-muted-foreground">{t('tenants.description')}</p>
                </div>
                <TenantAddForm onTenantAdded={handleDataChanged} />
            </div>
            <Card>
                <CardContent className="pt-6">
                    {loading && !data ? renderSkeletons() : data && (
                        <TenantsClient 
                            initialTenants={data.tenants} 
                            allBookings={data.bookings}
                            origins={data.origins}
                            onFilteredTenantsChange={setFilteredTenantCount}
                            onDataChanged={handleDataChanged}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
