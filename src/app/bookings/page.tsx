
import { getBookings, getProperties } from "@/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function BookingsPage() {
  const bookings = await getBookings();
  const properties = await getProperties();

  const getPropertyName = (propertyId: number) => {
    return properties.find(p => p.id === propertyId)?.name || 'N/A';
  }

  const statusVariant = {
    confirmed: 'default',
    pending: 'secondary',
    cancelled: 'destructive'
  } as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reservas</CardTitle>
        <CardDescription>
          Administra todas las reservas de tus propiedades.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Propiedad</TableHead>
              <TableHead>Inquilino</TableHead>
              <TableHead>Fechas</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">{getPropertyName(booking.propertyId)}</TableCell>
                <TableCell>{booking.tenantName}</TableCell>
                <TableCell>{booking.startDate} - {booking.endDate}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[booking.status]}>
                    {booking.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">${booking.totalPrice.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
