'use client';

import React, { useState, useTransition, useCallback } from 'react';
import { Liquidation, LiquidationWithProvider, Property, TaskScope } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { LiquidationDetailsDialog } from './liquidation-details-dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseDateSafely, cn } from '@/lib/utils';
import { LiquidationPaymentForm } from './liquidation-payment-form';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from './ui/alert-dialog';
import { revertLiquidation } from '@/lib/actions';
import { useToast } from './ui/use-toast';
import { Loader2, Trash2, FileText, Landmark } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { useTranslation } from '@/i18n/useTranslation';

const formatDate = (dateString: string) => {
    const date = parseDateSafely(dateString);
    if (!date) return 'Fecha Inválida';
    return format(date, "dd-LLL-yy", { locale: es });
};

const formatCurrency = (amount: number, currency: string) => {
    try {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
    } catch(e) {
        return `${currency} ${amount.toFixed(2)}`;
    }
};

const getStatusBadge = (status: Liquidation['status'], t: any) => {
    switch (status) {
        case 'paid':
            return <Badge variant="default" className="bg-green-600 text-[10px] uppercase font-bold h-5">{t('liquidations.history.status.paid')}</Badge>;
        case 'partially_paid':
            return <Badge variant="secondary" className="bg-yellow-500 text-black text-[10px] uppercase font-bold h-5">{t('liquidations.history.status.partial')}</Badge>;
        case 'pending_payment':
            return <Badge variant="outline" className="text-[10px] uppercase font-bold h-5">{t('liquidations.history.status.pending')}</Badge>;
        default:
            return <Badge variant="destructive">Desconocido</Badge>;
    }
};

const getStatusStyles = (status: Liquidation['status']): { headerClass: string; titleColor: string } => {
    switch (status) {
        case 'paid':
            return { headerClass: "bg-green-500/10", titleColor: "text-green-700" };
        case 'partially_paid':
            return { headerClass: "bg-yellow-500/10", titleColor: "text-amber-700" };
        case 'pending_payment':
            return { headerClass: "bg-blue-500/10", titleColor: "text-blue-700" };
        default:
            return { headerClass: "bg-primary/5", titleColor: "text-primary" };
    }
};

