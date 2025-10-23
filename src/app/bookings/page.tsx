'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { getBookings, getProperties, getTenants, BookingWithDetails, Property, Tenant, Origin, getOrigins } from "@/lib/data";
import BookingsClient from "@/components/bookings-client";
import { useAuth } from "@/components/auth-provider";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface BookingsData {
    allBookings: BookingWithDetails[];
    properties: Property[];
    tenants: Tenant[];
    origins: Origin[];
}

export default function BookingsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<BookingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filteredBookingCount, setFilteredBookingCount] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenantId') || undefined;

  useEffect(() => {
    if (user) {
        setLoading(true);
        Promise.all([
            getBookings(),
            getProperties(),
            getTenants(),
            getOrigins(),
        ]).then(([allBookings, properties, tenants, origins]) => {
            setData({ allBookings, properties, tenants, origins });
            setFilteredBookingCount(allBookings.length);
            setLoading(false);
        });
    }
  }, [user]);


  if (loading || !data) {
      return <p>Cargando reservas...</p>;
  }

  const { allBookings, properties, tenants, origins } = data;

  const tenant = tenantId ? tenants.find(t => t.id === tenantId) : null;
  const pageTitle = tenant ? `Reservas de ${tenant.name}` : 'Reservas';
  const pageDescription = tenant
    ? `Un historial de todas las reservas de ${tenant.name}.`
    : 'Administra y filtra todas las reservas de tus propiedades.';
    
  const countDisplay = filteredBookingCount !== null && !tenantId
    ? `${filteredBookingCount} / ${allBookings.length}`
    : (filteredBookingCount !== null ? filteredBookingCount : allBookings.length);


  return (
    <Card>
    <CardHeader>
        <CardTitle className="flex items-center gap-2">
            {pageTitle}
            {!tenantId && (
                <span className="text-sm font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-md">
                    {countDisplay}
                </span>
            )}
        </CardTitle>
        <CardDescription>{pageDescription}</CardDescription>
    </CardHeader>
    <CardContent>
        <BookingsClient 
        initialBookings={allBookings} 
        properties={properties} 
        tenants={tenants} 
        origins={origins}
        initialTenantIdFilter={tenantId}
        onFilteredBookingsChange={setFilteredBookingCount}
        />
    </CardContent>
    </Card>
  );
}
