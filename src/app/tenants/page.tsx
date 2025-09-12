
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTenants, getBookings, Tenant, BookingWithDetails } from "@/lib/data";
import { TenantAddForm } from "@/components/tenant-add-form";
import TenantsClient from "@/components/tenants-client";
import { useAuth } from "@/components/auth-provider";
import { useEffect, useState } from "react";

interface TenantsData {
    tenants: Tenant[];
    bookings: BookingWithDetails[];
}

export default function TenantsPage() {
    const { user } = useAuth();
    const [data, setData] = useState<TenantsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            setLoading(true);
            Promise.all([
                getTenants(),
                getBookings()
            ]).then(([tenants, bookings]) => {
                setData({ tenants, bookings });
                setLoading(false);
            });
        }
    }, [user]);

    if (!user || loading || !data) {
        return <p>Cargando inquilinos...</p>;
    }

    return (
        <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
            <CardTitle>Inquilinos</CardTitle>
            <CardDescription>
                Administra y filtra la información de tus inquilinos.
            </CardDescription>
            </div>
            <TenantAddForm />
        </CardHeader>
        <CardContent>
            <TenantsClient initialTenants={data.tenants} allBookings={data.bookings} />
        </CardContent>
        </Card>
    );
}
