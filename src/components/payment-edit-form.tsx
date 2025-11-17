
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
import { addPayment, updatePayment } from '@/lib/actions';
import { Payment } from '@/lib/data';
import { getDollarRate } from '@/lib/api-actions';
import { Pencil, Calendar as CalendarIcon, Loader2, RefreshCw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from './ui/calendar';
import { Textarea } from './ui/textarea';
import { Tooltip, TooltipProvider, TooltipTrigger } from './ui/tooltip';


const initialState = {
  message: '',
  success: false,
};

function SubmitButton({ isEdit }: { isEdit: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEdit ? 'Guardando...' : 'Añadiendo...'}
                </>
            ) : (
                isEdit ? 'Guardar Cambios' : 'Añadir Pago'
            )}
        </Button>
    )
}

interface PaymentEditFormProps {
    payment?: Payment;
    bookingId?: string;
    onPaymentUpdated: () => void;
    children?: ReactNode;
}


export function PaymentEditForm({ payment, bookingId, onPaymentUpdated, children }: PaymentEditFormProps) {
  const isEdit = !!payment;
  const action = isEdit ? updatePayment : addPayment;
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(isEdit ? new Date(payment.date) : new Date());
  const [currency, setCurrency] = useState<'ARS' | 'USD'>(isEdit ? (payment.originalArsAmount ? 'ARS' : 'USD') : 'USD');
  const [exchangeRate, setExchangeRate] = useState(isEdit ? payment.exchangeRate?.toString() || '' : '');
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  
  const fetchRate = async () => {
    setIsFetchingRate(true);
    try {
        const rate = await getDollarRate();
        setExchangeRate(rate.toString());
    } catch (error) {
        console.error("Error fetching dollar rate:", error);
    } finally {
        setIsFetchingRate(false);
    }
  };

  const handleCurrencyChange = (value: string) => {
    const newCurrency = value as 'ARS' | 'USD';
    setCurrency(newCurrency);
    if (newCurrency === 'ARS') {
        fetchRate();
    }
  };


  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await action(initialState, formData);
        setState(result);
    });
  };

  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
      onPaymentUpdated();
    }
  }, [state, onPaymentUpdated]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
        setState(initialState);
        setDate(isEdit ? new Date(payment.date) : new Date());
        setCurrency(isEdit ? (payment.originalArsAmount ? 'ARS' : 'USD') : 'USD');
        setExchangeRate(isEdit ? payment.exchangeRate?.toString() || '' : '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEdit]);


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
          <DialogTitle>{isEdit ? 'Editar' : 'Añadir'} Pago</DialogTitle>
          <DialogDescription>
            Modifica los datos del pago.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
            {isEdit && <input type="hidden" name="id" value={payment.id} />}
            <input type="hidden" name="bookingId" value={payment?.bookingId || bookingId} />
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
                    <Input id="amount" name="amount" type="number" step="0.01" defaultValue={payment?.originalArsAmount || payment?.amount} className="col-span-3" required />
                </div>
                 {currency === 'ARS' && (
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="exchangeRate" className="text-right">
                        Valor USD
                        </Label>
                        <div className="col-span-3 relative">
                            <Input id="exchangeRate" name="exchangeRate" type="number" step="0.01" placeholder="Valor del USD en ARS" required value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} />
                             <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                {isFetchingRate ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                ) : (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button type="button" onClick={fetchRate}>
                                                    <RefreshCw className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Actualizar cotización</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                 <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="description" className="text-right pt-2">
                        Descripción
                    </Label>
                    <Textarea id="description" name="description" defaultValue={payment?.description?.split('|')[0].trim()} className="col-span-3" placeholder="Comentarios sobre el pago..." />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <SubmitButton isEdit={isEdit} />
            </DialogFooter>
        </form>
         {state.message && !state.success && (
            <p className="text-red-500 text-sm mt-2">{state.message}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
