

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBookings, getProperties, getTenants } from "@/lib/data";
import BookingsList from "@/components/bookings-list";

export default async function BookingsPage() {
  const [bookings, properties, tenants] = await Promise.all([
    getBookings(),
    getProperties(),
    getTenants(),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reservas</CardTitle>
        <CardDescription>
          Administra todas las reservas de tus propiedades.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BookingsList bookings={bookings} properties={properties} tenants={tenants} showProperty={true} />
      </CardContent>
    </Card>
  );
}
