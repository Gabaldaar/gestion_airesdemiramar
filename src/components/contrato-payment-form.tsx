'use client';

import { useEffect, useState, useTransition, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addContratoPayment } from '@/lib/actions';
import { Contrato, PeriodoPago, CurrencySettings } from '@/lib/data';
import { Loader2, RefreshCw } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { DatePicker } from './ui/date-picker';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from './auth-provider';
import { currencies } from '@/lib/currencies';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { useTranslation } from "@/i18n/useTranslation";

const formatCurrency = (amount: number, currency: string) => {
    try {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
    } catch(e) {
        return `${currency} ${amount.toFixed(2)}`;
    }
};

export function ContratoPaymentForm({ contrato, periodo, isOpen, onOpenChange, onActionComplete }: {
    contrato: Contrato;
    periodo: PeriodoPago;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onActionComplete: () => void;
}) {
    const { appUser, orgId } = useAuth();
    const { t } = useTranslation();
    const isPersonalFlavor = appUser?.appFlavor !== 'commercial';

    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const [amount, setAmount] = useState<string>('');
    const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
    const [currency, setCurrency] = useState<string>(contrato.moneda);
    const [exchangeRate, setExchangeRate] = useState('');
    const [isFetchingRate, setIsFetchingRate] = useState(false);
    const [currencySettings, setCurrencySettings] = useState<CurrencySettings | null>(null);
    
    useEffect(() => {
        if (isOpen) {
            const saldo = periodo.montoAjustado - periodo.montoPagado;
            setAmount(saldo > 0 ? saldo.toFixed(2) : '');
            setPaymentDate(new Date());
            setCurrency(contrato.moneda);
            setExchangeRate('');

            if (appUser?.appFlavor === 'commercial') {
                const currentOrgId = orgId || 'global';
                getDoc(doc(db, 'settings', `currencies_${currentOrgId}`)).then(snap => {
                    if (snap.exists()) setCurrencySettings(snap.data() as CurrencySettings);
                });
            }
        }
    }, [isOpen, periodo, contrato.moneda, appUser, orgId]);

    const fetchRate = async (type: string = 'oficial') => {
        setIsFetchingRate(true);
        try {
            const response = await fetch(`/api/dollar-rate?type=${type}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            setExchangeRate(data.venta.toString());
        } catch (error) {
            console.error("Failed to fetch dollar rate:", error);
            toast({
                title: 'Error',
                description: 'No se pudo obtener el valor del dólar.',
                variant: 'destructive',
            });
        } finally {
            setIsFetchingRate(false);
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        
        startTransition(async () => {
            const result = await addContratoPayment({ success: false, message: '' }, formData);
            if (result.success) {
                toast({ title: t('common.success'), description: "Pago registrado correctamente." });
                onActionComplete();
                onOpenChange(false);
            } else {
                toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
            }
        });
    };

    const isConversionNeeded = useMemo(() => {
        const debtCur = (contrato.moneda || 'USD').toUpperCase();
        const currentCur = (currency || 'USD').toUpperCase();
        return currentCur !== debtCur;
    }, [currency, contrato.moneda]);

    // Autofetch dollar rate when conversion is needed
    useEffect(() => {
        if (isConversionNeeded && !exchangeRate && !isFetchingRate && isPersonalFlavor && isOpen) {
            fetchRate();
        }
    }, [isConversionNeeded, exchangeRate, isFetchingRate, isPersonalFlavor, isOpen]);

    const saldo = periodo.montoAjustado - periodo.montoPagado;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent 
              className="sm:max-w-md p-0 overflow-hidden rounded-3xl flex flex-col max-h-[90vh]"
              onPointerDownOutside={(e) => e.preventDefault()}
              onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader className="p-6 bg-background border-b shrink-0">
                    <DialogTitle>{t('contratos.register_payment_dialog.title')}</DialogTitle>
                    <DialogDescription>
                        {t('contratos.register_payment_dialog.description').replace('{{date}}', periodo.fechaVencimiento)}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden bg-muted/30">
                    <input type="hidden" name="orgId" value={orgId || ''} />
                    <input type="hidden" name="contratoId" value={contrato.id} />
                    <input type="hidden" name="periodoPagoId" value={periodo.id} />
                    <input type="hidden" name="date" value={paymentDate?.toISOString() || ''} />

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 shadow-inner">
                        <div className="border rounded-xl p-4 text-center bg-background shadow-sm">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{t('contratos.register_payment_dialog.pending_balance')}</Label>
                            <p className="text-2xl font-black text-primary">{formatCurrency(saldo, contrato.moneda)}</p>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="currency" className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('contratos.register_payment_dialog.currency')}</Label>
                            <Select
                                name="currency"
                                value={currency}
                                onValueChange={setCurrency}
                                required
                            >
                                <SelectTrigger className="col-span-3 bg-background h-11 shadow-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {isPersonalFlavor ? (
                                        <>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="ARS">ARS</SelectItem>
                                        </>
                                    ) : (
                                        (currencySettings?.favoriteCurrencies?.length ?? 0) > 0 ? (
                                            currencySettings!.favoriteCurrencies.map(code => {
                                                const currencyInfo = currencies.find(c => c.code === code);
                                                return (
                                                    <SelectItem key={code} value={code}>
                                                        {currencyInfo ? currencyInfo.name : code}
                                                    </SelectItem>
                                                )
                                            })
                                        ) : (
                                        <>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="ARS">ARS</SelectItem>
                                        </>
                                        )
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('contratos.register_payment_dialog.amount')}</Label>
                            <Input 
                                id="amount"
                                name="amount"
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="col-span-3 h-11 bg-background shadow-sm font-bold"
                                required
                            />
                        </div>

                        {isConversionNeeded && isPersonalFlavor && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="exchangeRate" className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('expenses.add_dialog.exchange_rate')}</Label>
                                <div className="col-span-3 flex items-center gap-2">
                                    <Input 
                                        id="exchangeRate" 
                                        name="exchangeRate" 
                                        type="number" 
                                        step="0.01" 
                                        placeholder={t('expenses.add_dialog.exchange_rate_placeholder')} 
                                        required 
                                        value={exchangeRate} 
                                        onChange={(e) => setExchangeRate(e.target.value)} 
                                        className="h-11 bg-background shadow-sm"
                                    />
                                    <Button type="button" variant="outline" size="icon" onClick={() => fetchRate()} disabled={isFetchingRate} className="h-11 w-11 shrink-0 shadow-sm">
                                        {isFetchingRate ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('contratos.register_payment_dialog.date')}</Label>
                            <div className="col-span-3">
                                <DatePicker date={paymentDate} onDateSelect={setPaymentDate} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('contratos.register_payment_dialog.description')}</Label>
                            <Textarea 
                                id="description"
                                name="description"
                                placeholder="..."
                                className="bg-background shadow-inner min-h-[80px]"
                            />
                        </div>
                    </div>
                    
                    <DialogFooter className="p-6 bg-background border-t shrink-0 flex flex-row items-center justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending} className="font-bold uppercase text-[10px] tracking-widest h-11">{t('common.cancel')}</Button>
                        <Button type="submit" disabled={isPending || !amount || parseFloat(amount) <= 0} className="font-bold uppercase text-[10px] tracking-widest h-11 px-8 shadow-lg">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('contratos.register_payment_dialog.submit')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
