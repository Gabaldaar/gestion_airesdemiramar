
'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addPayment } from '@/lib/actions';
import { PlusCircle, Calendar as CalendarIcon, Loader2, RefreshCw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from './ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { getDollarRate } from '@/lib/data';
import { Tooltip, TooltipProvider, TooltipTrigger } from './ui/tooltip';

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
                    Añadiendo...
                </>
            ) : (
                'Añadir Pago'
            )}
        </Button>
    )
}

interface PaymentAddFormProps {
    bookingId: string;
    onPaymentAdded: () => void;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function PaymentAddForm({ bookingId, onPaymentAdded, isOpen, onOpenChange }: PaymentAddFormProps) {
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('USD');
  const [exchangeRate, setExchangeRate] = useState('');
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

  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await addPayment(initialState, formData);
        setState(result);
    });
  };

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
      onPaymentAdded();
    }
  }, [state, onPaymentAdded, onOpenChange]);

  // Reset form state when dialog is closed
  useEffect(() => {
    if (!isOpen) {
        formRef.current?.reset();
        setDate(new Date());
        setCurrency('USD');
        setExchangeRate('');
    }
  }, [isOpen]);
  
  const handleCurrencyChange = (value: string) => {
    const newCurrency = value as 'ARS' | 'USD';
    setCurrency(newCurrency);
    if (newCurrency === 'ARS') {
        fetchRate();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Pago</DialogTitle>
          <DialogDescription>
            Completa los datos del pago.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef}>
            <input type="hidden" name="bookingId" value={bookingId} />
            <input type="hidden" name="date" value={date?.toISOString() || ''} />
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date-popover" className="text-right">
                        Fecha
                    </Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date-popover"
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
                            onSelect={(d) => { setDate(d); }}
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
                    <Input id="amount" name="amount" type="number" step="0.01" className="col-span-3" required />
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
                    <Textarea id="description" name="description" className="col-span-3" placeholder="Comentarios sobre el pago..." />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
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
