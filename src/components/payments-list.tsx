'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from './ui/card';
import { PaymentWithDetails } from "@/lib/data";
import { format } from 'date-fns';
import { es, enUS, ptBR } from 'date-fns/locale';
import { PaymentEditForm } from "./payment-edit-form";
import { PaymentDeleteForm } from "./payment-delete-form";
import { parseDateSafely, cn } from '@/lib/utils';
import { Banknote, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from "@/i18n/useTranslation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Button } from './ui/button';

const locales: Record<string, any> = { es, en: enUS, pt: ptBR };

interface PaymentsListProps {
  payments: PaymentWithDetails[];
}

const formatCurrency = (amount: number | undefined, currency: string) => {
    const val = amount || 0;
    const options: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0,
    };
    try {
        return new Intl.NumberFormat('es-AR', options).format(val);
    } catch (e) {
        return `${currency} ${Math.round(val)}`;
    }
};

export default function PaymentsList({ payments }: PaymentsListProps) {
  const { t, language } = useTranslation();
  const currentLocale = locales[language] || es;

  const [editingPayment, setEditingPayment] = useState<PaymentWithDetails | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<PaymentWithDetails | null>(null);

  const totalsByCurrency = useMemo(() => {
    const totals: Record<string, number> = { 'ARS': 0, 'USD': 0 };
    payments.forEach(p => {
        const cur = p.realReceivedCurrency || 'USD';
        const amount = p.realReceivedAmount || 0;
        totals[cur] = (totals[cur] || 0) + amount;
    });
    return totals;
  }, [payments]);

  const formatDate = (dateString: string) => {
    const date = parseDateSafely(dateString);
    if (!date) return 'Fecha inválida';
    return format(date, "dd 'de' LLLL, yyyy", { locale: currentLocale });
  };

  const handleAction = () => {
    window.location.reload();
  };

  const renderActions = (payment: PaymentWithDetails) => (
    <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingPayment(payment)}>
            <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingPayment(payment)}>
            <Trash2 className="h-4 w-4" />
        </Button>
    </div>
  );

  if (payments.length === 0) {
    return <p className="text-sm text-center text-muted-foreground py-8">{t('bookings.no_bookings')}</p>;
  }

  return (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(totalsByCurrency).map(([currency, total]) => {
                if (total === 0 && (currency !== 'ARS' && currency !== 'USD')) return null;
                const isUsd = currency === 'USD';
                return (
                    <Card key={currency} className={cn(
                        "overflow-hidden border-2 shadow-sm",
                        isUsd ? "border-green-500/40" : "border-blue-500/40"
                    )}>
                        <CardHeader className={cn(
                            "flex flex-row items-center justify-between space-y-0 py-3 px-4",
                            isUsd ? "bg-green-500/10" : "bg-blue-500/10"
                        )}>
                            <CardTitle className={cn(
                                "text-[10px] font-bold uppercase tracking-wider",
                                isUsd ? "text-green-700" : "text-blue-700"
                            )}>
                                {t('common.totals')} ({currency})
                            </CardTitle>
                            <Banknote className={cn(
                                "h-4 w-4",
                                isUsd ? "text-green-600" : "text-blue-600"
                            )} />
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className={cn(
                                "text-xl sm:text-2xl font-bold truncate px-1",
                                isUsd ? "text-green-700" : "text-blue-700"
                            )}>
                                {formatCurrency(total, currency)}
                            </div>
                            <p className="text-[10px] text-muted-foreground uppercase mt-1 font-medium">
                                {t('payments_page.received_physically')}
                            </p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {payments.map(p => {
                const isUsdReceived = p.realReceivedCurrency === 'USD';
                return (
                    <Card key={p.id} className={cn(
                        "flex flex-col w-full overflow-hidden border-2 shadow-sm transition-all",
                        isUsdReceived ? "border-green-500/30" : "border-blue-500/30"
                    )}>
                        <CardHeader className={cn("p-4 py-3", isUsdReceived ? "bg-green-500/10" : "bg-blue-500/10")}>
                            <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0 flex-1">
                                    <CardTitle className={cn("text-lg truncate font-bold", isUsdReceived ? "text-green-700" : "text-blue-700")}>{p.propertyName || 'N/A'}</CardTitle>
                                    <CardDescription className="font-medium truncate text-primary">{p.tenantName || 'N/A'}</CardDescription>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <span className={cn("font-bold text-lg block leading-none", isUsdReceived ? "text-green-700" : "text-blue-700")}>
                                        {formatCurrency(p.realReceivedAmount, p.realReceivedCurrency || 'USD')}
                                    </span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-2 text-sm flex-grow">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">{t('common.date')}</span>
                                <span className="font-medium">{formatDate(p.date)}</span>
                            </div>
                            {p.description && (
                                <div className="flex flex-col space-y-1 pt-2">
                                    <span className="text-muted-foreground">{t('common.description')}</span>
                                    <p className="font-medium text-xs p-2 bg-muted/30 rounded-md whitespace-pre-wrap leading-tight">{p.description}</p>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="p-2 px-4 justify-end border-t bg-muted/30">
                            {renderActions(p)}
                        </CardFooter>
                    </Card>
                );
            })}
        </div>

        {editingPayment && (
            <PaymentEditForm 
                payment={editingPayment} 
                isOpen={!!editingPayment}
                onOpenChange={(open) => !open && setEditingPayment(null)}
                onPaymentUpdated={handleAction} 
            />
        )}

        {deletingPayment && (
            <PaymentDeleteForm 
                paymentId={deletingPayment.id} 
                isOpen={!!deletingPayment}
                onOpenChange={(open) => !open && setDeletingPayment(null)}
                onPaymentDeleted={handleAction} 
            />
        )}
    </div>
  );
}