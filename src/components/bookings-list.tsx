

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookingWithDetails, Property, Tenant, ContractStatus } from "@/lib/data";
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { BookingEditForm } from "./booking-edit-form";
import { BookingDeleteForm } from "./booking-delete-form";
import { BookingExpensesManager } from "./booking-expenses-manager";
import { BookingPaymentsManager } from "./booking-payments-manager";
import { NotesViewer } from "./notes-viewer";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { NotebookPen } from "lucide-react";

interface BookingsListProps {
  bookings: BookingWithDetails[];
  properties: Property[];
  tenants: Tenant[];
  showProperty?: boolean;
}

const contractStatusMap: Record<ContractStatus, { text: string, className: string }> = {
    not_sent: { text: 'S/Enviar', className: 'bg-gray-500 hover:bg-gray-600' },
    sent: { text: 'Enviado', className: 'bg-blue-500 hover:bg-blue-600' },
    signed: { text: 'Firmado', className: 'bg-green-600 hover:bg-green-700' },
    not_required: { text: 'N/A', className: 'bg-yellow-600 text-black hover:bg-yellow-700' }
};

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
  
  const getBookingColorClass = (booking: BookingWithDetails): string => {
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
              <TableHead>Contrato</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => {
              const status = booking.contractStatus || 'not_sent';
              const contractInfo = contractStatusMap[status];
              return (
              <TableRow key={booking.id}>
                {showProperty && <TableCell className={cn("font-bold", getBookingColorClass(booking))}>{booking.property?.name || 'N/A'}</TableCell>}
                <TableCell className="font-medium">
                    {booking.tenant?.email ? (
                        <a 
                            href={`mailto:${booking.tenant.email}?subject=${encodeURIComponent(`Tu reserva en Miramar - ${booking.property?.name} - Check-in ${format(new Date(booking.startDate), 'dd/MM/yyyy')}`)}`}
                            className="text-primary hover:underline"
                        >
                            {booking.tenant?.name || 'N/A'}
                        </a>
                    ) : (
                        booking.tenant?.name || 'N/A'
                    )}
                </TableCell>
                <TableCell>{formatDate(booking.startDate)}</TableCell>
                <TableCell>{formatDate(booking.endDate)}</TableCell>
                <TableCell>
                    <Badge className={contractInfo.className}>
                        {contractInfo.text}
                    </Badge>
                </TableCell>
                <TableCell>
                    <Badge variant="secondary">{formatCurrency(booking.amount, booking.currency)}</Badge>
                </TableCell>
                <TableCell className={`font-bold ${booking.balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {formatCurrency(booking.balance, booking.currency)}
                </TableCell>
                <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                        {booking.notes && <NotesViewer notes={booking.notes} title={`Notas sobre la reserva`} />}
                        <Button asChild variant="ghost" size="icon">
                            <Link href={`/contract?id=${booking.id}`} target="_blank">
                                <NotebookPen className="h-4 w-4" />
                                <span className="sr-only">Ver Contrato</span>
                            </Link>
                        </Button>
                        <BookingPaymentsManager bookingId={booking.id} />
                        <BookingExpensesManager bookingId={booking.id} />
                        <BookingEditForm booking={booking} tenants={tenants} properties={properties} allBookings={bookings} />
                        <BookingDeleteForm bookingId={booking.id} propertyId={booking.propertyId} />
                    </div>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
    </div>
  );
}
