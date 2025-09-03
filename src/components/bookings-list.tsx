

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookingWithTenantAndProperty, Property, Tenant } from "@/lib/data";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BookingEditForm } from "./booking-edit-form";
import { BookingDeleteForm } from "./booking-delete-form";
import { BookingExpensesManager } from "./booking-expenses-manager";

interface BookingsListProps {
  bookings: BookingWithTenantAndProperty[];
  properties: Property[];
  tenants: Tenant[];
  showProperty?: boolean;
}

export default function BookingsList({ bookings, properties, tenants, showProperty = false }: BookingsListProps) {
  if (bookings.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay reservas para mostrar.</p>;
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
          {showProperty && <TableHead>Propiedad</TableHead>}
          <TableHead>Inquilino</TableHead>
          <TableHead>Check-in</TableHead>
          <TableHead>Check-out</TableHead>
          <TableHead>Monto</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.id}>
            {showProperty && <TableCell>{booking.property?.name || 'N/A'}</TableCell>}
            <TableCell className="font-medium">{booking.tenant?.name || 'N/A'}</TableCell>
            <TableCell>{formatDate(booking.startDate)}</TableCell>
            <TableCell>{formatDate(booking.endDate)}</TableCell>
            <TableCell>
                <Badge variant="secondary">{formatCurrency(booking.amount, booking.currency)}</Badge>
            </TableCell>
            <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                    <BookingExpensesManager bookingId={booking.id} />
                    <BookingEditForm booking={booking} tenants={tenants} properties={properties} />
                    <BookingDeleteForm bookingId={booking.id} propertyId={booking.propertyId} />
                </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
