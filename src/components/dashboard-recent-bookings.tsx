
'use client';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookingWithTenantAndProperty } from "@/lib/data";
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn, parseDateSafely } from "@/lib/utils";

export default function DashboardRecentBookings({ bookings }: { bookings: BookingWithTenantAndProperty[]}) {
  if (bookings.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No hay próximas reservas para mostrar.</p>;
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

  const getBookingColorClass = (booking: BookingWithTenantAndProperty): string => {
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const startDate = parseDateSafely(booking.startDate);
    if (!startDate) return "";
    
    const daysUntilStart = differenceInDays(startDate, todayUTC);

    if (daysUntilStart < 7) return "border-red-500 bg-red-500/10";
    if (daysUntilStart < 15) return "border-orange-500 bg-orange-500/10";
    if (daysUntilStart < 30) return "border-blue-500 bg-blue-500/10";
    return "";
  };

  const getBookingTextColorClass = (booking: BookingWithTenantAndProperty): string => {
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    
    const startDate = parseDateSafely(booking.startDate);
    if (!startDate) return "text-primary";
    
    const daysUntilStart = differenceInDays(startDate, todayUTC);
    if (daysUntilStart < 7) return "text-red-700";
    if (daysUntilStart < 15) return "text-orange-700";
    if (daysUntilStart < 30) return "text-blue-700";
    return "text-primary";
  }


  return (
    <div>
        <div className="flex items-center space-x-4 mb-4 text-xs text-muted-foreground">
            <span className="font-semibold">Leyenda:</span>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>&lt; 30d</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-orange-500 mr-1"></div>&lt; 15d</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>&lt; 7d</div>
        </div>
        <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className={cn(getBookingColorClass(booking))}>
                  <CardHeader className="p-4">
                      <div className="flex items-start justify-between">
                          <div>
                              <CardTitle className={cn("text-lg", getBookingTextColorClass(booking))}>{booking.property?.name || 'N/A'}</CardTitle>
                              <CardDescription>{booking.tenant?.name || 'N/A'}</CardDescription>
                          </div>
                          <Badge variant="secondary">{formatCurrency(booking.amount, booking.currency)}</Badge>
                      </div>
                  </CardHeader>
                  <CardFooter className="p-4 flex justify-between text-sm bg-background rounded-b-lg">
                      <div>
                          <p className="text-muted-foreground">Check-in</p>
                          <p className="font-semibold">{formatDate(booking.startDate)}</p>
                      </div>
                      <div className="text-right">
                          <p className="text-muted-foreground">Check-out</p>
                          <p className="font-semibold">{formatDate(booking.endDate)}</p>
                      </div>
                  </CardFooter>
              </Card>
            ))}
        </div>
    </div>
  );
}
