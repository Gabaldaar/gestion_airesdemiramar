
'use client';

import { useActionState, useEffect, useState } from 'react';
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
import { updatePropertyExpense } from '@/lib/actions';
import { PropertyExpense } from '@/lib/data';
import { Pencil, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from './ui/calendar';

const initialState = {
  message: '',
  success: false,
};

export function ExpenseEditForm({ expense }: { expense: PropertyExpense }) {
  const [state, formAction] = useActionState(updatePropertyExpense, initialState);
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date(expense.date));

  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Editar Gasto</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Gasto</DialogTitle>
          <DialogDescription>
            Modifica los datos del gasto.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
            <input type="hidden" name="id" value={expense.id} />
            <input type="hidden" name="propertyId" value={expense.propertyId} />
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
                    <Label htmlFor="description" className="text-right">
                    Descripción
                    </Label>
                    <Input id="description" name="description" defaultValue={expense.description} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">
                    Monto (ARS)
                    </Label>
                    <Input id="amount" name="amount" type="number" step="0.01" defaultValue={expense.amount} className="col-span-3" required />
                </div>
            </div>
            <DialogFooter>
                <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
        </form>
         {state.message && !state.success && (
            <p className="text-red-500 text-sm mt-2">{state.message}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
