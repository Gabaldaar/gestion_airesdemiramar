
'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateBookingExpense } from '@/lib/actions';
import { BookingExpense, ExpenseCategory } from '@/lib/data';
import { Pencil, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from './ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
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
                    Guardando...
                </>
            ) : (
                'Guardar Cambios'
            )}
        </Button>
    )
}

export function BookingExpenseEditForm({ expense, categories }: { expense: BookingExpense, categories: ExpenseCategory[] }) {
  const [state, formAction] = useActionState(updateBookingExpense, initialState);
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date(expense.date));
  const [currency, setCurrency] = useState<'ARS' | 'USD'>(expense.originalUsdAmount ? 'USD' : 'ARS');
  
  const { width } = useWindowSize();
  const isDesktop = (width || 0) >= 768;


  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
    }
  }, [state]);

  const formContent = (
    <form action={formAction} className="space-y-4 px-4 sm:px-0">
        <input type="hidden" name="id" value={expense.id} />
        <input type="hidden" name="bookingId" value={expense.bookingId} />
        <input type="hidden" name="date" value={date?.toISOString() || ''} />
        <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Popover>
                <PopoverTrigger asChild>
                <Button
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
            <Label htmlFor="categoryId">Categoría</Label>
            <Select name="categoryId" defaultValue={expense.categoryId}>
                <SelectTrigger>
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
        <div className="space-y-2">
            <Label htmlFor="currency">Moneda</Label>
            <Select name="currency" value={currency} onValueChange={(value) => setCurrency(value as 'ARS' | 'USD')} required>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ARS">ARS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="space-y-2">
            <Label htmlFor="amount">Monto</Label>
            <Input id="amount" name="amount" type="number" step="0.01" defaultValue={expense.originalUsdAmount || expense.amount} required />
        </div>
        {currency === 'USD' && (
            <div className="space-y-2">
                <Label htmlFor="exchangeRate">Valor USD</Label>
                <Input id="exchangeRate" name="exchangeRate" type="number" step="0.01" defaultValue={expense.exchangeRate} placeholder="Valor del USD en ARS" required />
            </div>
        )}
        <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" name="description" defaultValue={expense.description?.split('|')[0].trim()} />
        </div>
        {state.message && !state.success && (
            <p className="text-red-500 text-sm mt-2">{state.message}</p>
        )}
    </form>
  )

  if (isDesktop) {
    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Editar Gasto</span>
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>Editar Gasto de Reserva</DrawerTitle>
              <DrawerDescription>Modifica los datos del gasto.</DrawerDescription>
            </DrawerHeader>
            <div className="p-4">
                {formContent}
            </div>
            <DrawerFooter className="pt-2 flex-row-reverse">
                <SubmitButton />
                 <DrawerClose asChild>
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
    )
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Editar Gasto</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Editar Gasto de Reserva</DrawerTitle>
          <DrawerDescription>Modifica los datos del gasto.</DrawerDescription>
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
