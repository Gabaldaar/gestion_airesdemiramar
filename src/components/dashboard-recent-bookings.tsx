
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
import { DashboardStay } from "./dashboard-client";
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn, parseDateSafely } from "@/lib/utils";
import { useTranslation } from "@/i18n/useTranslation";
import { Calendar } from "lucide-react";

export default function DashboardRecentBookings({ bookings }: { bookings: DashboardStay[]}) {
  const { t } = useTranslation();
  
  if (bookings.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-2xl bg-muted/20 min-h-[200px]">
            <Calendar className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-bold text-muted-foreground">{t('dashboard.status.no_upcoming')}</p>
            <p className="text-[11px] text-muted-foreground/60 max-w-[200px]">{t('dashboard.status.no_upcoming_desc')}</p>
        </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = parseDateSafely(dateString);
    if (!date) return 'Fecha inv.';
    return format(date, "dd 'de' LLLL, yyyy", { locale: es });
  };

  const formatCurrency = (amount: number, currency: string) => {
    try {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    } catch (e) {
        return `${currency} ${Math.round(amount)}`;
    }
  };

  const getBookingColorClass = (booking: DashboardStay): string => {
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const startDate = parseDateSafely(booking.startDate);
    if (!startDate) return "";
    
    const daysUntilStart = differenceInDays(startDate, todayUTC);

    if (daysUntilStart < 7) return "border-red-500 bg-red-500/5";
    if (daysUntilStart < 15) return "border-orange-500 bg-orange-500/5";
    if (daysUntilStart < 30) return "border-blue-500 bg-blue-500/5";
    return "bg-muted/30";
  };

  const getBookingTextColorClass = (booking: DashboardStay): string => {
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
    <div className="space-y-4">
        {bookings.map((booking) => {
            const isLongTerm = booking.agreementType === 'long_term';
            return (
              <Card key={`${booking.agreementType}-${booking.id}`} className={cn("overflow-hidden border shadow-sm", getBookingColorClass(booking))}>
                  <CardHeader className="p-4 pb-3">
                      <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                              <Badge variant="outline" className={cn(
                                "text-[9px] uppercase font-bold px-1.5 h-4 mb-1.5",
                                isLongTerm ? "border-purple-200 text-purple-700 bg-purple-50" : "border-blue-200 text-blue-700 bg-blue-50"
                              )}>
                                {isLongTerm ? t('bookings.tabs.contracts') : t('bookings.tabs.temporary')}
                              </Badge>
                              <CardTitle className={cn("text-base truncate", getBookingTextColorClass(booking))}>{booking.property?.name || 'N/A'}</CardTitle>
                              <CardDescription className="font-semibold text-primary truncate">{booking.tenant?.name || 'N/A'}</CardDescription>
                          </div>
                          <Badge variant="secondary" className="shrink-0">{formatCurrency(booking.amount, booking.currency)}</Badge>
                      </div>
                  </CardHeader>
                  <CardFooter className="p-3 grid grid-cols-2 text-xs bg-background/50 rounded-b-lg border-t">
                      <div className="space-y-0.5">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Check-in</p>
                          <p className="font-semibold">{formatDate(booking.startDate)}</p>
                      </div>
                      <div className="text-right space-y-0.5">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Check-out</p>
                          <p className="font-semibold">{formatDate(booking.endDate)}</p>
                      </div>
                  </CardFooter>
              </Card>
            )
        })}
    </div>
  );
}
