
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookingWithDetails } from "@/lib/data";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn, parseDateSafely } from "@/lib/utils";

export default function DashboardCurrentBookings({ bookings }: { bookings: BookingWithDetails[]}) {
  if (bookings.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No hay reservas en curso en este momento.</p>;
  }

  const formatDate = (dateString: string) => {
    const date = parseDateSafely(dateString);
    if (!date) return 'Fecha inv.';

    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const localDate = new Date(year, month, day);
    return format(localDate, "dd 'de' LLL, yyyy", { locale: es });
  };

  const formatCurrency = (amount: number, currency: 'USD' | 'ARS') => {
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
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking.id} className="bg-green-500/10 border-green-500">
            <CardHeader className="p-4 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg text-green-700">{booking.property?.name || 'N/A'}</CardTitle>
                    <CardDescription>{booking.tenant?.name || 'N/A'}</CardDescription>
                </div>
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">Check-out</p>
                    <p className="font-semibold">{formatDate(booking.endDate)}</p>
                </div>
            </CardHeader>
            <CardFooter className="p-4 flex justify-between items-center bg-background rounded-b-lg">
                <Badge variant="secondary">{formatCurrency(booking.amount, booking.currency)}</Badge>
                <div className={cn("text-right font-bold", booking.balance > 0 ? 'text-orange-600' : 'text-green-600')}>
                    <span className="text-sm font-normal text-muted-foreground mr-2">Saldo:</span>
                    {formatCurrency(booking.balance, booking.currency)}
                </div>
            </CardFooter>
        </Card>
      ))}
    </div>
  );
}
