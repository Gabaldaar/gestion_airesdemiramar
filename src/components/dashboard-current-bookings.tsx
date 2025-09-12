

'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookingWithDetails } from "@/lib/data";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState, useEffect } from 'react';

export default function DashboardCurrentBookings({ bookings }: { bookings: BookingWithDetails[]}) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (bookings.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay reservas en curso en este momento.</p>;
  }

  const formatDate = (dateString: string) => {
    if (!dateString || !isClient) return '';
    return format(new Date(dateString), "dd 'de' LLL, yyyy", { locale: es });
  };

  const formatCurrency = (amount: number, currency: 'USD' | 'ARS') => {
    if (!currency) return '...'; // Safeguard for initial render
    if (currency === 'USD') {
        return `USD ${new Intl.NumberFormat('es-AR', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount)}`;
    }
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Propiedad</TableHead>
          <TableHead>Inquilino</TableHead>
          <TableHead>Check-out</TableHead>
          <TableHead>Monto</TableHead>
          <TableHead className="text-right">Saldo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isClient ? bookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell className="font-bold text-green-600">{booking.property?.name || 'N/A'}</TableCell>
            <TableCell className="font-medium">{booking.tenant?.name || 'N/A'}</TableCell>
            <TableCell>{formatDate(booking.endDate)}</TableCell>
            <TableCell>
                <Badge variant="secondary">{formatCurrency(booking.amount, booking.currency)}</Badge>
            </TableCell>
            <TableCell className={`text-right font-bold ${booking.balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {formatCurrency(booking.balance, booking.currency)}
            </TableCell>
          </TableRow>
        )) : (
          <TableRow>
            <TableCell colSpan={5} className="text-center">Cargando...</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
