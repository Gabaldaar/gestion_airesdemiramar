
'use client';

import { useActionState, useEffect, useRef, useState, ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose
} from '@/components/ui/drawer';
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
import { PlusCircle, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from './ui/calendar';
import { Textarea } from './ui/textarea';
import useWindowSize from '@/hooks/use-window-size';

const initialState = {
  message: '',
  success: false,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
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
    children?: ReactNode;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function PaymentAddForm({ bookingId, onPaymentAdded, children, isOpen, onOpenChange }: PaymentAddFormProps) {
  const [state, formAction] = useActionState(addPayment, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('USD');

  const { width } = useWindowSize();
  const isDesktop = (width || 0) >= 768;


  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
      onPaymentAdded();
    }
  }, [state, onPaymentAdded, onOpenChange]);
  
  useEffect(() => {
      if (!isOpen) {
        formRef.current?.reset();
        setDate(new Date());
        setCurrency('USD');
      }
  }, [isOpen]);

  const resetFormAndClose = () => {
    onOpenChange(false);
  }
  
  const formContent = (
    <form action={formAction} ref={formRef} className="space-y-4 px-4 sm:px-0">
        <input type="hidden" name="bookingId" value={bookingId} />
        <input type="hidden" name="date" value={date?.toISOString() || ''} />
        <div className="space-y-2">
            <Label htmlFor="date-popover">Fecha</Label>
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
        <div className="space-y-2">
            <Label htmlFor="currency">Moneda</Label>
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
        <div className="space-y-2">
            <Label htmlFor="amount">Monto</Label>
            <Input id="amount" name="amount" type="number" step="0.01" required />
        </div>
        {currency === 'ARS' && (
            <div className="space-y-2">
                <Label htmlFor="exchangeRate">Valor USD</Label>
                <Input id="exchangeRate" name="exchangeRate" type="number" step="0.01" placeholder="Valor del USD en ARS" required />
            </div>
        )}
        <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" name="description" placeholder="Comentarios sobre el pago..."/>
        </div>

        {state.message && !state.success && (
            <p className="text-red-500 text-sm mt-2">{state.message}</p>
        )}
    </form>
  );

  if (isDesktop) {
    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
            {children && <DrawerTrigger asChild>{children}</DrawerTrigger>}
            <DrawerContent>
                 <DrawerHeader className="text-left">
                    <DrawerTitle>Añadir Pago a la Reserva</DrawerTitle>
                    <DrawerDescription>Completa los datos del pago recibido.</DrawerDescription>
                </DrawerHeader>
                <div className="p-4">
                    {formContent}
                </div>
                <DrawerFooter className="pt-2 flex-row-reverse">
                    <SubmitButton />
                     <DrawerClose asChild>
                        <Button type="button" variant="outline" onClick={resetFormAndClose}>Cancelar</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
  }

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
        {children && <DrawerTrigger asChild>{children}</DrawerTrigger>}
        <DrawerContent>
            <DrawerHeader className="text-left">
                <DrawerTitle>Añadir Pago</DrawerTitle>
                <DrawerDescription>Completa los datos del pago recibido.</DrawerDescription>
            </DrawerHeader>
            <div className="overflow-y-auto">
                {formContent}
            </div>
            <DrawerFooter className="pt-2">
                 <SubmitButton />
                <DrawerClose asChild>
                    <Button variant="outline">Cancelar</Button>
                </DrawerClose>
            </DrawerFooter>
        </DrawerContent>
    </Drawer>
  );
}
