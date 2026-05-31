'use client';

import { useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addLiquidationPayment } from '@/lib/actions';
import { Liquidation } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DatePicker } from './ui/date-picker';
import { parseDateSafely, cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/i18n/useTranslation';
import { useAuth } from './auth-provider';

const formatCurrency = (amount: number, currency: string) => {
    try {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
    } catch(e) {
        return `${currency} ${amount.toFixed(2)}`;
    }
};

const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Fecha Inválida';
    const date = parseDateSafely(dateString);
    if (!date) return 'Fecha Inválida';
    return format(date, "dd-LLL-yy", { locale: es });
};


export function LiquidationPaymentForm({ liquidation, isOpen, onOpenChange, onActionComplete }: {
    liquidation: Liquidation;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onActionComplete: () => void;
}) {
    const { orgId } = useAuth();
    const { t } = useTranslation();
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const [amount, setAmount] = useState<string>(liquidation.balance.toString());
    const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
    
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        
        startTransition(async () => {
            const result = await addLiquidationPayment({ success: false, message: '' }, formData);
            if (result.success) {
                toast({ title: t('common.success'), description: "Pago registrado correctamente." });
                onActionComplete();
                onOpenChange(false);
            } else {
                toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent
              className="sm:max-w-md p-0 overflow-hidden rounded-3xl"
              onPointerDownOutside={(e) => e.preventDefault()}
              onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader className="p-6 bg-background border-b">
                    <DialogTitle>{t('liquidations.payment.title')}</DialogTitle>
                    <DialogDescription>
                        {t('liquidations.payment.description')
                            .replace('{{date}}', format(parseDateSafely(liquidation.dateGenerated) || new Date(), "dd-LLL-yy", { locale: es }))}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="bg-muted/30">
                    <input type="hidden" name="orgId" value={orgId || ''} />
                    <input type="hidden" name="liquidationId" value={liquidation.id} />
                    <input type="hidden" name="paymentDate" value={paymentDate?.toISOString() || ''} />

                    <div className="p-6 max-h-[60vh] overflow-y-auto shadow-inner border-y border-muted-foreground/10 space-y-4">
                        <div className="border rounded-xl p-4 text-center bg-background shadow-sm">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{t('liquidations.payment.current_balance')}</Label>
                            <p className="text-2xl font-black text-primary">{formatCurrency(liquidation.balance, liquidation.currency)}</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="paymentAmount" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('liquidations.payment.amount_label')}</Label>
                            <Input 
                                id="paymentAmount"
                                name="paymentAmount"
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                className="h-11 bg-background shadow-sm font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="paymentDate" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('liquidations.payment.date_label')}</Label>
                            <DatePicker date={paymentDate} onDateSelect={setPaymentDate} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expenseDescription" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('liquidations.payment.description_label')}</Label>
                            <Input
                                id="expenseDescription"
                                name="expenseDescription"
                                defaultValue={`Pago liquidación ${formatDate(liquidation.dateGenerated)}`}
                                required
                                className="h-11 bg-background shadow-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expenseCategoryId" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('liquidations.payment.category_label')}</Label>
                            <Select name="expenseCategoryId" defaultValue="provider_payments">
                                <SelectTrigger className="bg-background h-11 shadow-sm">
                                    <SelectValue placeholder={t('common.select_category')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="provider_payments">Pagos a Proveedores</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-background border-t">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending} className="font-bold uppercase text-[10px] tracking-widest h-11">{t('common.cancel')}</Button>
                        <Button type="submit" disabled={isPending} className="font-bold uppercase text-[10px] tracking-widest h-11 px-8 shadow-lg">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('liquidations.payment.submit')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
