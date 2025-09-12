
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookingWithDetails } from "@/lib/data";
import { format } from "date-fns";
import { es } from 'date-fns/locale';

interface DashboardRecentBookingsProps {
  bookings: BookingWithDetails[];
}

export default function DashboardRecentBookings({ bookings }: DashboardRecentBookingsProps) {
    if (bookings.length === 0) {
        return (
            <div className="flex items-center justify-center h-40">
                <p className="text-sm text-muted-foreground">No hay reservas próximas.</p>
            </div>
        )
    }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <div key={booking.id} className="flex items-center p-2 rounded-lg hover:bg-muted/50">
          <Avatar className="h-9 w-9">
            <AvatarImage src={booking.tenant?.imageUrl} alt="Avatar" />
            <AvatarFallback>
                {booking.tenant?.name?.charAt(0).toUpperCase() || 'S/N'}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{booking.tenant?.name || 'Inquilino no especificado'}</p>
            <p className="text-sm text-muted-foreground">{booking.property?.name || 'Propiedad no especificada'}</p>
          </div>
          <div className="ml-auto font-medium text-sm text-right">
              <p>{`Desde ${format(new Date(booking.startDate), "dd/MM/yy", { locale: es })}`}</p>
              <p className="text-xs text-muted-foreground">
                  {booking.currency} {booking.amount.toLocaleString('es-AR')}
              </p>
            </div>
        </div>
      ))}
    </div>
  );
}
