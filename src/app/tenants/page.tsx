
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTenants, getBookings, Tenant, BookingWithDetails, Origin, getOrigins } from "@/lib/data";
import { TenantAddForm } from "@/components/tenant-add-form";
import TenantsClient from "@/components/tenants-client";
import { useAuth } from "@/components/auth-provider";
import { useEffect, useState } from "react";

interface TenantsData {
    tenants: Tenant[];
    bookings: BookingWithDetails[];
    origins: Origin[];
}

export default function TenantsPage() {
    const { user } = useAuth();
    const [data, setData] = useState<TenantsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filteredTenantCount, setFilteredTenantCount] = useState<number | null>(null);

    useEffect(() => {
        if (user) {
            setLoading(true);
            Promise.all([
                getTenants(),
                getBookings(),
                getOrigins()
            ]).then(([tenants, bookings, origins]) => {
                setData({ tenants, bookings, origins });
                setFilteredTenantCount(tenants.length); // Initialize with total count
                setLoading(false);
            });
        }
    }, [user]);

    if (loading || !data) {
        return <p>Cargando inquilinos...</p>;
    }

    const countDisplay = filteredTenantCount !== null 
        ? `${filteredTenantCount} / ${data.tenants.length}`
        : data.tenants.length;

    return (
        <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
            <CardTitle className="flex items-center gap-2">
                Inquilinos
                <span className="text-sm font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-md">
                    {countDisplay}
                </span>
            </CardTitle>
            <CardDescription>
                Administra y filtra la información de tus inquilinos.
            </CardDescription>
            </div>
            <TenantAddForm />
        </CardHeader>
        <CardContent>
            <TenantsClient 
                initialTenants={data.tenants} 
                allBookings={data.bookings}
                origins={data.origins}
                onFilteredTenantsChange={setFilteredTenantCount}
            />
        </CardContent>
        </Card>
    );
}
