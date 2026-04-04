

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
import { parseDateSafely } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formatCurrency = (amount: number, currency: 'ARS' | 'USD') => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
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
                toast({ title: "Éxito", description: "Pago registrado correctamente." });
                onActionComplete();
                onOpenChange(false);
            } else {
                toast({ title: "Error", description: result.message, variant: 'destructive' });
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registrar Pago de Liquidación</DialogTitle>
                    <DialogDescription>
                        Abona el saldo para la liquidación del {format(parseDateSafely(liquidation.dateGenerated) || new Date(), "dd-LLL-yy", { locale: es })}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="hidden" name="liquidationId" value={liquidation.id} />
                    <input type="hidden" name="paymentDate" value={paymentDate?.toISOString() || ''} />

                    <div className="border rounded-lg p-3 text-center">
                        <Label>Saldo Actual</Label>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(liquidation.balance, liquidation.currency)}</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="paymentAmount">Monto a Pagar</Label>
                        <Input 
                            id="paymentAmount"
                            name="paymentAmount"
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="paymentDate">Fecha de Pago</Label>
                        <DatePicker date={paymentDate} onDateSelect={setPaymentDate} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="expenseDescription">Descripción del Gasto</Label>
                        <Input
                            id="expenseDescription"
                            name="expenseDescription"
                            defaultValue={`Pago liquidación ${formatDate(liquidation.dateGenerated)}`}
                            required
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="expenseCategoryId">Categoría del Gasto</Label>
                        <Select name="expenseCategoryId" defaultValue="provider_payments">
                             <SelectTrigger>
                                <SelectValue placeholder="Selecciona una categoría..." />
                            </SelectTrigger>
                            <SelectContent>
                                {/* This should be populated dynamically, but for now a default is fine */}
                                <SelectItem value="provider_payments">Pagos a Proveedores</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancelar</Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Registrar Pago
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

