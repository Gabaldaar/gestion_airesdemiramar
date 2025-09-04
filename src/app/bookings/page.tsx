

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { getBookings, getProperties, getTenants } from "@/lib/data";
import BookingsClient from "@/components/bookings-client";

export default async function BookingsPage({
  searchParams,
}: {
  searchParams?: {
    tenantId?: string;
  };
}) {
  const tenantId = searchParams?.tenantId;

  const [allBookings, properties, tenants] = await Promise.all([
    getBookings(),
    getProperties(),
    getTenants(),
  ]);

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
        />
      </CardContent>
    </Card>
  );
}
