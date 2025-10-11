
'use client';

import { useActionState, useEffect, useRef, useState, ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addBookingExpense } from '@/lib/actions';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from './ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { ExpenseCategory } from '@/lib/data';
import useWindowSize from '@/hooks/use-window-size';

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
                'Añadir Gasto'
            )}
        </Button>
    )
}

interface BookingExpenseAddFormProps {
    bookingId: string;
    onExpenseAdded: () => void;
    categories: ExpenseCategory[];
    children?: ReactNode;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function BookingExpenseAddForm({ bookingId, onExpenseAdded, categories, children, isOpen, onOpenChange }: BookingExpenseAddFormProps) {
  const [state, formAction] = useActionState(addBookingExpense, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
  
  const { width } = useWindowSize();
  const isDesktop = (width || 0) >= 768;


  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
      onExpenseAdded();
    }
  }, [state, onExpenseAdded, onOpenChange]);

  useEffect(() => {
    if (!isOpen) {
      // Reset form state when dialog closes
      formRef.current?.reset();
      setDate(new Date());
      setCurrency('ARS');
    }
  }, [isOpen]);

  const resetFormAndClose = () => {
    onOpenChange(false);
  }

  const formContent = (
     <form action={formAction} ref={formRef}>
        <div className="grid gap-4 py-4">
            <input type="hidden" name="bookingId" value={bookingId} />
            <input type="hidden" name="date" value={date?.toISOString() || ''} />
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date-popover" className="text-right">Fecha</Label>
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
                        onSelect={setDate}
                        initialFocus
                        locale={es}
                    />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="categoryId" className="text-right">Categoría</Label>
                <Select name="categoryId">
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Sin Categoría</SelectItem>
                        {categories.map(category => (
                            <SelectItem key={category.id} value={category.id}>
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="currency" className="text-right">Moneda</Label>
                <Select name="currency" value={currency} onValueChange={(value) => setCurrency(value as 'ARS' | 'USD')} required>
                    <SelectTrigger className="col-span-3">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ARS">ARS</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">Monto</Label>
                <Input id="amount" name="amount" type="number" step="0.01" className="col-span-3" required />
            </div>
            {currency === 'USD' && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="exchangeRate" className="text-right">Valor USD</Label>
                    <Input id="exchangeRate" name="exchangeRate" type="number" step="0.01" className="col-span-3" placeholder="Valor del USD en ARS" required />
                </div>
            )}
            <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right pt-2">Descripción</Label>
                <Textarea id="description" name="description" className="col-span-3" />
            </div>

            {state.message && !state.success && (
                <p className="text-red-500 text-sm mt-2">{state.message}</p>
            )}
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline" onClick={resetFormAndClose}>Cancelar</Button>
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
                <DialogTitle>Añadir Gasto a la Reserva</DialogTitle>
                <DialogDescription>Completa los datos del gasto.</DialogDescription>
            </DialogHeader>
            {formContent}
      </DialogContent>
    </Dialog>
  );
}
