
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookingWithTenantAndProperty } from "@/lib/data";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DashboardRecentBookings({ bookings }: { bookings: BookingWithTenantAndProperty[]}) {
  if (bookings.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay reservas recientes para mostrar.</p>;
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' LLL, yyyy", { locale: es });
  };

  const formatCurrency = (amount: number, currency: 'USD' | 'ARS') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Propiedad</TableHead>
          <TableHead>Inquilino</TableHead>
          <TableHead>Check-in</TableHead>
          <TableHead>Check-out</TableHead>
          <TableHead className="text-right">Monto</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell>{booking.property?.name || 'N/A'}</TableCell>
            <TableCell className="font-medium">{booking.tenant?.name || 'N/A'}</TableCell>
            <TableCell>{formatDate(booking.startDate)}</TableCell>
            <TableCell>{formatDate(booking.endDate)}</TableCell>
            <TableCell className="text-right">
                <Badge variant="secondary">{formatCurrency(booking.amount, booking.currency)}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
