
'use client';

import { useEffect, useState, ReactNode, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Pencil, Calendar as CalendarIcon, Loader2, RefreshCw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn, parseDateSafely } from '@/lib/utils';
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
}


export function PaymentEditForm({ payment, onPaymentUpdated, children }: PaymentEditFormProps) {
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(parseDateSafely(payment.date));
  const [currency, setCurrency] = useState<'ARS' | 'USD'>(payment.originalArsAmount ? 'ARS' : 'USD');
  const [exchangeRate, setExchangeRate] = useState(payment.exchangeRate?.toString() || '');
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  
  const handleCurrencyChange = (value: string) => {
    const newCurrency = value as 'ARS' | 'USD';
    setCurrency(newCurrency);
  };

  const fetchRate = async () => {
    setIsFetchingRate(true);
    try {
        const response = await fetch('/api/dollar-rate');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setExchangeRate(data.venta.toString());
    } catch (error) {
        console.error("Failed to fetch dollar rate:", error);
    } finally {
        setIsFetchingRate(false);
    }
  };


  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await updatePayment(initialState, formData);
        setState(result);
    });
  };

  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
      onPaymentUpdated();
    }
  }, [state, onPaymentUpdated]);

  useEffect(() => {
    if (!isOpen) {
        setState(initialState);
        setDate(parseDateSafely(payment.date));
        setCurrency(payment.originalArsAmount ? 'ARS' : 'USD');
        setExchangeRate(payment.exchangeRate?.toString() || '');
        setIsFetchingRate(false);
    }
  }, [isOpen, payment]);


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Editar Pago</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Pago</DialogTitle>
          <DialogDescription>
            Modifica los datos del pago.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
            <input type="hidden" name="id" value={payment.id} />
            <input type="hidden" name="bookingId" value={payment.bookingId} />
            <input type="hidden" name="date" value={date?.toISOString() || ''} />
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date" className="text-right">
                        Fecha
                    </Label>
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
                    <Label htmlFor="currency" className="text-right">
                    Moneda
                    </Label>
                    <Select name="currency" value={currency} onValueChange={handleCurrencyChange} required>
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
                    <Label htmlFor="amount" className="text-right">
                    Monto
                    </Label>
                    <Input id="amount" name="amount" type="number" step="0.01" defaultValue={payment.originalArsAmount || payment.amount} className="col-span-3" required />
                </div>
                 {currency === 'ARS' && (
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="exchangeRate" className="text-right">
                        Valor USD
                        </Label>
                        <div className="col-span-3 flex items-center gap-2">
                           <Input id="exchangeRate" name="exchangeRate" type="number" step="0.01" placeholder="Valor del USD en ARS" required value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} />
                            <Button type="button" variant="outline" size="icon" onClick={fetchRate} disabled={isFetchingRate}>
                                {isFetchingRate ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                )}
                 <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="description" className="text-right pt-2">
                        Descripción
                    </Label>
                    <Textarea id="description" name="description" defaultValue={payment.description?.split('|')[0].trim()} className="col-span-3" placeholder="Comentarios sobre el pago..." />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <SubmitButton />
            </DialogFooter>
        </form>
         {state.message && !state.success && (
            <p className="text-red-500 text-sm mt-2">{state.message}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

    