

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookingWithDetails, Property, Tenant } from "@/lib/data";
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { BookingEditForm } from "./booking-edit-form";
import { BookingDeleteForm } from "./booking-delete-form";
import { BookingExpensesManager } from "./booking-expenses-manager";
import { BookingPaymentsManager } from "./booking-payments-manager";
import { NotesViewer } from "./notes-viewer";
import { cn } from "@/lib/utils";

interface BookingsListProps {
  bookings: BookingWithDetails[];
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  
  const getTenantNameColorClass = (booking: BookingWithDetails): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(booking.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(booking.endDate);
    endDate.setHours(0, 0, 0, 0);

    if (today >= startDate && today <= endDate) {
      return "text-green-600"; // En curso
    }

    if (startDate < today) {
        return ""; // Cerrada, sin color
    }
    
    const daysUntilStart = differenceInDays(startDate, today);

    if (daysUntilStart < 7) {
      return "text-red-600";
    }
    if (daysUntilStart < 15) {
      return "text-orange-600";
    }
    if (daysUntilStart < 30) {
      return "text-blue-600";
    }
    return "";
  };


  return (
    <div>
        <div className="flex items-center space-x-4 mb-2 text-xs text-muted-foreground">
            <span className="font-semibold">Leyenda:</span>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-blue-600 mr-1"></div>&lt; 30 días</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-orange-600 mr-1"></div>&lt; 15 días</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-600 mr-1"></div>&lt; 7 días</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-green-600 mr-1"></div>En Curso</div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {showProperty && <TableHead>Propiedad</TableHead>}
              <TableHead>Inquilino</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                {showProperty && <TableCell>{booking.property?.name || 'N/A'}</TableCell>}
                <TableCell className={cn("font-medium", getTenantNameColorClass(booking))}>
                    {booking.tenant?.name || 'N/A'}
                </TableCell>
                <TableCell>{formatDate(booking.startDate)}</TableCell>
                <TableCell>{formatDate(booking.endDate)}</TableCell>
                <TableCell>
                    <Badge variant="secondary">{formatCurrency(booking.amount, booking.currency)}</Badge>
                </TableCell>
                <TableCell className={`font-bold ${booking.balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {formatCurrency(booking.balance, booking.currency)}
                </TableCell>
                <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                        {booking.notes && <NotesViewer notes={booking.notes} title={`Notas sobre la reserva`} />}
                        <BookingPaymentsManager bookingId={booking.id} bookingCurrency={booking.currency} />
                        <BookingExpensesManager bookingId={booking.id} />
                        <BookingEditForm booking={booking} tenants={tenants} properties={properties} allBookings={bookings} />
                        <BookingDeleteForm bookingId={booking.id} propertyId={booking.propertyId} />
                    </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
    </div>
  );
}
