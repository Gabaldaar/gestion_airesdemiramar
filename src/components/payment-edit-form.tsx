
'use client';

import { useActionState, useEffect, useState, ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updatePayment } from '@/lib/actions';
import { Payment } from '@/lib/data';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from './ui/calendar';
import { Textarea } from './ui/textarea';


const initialState = {
  message: '',
  success: false,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                </>
            ) : (
                'Guardar Cambios'
            )}
        </Button>
    )
}

interface PaymentEditFormProps {
    payment: Payment;
    onPaymentUpdated: () => void;
    children?: ReactNode;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function PaymentEditForm({ payment, onPaymentUpdated, children, isOpen, onOpenChange }: PaymentEditFormProps) {
  const [state, formAction] = useActionState(updatePayment, initialState);
  const [date, setDate] = useState<Date | undefined>(new Date(payment.date));
  const [currency, setCurrency] = useState<'ARS' | 'USD'>(payment.originalArsAmount ? 'ARS' : 'USD');

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
      onPaymentUpdated();
    }
  }, [state, onPaymentUpdated, onOpenChange]);

  const formContent = (
    <form action={formAction}>
        <div className="grid gap-4 py-4">
            <input type="hidden" name="id" value={payment.id} />
            <input type="hidden" name="bookingId" value={payment.bookingId} />
            <input type="hidden" name="date" value={date?.toISOString() || ''} />
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">Fecha</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "col-span-3 justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        locale={es}
                    />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="currency" className="text-right">Moneda</Label>
                <Select name="currency" value={currency} onValueChange={(value) => setCurrency(value as 'ARS' | 'USD')} required>
                    <SelectTrigger className="col-span-3">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="ARS">ARS</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">Monto</Label>
                <Input id="amount" name="amount" type="number" step="0.01" defaultValue={payment.originalArsAmount || payment.amount} className="col-span-3" required />
            </div>
            {currency === 'ARS' && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="exchangeRate" className="text-right">Valor USD</Label>
                    <Input id="exchangeRate" name="exchangeRate" type="number" step="0.01" defaultValue={payment.exchangeRate} placeholder="Valor del USD en ARS" className="col-span-3" required />
                </div>
            )}
            <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right pt-2">Descripción</Label>
                <Textarea id="description" name="description" defaultValue={payment.description?.split('|')[0].trim()} className="col-span-3" placeholder="Comentarios sobre el pago..."/>
            </div>
            {state.message && !state.success && (
                <p className="text-red-500 text-sm mt-2">{state.message}</p>
            )}
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            </DialogClose>
            <SubmitButton />
        </DialogFooter>
    </form>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        {children && <DialogTrigger asChild>{children}</DialogTrigger>}
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Editar Pago</DialogTitle>
                <DialogDescription>Modifica los datos del pago.</DialogDescription>
            </DialogHeader>
            {formContent}
        </DialogContent>
    </Dialog>
  );
}