export function LiquidationsHistoryList({ liquidations, onDataRefreshed }: {
    liquidations: LiquidationWithProvider[];
    properties: Property[];
    scopes: TaskScope[];
    onDataRefreshed: () => void;
}) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const [selectedLiquidation, setSelectedLiquidation] = useState<LiquidationWithProvider | null>(null);
    const [paymentLiquidation, setPaymentLiquidation] = useState<LiquidationWithProvider | null>(null);
    const [revertingLiquidation, setRevertingLiquidation] = useState<LiquidationWithProvider | null>(null);
    const [confirmText, setConfirmText] = useState("");

    const handleRevert = useCallback(() => {
        if (!revertingLiquidation) return;
        
        const hasPayments = revertingLiquidation.amountPaid > 0;
        const confirmationString = "REVERTIR";

        if (hasPayments && confirmText !== confirmationString) {
            toast({
                title: t('common.error'),
                description: t('liquidations.history.revert.confirm_label'),
                variant: "destructive",
            });
            return;
        }

        startTransition(async () => {
            const result = await revertLiquidation({ success: false, message: '' }, revertingLiquidation.id);
            if (result.success) {
                toast({ title: t('common.success'), description: result.message || "La liquidación ha sido revertida." });
                setRevertingLiquidation(null);
                setConfirmText("");
                onDataRefreshed();
            } else {
                toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
            }
        });
    }, [revertingLiquidation, confirmText, toast, t, onDataRefreshed]);

    if (liquidations.length === 0) {
        return <p className="text-center text-muted-foreground p-8">{t('liquidations.history.no_liquidations')}</p>;
    }

    const renderActions = (liq: LiquidationWithProvider) => (
        <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedLiquidation(liq)}>
                <FileText className="h-4 w-4" />
            </Button>
            
            {liq.status !== 'paid' && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => setPaymentLiquidation(liq)}>
                    <Landmark className="h-4 w-4" />
                </Button>
            )}

            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setRevertingLiquidation(liq)}>
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );

    return (
        <>
            <div className="space-y-4 lg:hidden">
                {liquidations.map(liq => {
                    const { headerClass, titleColor } = getStatusStyles(liq.status);
                    return (
                        <Card key={liq.id} className="flex flex-col w-full overflow-hidden border shadow-sm">
                            <CardHeader className={cn("p-4 py-3", headerClass)}>
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0 flex-1">
                                        <CardTitle className={cn("text-lg truncate font-bold", titleColor)}>{liq.providerName}</CardTitle>
                                        <CardDescription className="font-medium text-xs">{formatDate(liq.dateGenerated)}</CardDescription>
                                    </div>
                                    {getStatusBadge(liq.status, t)}
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 grid gap-2 text-sm flex-grow">
                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-muted-foreground">{t('liquidations.history.table.amount')}</span>
                                    <span className="font-bold text-lg text-primary">{formatCurrency(liq.totalAmount, liq.currency)}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="p-2 px-4 justify-end gap-2 border-t bg-muted/30">
                                {renderActions(liq)}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            <div className="hidden lg:block border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>{t('liquidations.history.table.date')}</TableHead>
                            <TableHead>{t('liquidations.history.table.provider')}</TableHead>
                            <TableHead className="text-right">{t('liquidations.history.table.amount')}</TableHead>
                            <TableHead className="text-right">{t('liquidations.history.table.balance')}</TableHead>
                            <TableHead className="text-center">{t('liquidations.history.table.status')}</TableHead>
                            <TableHead className="text-right">{t('common.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {liquidations.map(liq => (
                            <TableRow key={liq.id}>
                                <TableCell>{formatDate(liq.dateGenerated)}</TableCell>
                                <TableCell className="font-bold text-primary">{liq.providerName}</TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency(liq.totalAmount, liq.currency)}</TableCell>
                                <TableCell className="text-right font-bold text-orange-600">{liq.balance > 0.01 ? formatCurrency(liq.balance, liq.currency) : '-'}</TableCell>
                                <TableCell className="text-center">{getStatusBadge(liq.status, t)}</TableCell>
                                <TableCell className="text-right">
                                    {renderActions(liq)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {selectedLiquidation && (
                <LiquidationDetailsDialog
                    liquidation={selectedLiquidation}
                    isOpen={!!selectedLiquidation}
                    onOpenChange={(isOpen) => !isOpen && setSelectedLiquidation(null)}
                />
            )}
            
            {paymentLiquidation && (
                <LiquidationPaymentForm
                    liquidation={paymentLiquidation}
                    isOpen={!!paymentLiquidation}
                    onOpenChange={(isOpen) => !isOpen && setPaymentLiquidation(null)}
                    onActionComplete={onDataRefreshed}
                />
            )}

            <AlertDialog open={!!revertingLiquidation} onOpenChange={(open) => { if (!open) { setConfirmText(""); setRevertingLiquidation(null); } }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('liquidations.history.revert.title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('liquidations.history.revert.description')}
                            {revertingLiquidation && revertingLiquidation.amountPaid > 0 && (
                                <span className="font-bold text-destructive mt-2 block">{t('liquidations.history.revert.warning_payments')}</span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {revertingLiquidation && revertingLiquidation.amountPaid > 0 && (
                        <div className="space-y-2 my-4">
                            <Label htmlFor="confirm-revert-text" className="font-semibold">{t('liquidations.history.revert.confirm_label')}</Label>
                            <Input id="confirm-revert-text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" placeholder="REVERTIR" />
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleRevert} 
                            disabled={!!(isPending || (revertingLiquidation && revertingLiquidation.amountPaid > 0 && confirmText !== "REVERTIR"))} 
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('liquidations.history.revert.confirm_button')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}