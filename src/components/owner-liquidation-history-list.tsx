
'use client';

import { useState } from 'react';
import { OwnerLiquidation, Property } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { format } from 'date-fns';
import { es, enUS, ptBR } from 'date-fns/locale';
import { parseDateSafely, cn } from '@/lib/utils';
import { OwnerLiquidationDetailsDialog } from './owner-liquidation-details-dialog';
import { ScrollText, Calendar, DollarSign, ChevronRight } from 'lucide-react';
import { useTranslation } from "@/i18n/useTranslation";

const locales: Record<string, any> = { es, en: enUS, pt: ptBR };

const formatCurrency = (amount: number, currency: string) => {
    try {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
    } catch(e) {
        return `${currency} ${amount.toFixed(0)}`;
    }
};

const formatDate = (dateStr: string) => {
    const date = parseDateSafely(dateStr);
    return date ? format(date, 'dd/MM/yyyy') : 'N/A';
};

export function OwnerLiquidationHistoryList({ liquidations, property, onActionComplete }: {
    liquidations: OwnerLiquidation[];
    property: Property;
    onActionComplete: () => void;
}) {
    const { t, language } = useTranslation();
    const currentLocale = locales[language] || es;
    const [selectedLiquidation, setSelectedLiquidation] = useState<OwnerLiquidation | null>(null);

    if (liquidations.length === 0) {
        return <p className="text-center text-muted-foreground py-8">{t('owner_liquidations.no_liquidations')}</p>;
    }

    const formatPeriod = (from: string, to: string) => {
        const fromDate = parseDateSafely(from);
        const toDate = parseDateSafely(to);
        if (!fromDate || !toDate) return t('common.none');
        return `${format(fromDate, 'MMM yy', { locale: currentLocale })} - ${format(toDate, 'MMM yy', { locale: currentLocale })}`;
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {liquidations.map(liq => (
                    <Card key={liq.id} className={cn(
                        "overflow-hidden border-2 shadow-sm flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
                        liq.status === 'paid' ? "border-green-500/40" : "border-orange-500/40"
                    )}>
                        <CardHeader className={cn(
                            "p-4 py-3 flex flex-row items-center justify-between space-y-0",
                            liq.status === 'paid' ? "bg-green-500/10" : "bg-orange-500/10"
                        )}>
                            <div className="flex flex-col">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('owner_liquidations.issue_date')}</p>
                                <p className="font-bold text-sm">{formatDate(liq.dateGenerated)}</p>
                            </div>
                            <Badge variant={liq.status === 'paid' ? 'default' : 'secondary'} className={cn(
                                "text-[10px] h-5 uppercase font-bold",
                                liq.status === 'paid' ? "bg-green-600" : "bg-orange-500 text-white"
                            )}>
                                {liq.status === 'paid' ? t('owner_portal.status.paid') : t('owner_portal.status.pending')}
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-4 grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
                                    <Calendar className="h-3 w-3" /> {t('owner_liquidations.period')}
                                </div>
                                <p className="text-sm font-medium capitalize">{formatPeriod(liq.periodFrom, liq.periodTo)}</p>
                            </div>
                            <div className="text-right space-y-1">
                                <div className="flex items-center justify-end gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
                                    <DollarSign className="h-3 w-3" /> {t('owner_liquidations.net_to_owner')}
                                </div>
                                <p className="text-lg font-black text-primary leading-none">
                                    {formatCurrency(liq.netToOwner, liq.currency)}
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="p-2 px-4 border-t bg-muted/30 flex justify-end">
                            <Button variant="ghost" size="sm" className="h-8 font-bold text-primary" onClick={() => setSelectedLiquidation(liq)}>
                                {t('common.details')} <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {selectedLiquidation && (
                <OwnerLiquidationDetailsDialog 
                    liquidation={selectedLiquidation}
                    property={property}
                    isOpen={!!selectedLiquidation}
                    onOpenChange={(open) => !open && setSelectedLiquidation(null)}
                    onActionComplete={onActionComplete}
                />
            )}
        </>
    );
}
