
'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
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
import { addPayment } from '@/lib/actions';
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
        <Button type="submit" disabled={pending} className="w-full">
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
}


export function PaymentAddForm({ bookingId, onPaymentAdded }: PaymentAddFormProps) {
  const [state, formAction] = useActionState(addPayment, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('USD');
  
  const resetForm = () => {
      formRef.current?.reset();
      setDate(new Date());
      setCurrency('USD');
  };
  
  useEffect(() => {
    if (state.success) {
      onPaymentAdded();
      resetForm();
    }
  }, [state.success, onPaymentAdded]);


  return (
    <form action={formAction} ref={formRef}>
        <input type="hidden" name="bookingId" value={bookingId} />
        <input type="hidden" name="date" value={date?.toISOString() || ''} />
        <div className="grid gap-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="date-popover">
                    Fecha
                </Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date-popover"
                        variant={"outline"}
                        className={cn(
                        "w-full justify-start text-left font-normal",
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
              <div className='flex gap-4'>
                <div className="space-y-2 flex-grow">
                    <Label htmlFor="amount">
                    Monto
                    </Label>
                    <Input id="amount" name="amount" type="number" step="0.01" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="currency">
                    Moneda
                    </Label>
                    <Select name="currency" value={currency} onValueChange={(value) => setCurrency(value as 'ARS' | 'USD')} required>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="ARS">ARS</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
             {currency === 'ARS' && (
                 <div className="space-y-2">
                    <Label htmlFor="exchangeRate">
                    Valor USD
                    </Label>
                    <Input id="exchangeRate" name="exchangeRate" type="number" step="0.01" placeholder="Valor del USD en ARS" required />
                </div>
            )}
             <div className="space-y-2">
                <Label htmlFor="description">
                    Descripción
                </Label>
                <Textarea id="description" name="description" placeholder="Comentarios sobre el pago..." />
            </div>
        </div>
        <SubmitButton />
     {state.message && !state.success && (
        <p className="text-red-500 text-sm mt-2">{state.message}</p>
    )}
    </form>
  );
}
