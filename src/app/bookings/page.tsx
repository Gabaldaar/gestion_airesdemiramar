

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBookings } from "@/lib/data";
import BookingsList from "@/components/bookings-list";

export default async function BookingsPage() {
  const bookings = await getBookings();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reservas</CardTitle>
        <CardDescription>
          Administra todas las reservas de tus propiedades.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BookingsList bookings={bookings} showProperty={true} />
      </CardContent>
    </Card>
  );
}
