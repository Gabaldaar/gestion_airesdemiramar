'use client';

import { useEffect, useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { applyContratoAdjustment } from '@/lib/actions';
import { Contrato, PeriodoPago } from '@/lib/data';
import { Loader2, TrendingUp, Calculator } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { useTranslation } from "@/i18n/useTranslation";

const formatCurrency = (amount: number, currency: string) => {
    try {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
    } catch(e) {
        return `${currency} ${amount.toFixed(2)}`;
    }
};

export function ContratoAdjustmentForm({ contrato, periodo, baseAmount, isOpen, onOpenChange, onActionComplete }: {
    contrato: Contrato;
    periodo: PeriodoPago;
    baseAmount: number;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onActionComplete: () => void;
}) {
    const { t } = useTranslation();
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    
    const [percentage, setPercentage] = useState<string>('');
    const [newAmount, setNewAmount] = useState<string>('');
    const [indexName, setIndexName] = useState<string>('');

    const currentAmount = baseAmount; // Usamos el monto base (mes anterior) para los cálculos

    useEffect(() => {
        if (isOpen) {
            setPercentage('');
            // Si ya tiene un ajuste aplicado, mostramos el monto actual, pero la base será la del mes anterior.
            setNewAmount(periodo.montoAjustado.toString());
            // Si ya tenía un índice, intentar extraer el nombre para pre-completar (ej: "ICL (45%)")
            const savedIndex = periodo.indiceAplicado || '';
            if (savedIndex.includes('(')) {
                setIndexName(savedIndex.split('(')[0].trim());
            } else if (!savedIndex.includes('%')) {
                setIndexName(savedIndex);
            }
        }
    }, [isOpen, periodo, currentAmount]);

    const handlePercentageChange = (val: string) => {
        setPercentage(val);
        const p = parseFloat(val);
        if (!isNaN(p)) {
            const calculated = currentAmount * (1 + p / 100);
            setNewAmount(calculated.toFixed(2));
        } else {
            setNewAmount(currentAmount.toString());
        }
    };

    const handleAmountChange = (val: string) => {
        setNewAmount(val);
        const a = parseFloat(val);
        if (!isNaN(a) && currentAmount > 0) {
            const p = ((a / currentAmount) - 1) * 100;
            setPercentage(p.toFixed(2));
        } else {
            setPercentage('');
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        formData.append('contratoId', contrato.id);
        formData.append('periodoPagoId', periodo.id);
        formData.append('newAmount', newAmount);
        formData.append('indexApplied', indexName ? `${indexName} (${percentage}%)` : `${percentage}%`);
        
        startTransition(async () => {
            const result = await applyContratoAdjustment({ success: false, message: '' }, formData);
            if (result.success) {
                toast({ title: t('common.success'), description: result.message });
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
              className="sm:max-w-md"
              onPointerDownOutside={(e) => e.preventDefault()}
              onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        {t('contratos.adjustment_dialog.title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('contratos.adjustment_dialog.description')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                    <div className="bg-muted/50 p-4 rounded-lg border text-center space-y-1">
                        <Label className="text-xs uppercase text-muted-foreground font-bold">{t('contratos.adjustment_dialog.base_value')}</Label>
                        <p className="text-2xl font-bold">{formatCurrency(currentAmount, contrato.moneda)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="percentage">{t('contratos.adjustment_dialog.increase')}</Label>
                            <div className="relative">
                                <Input 
                                    id="percentage"
                                    type="number"
                                    step="0.01"
                                    value={percentage}
                                    onChange={(e) => handlePercentageChange(e.target.value)}
                                    placeholder="Ej: 45"
                                    className="pr-8"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newAmount">{t('contratos.adjustment_dialog.new_amount')}</Label>
                            <Input 
                                id="newAmount"
                                type="number"
                                step="0.01"
                                value={newAmount}
                                onChange={(e) => handleAmountChange(e.target.value)}
                                className="font-bold text-primary"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="indexName">{t('contratos.adjustment_dialog.reference')}</Label>
                        <Input 
                            id="indexName"
                            value={indexName}
                            onChange={(e) => setIndexName(e.target.value)}
                            placeholder="..."
                        />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md flex items-start gap-3">
                        <Calculator className="h-5 w-5 text-blue-600 mt-0.5" />
                        <p className="text-xs text-blue-800 dark:text-blue-300">
                            <strong>Nota:</strong> {t('contratos.adjustment_dialog.note')}
                        </p>
                    </div>
                    
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>{t('common.cancel')}</Button>
                        <Button type="submit" disabled={isPending || !newAmount || parseFloat(newAmount) <= 0}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('contratos.adjustment_dialog.submit')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
