

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBookings, getProperties, getTenants, getTenantById } from "@/lib/data";
import BookingsList from "@/components/bookings-list";

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

  const bookings = tenantId 
    ? allBookings.filter(b => b.tenantId === tenantId)
    : allBookings;

  const tenant = tenantId ? tenants.find(t => t.id === tenantId) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tenant ? `Reservas de ${tenant.name}` : 'Reservas'}</CardTitle>
        <CardDescription>
          {tenant ? `Un historial de todas las reservas de ${tenant.name}.` : 'Administra todas las reservas de tus propiedades.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BookingsList bookings={bookings} properties={properties} tenants={tenants} showProperty={true} />
      </CardContent>
    </Card>
  );
}
