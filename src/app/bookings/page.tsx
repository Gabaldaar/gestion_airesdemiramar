
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { getBookings, getProperties, getTenants, BookingWithDetails, Property, Tenant } from "@/lib/data";
import BookingsClient from "@/components/bookings-client";
import { useAuth } from "@/components/auth-provider";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

interface BookingsData {
    allBookings: BookingWithDetails[];
    properties: Property[];
    tenants: Tenant[];
}

export default function BookingsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<BookingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenantId') || undefined;

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
        getBookings(),
        getProperties(),
        getTenants(),
    ]).then(([allBookings, properties, tenants]) => {
        setData({ allBookings, properties, tenants });
        setLoading(false);
    });
  }, []);
  
  useEffect(() => {
    if (user) {
        fetchData();
    }
  }, [user, fetchData]);


  if (!user || loading || !data) {
      return <p>Cargando reservas...</p>;
  }

  const { allBookings, properties, tenants } = data;

  const tenant = tenantId ? tenants.find(t => t.id === tenantId) : null;
  const pageTitle = tenant ? `Reservas de ${tenant.name}` : 'Reservas';
  const pageDescription = tenant
    ? `Un historial de todas las reservas de ${tenant.name}.`
    : 'Administra y filtra todas las reservas de tus propiedades.';


  return (
    <Card>
    <CardHeader>
        <CardTitle>{pageTitle}</CardTitle>
        <CardDescription>{pageDescription}</CardDescription>
    </CardHeader>
    <CardContent>
        <BookingsClient 
        initialBookings={allBookings} 
        properties={properties} 
        tenants={tenants} 
        initialTenantIdFilter={tenantId}
        onDataNeedsRefresh={fetchData}
        />
    </CardContent>
    </Card>
  );
}
