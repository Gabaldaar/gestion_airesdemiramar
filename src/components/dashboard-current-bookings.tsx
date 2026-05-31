
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
import { DashboardStay } from "./dashboard-client";
import { format, isPast, isSameDay, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn, parseDateSafely } from "@/lib/utils";
import { useTranslation } from "@/i18n/useTranslation";
import { Activity } from "lucide-react";

export default function DashboardCurrentBookings({ bookings }: { bookings: DashboardStay[]}) {
  const { t } = useTranslation();
  const today = startOfToday();

  if (bookings.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-2xl bg-muted/20 min-h-[200px]">
            <Activity className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-bold text-muted-foreground">{t('dashboard.status.no_current')}</p>
            <p className="text-[11px] text-muted-foreground/60 max-w-[200px]">{t('dashboard.status.no_current_desc')}</p>
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
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch (e) {
        return `${currency} ${amount.toFixed(2)}`;
    }
  };

  return (
    <div className="space-y-4">
      {bookings.map((booking) => {
          const endDate = parseDateSafely(booking.endDate);
          const isCancelled = booking.status === 'cancelled';
          const isPending = booking.status === 'pending';
          const isLongTerm = booking.agreementType === 'long_term';
          
          let visualStatus = booking.status || 'active';
          if (!isCancelled && !isPending && endDate && isPast(endDate) && !isSameDay(endDate, today)) {
              visualStatus = 'closed';
          }

          return (
            <Card key={`${booking.agreementType}-${booking.id}`} className={cn(
                "border-l-4",
                isLongTerm ? "border-l-purple-500 bg-purple-500/5" : "border-l-green-500 bg-green-500/5"
            )}>
                <CardHeader className="p-4 flex flex-row items-center justify-between">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={cn(
                                "text-[9px] uppercase font-bold px-1.5 h-4",
                                isLongTerm ? "border-purple-200 text-purple-700 bg-purple-50" : "border-blue-200 text-blue-700 bg-blue-50"
                            )}>
                                {isLongTerm ? t('bookings.tabs.contracts') : t('bookings.tabs.temporary')}
                            </Badge>
                        </div>
                        <CardTitle className="text-lg truncate">{booking.property?.name || 'N/A'}</CardTitle>
                        <CardDescription className="font-medium text-primary">{booking.tenant?.name || 'N/A'}</CardDescription>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Check-out</p>
                        <p className="font-semibold text-sm">{formatDate(booking.endDate)}</p>
                    </div>
                </CardHeader>
                <CardFooter className="p-3 flex justify-between items-center bg-background/50 rounded-b-lg border-t">
                    <Badge variant="secondary" className="font-bold">{formatCurrency(booking.amount, booking.currency)}</Badge>
                    {!isLongTerm && (
                        <div className={cn("text-right font-bold text-sm", booking.balance > 0 ? 'text-orange-600' : 'text-green-600')}>
                            <span className="text-[10px] font-normal text-muted-foreground mr-2 uppercase">Saldo:</span>
                            {formatCurrency(booking.balance, booking.currency)}
                        </div>
                    )}
                </CardFooter>
            </Card>
          );
      })}
    </div>
  );
}
