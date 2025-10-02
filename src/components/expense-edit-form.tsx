
'use client';

import { useEffect, useState, useTransition } from 'react';
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
import { updatePropertyExpense } from '@/lib/data';
import { PropertyExpense, ExpenseCategory } from '@/lib/data';
import { Pencil, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from './ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { useToast } from './ui/use-toast';

function SubmitButton({ isPending }: { isPending: boolean }) {
    return (
        <Button type="submit" disabled={isPending}>
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

export function ExpenseEditForm({ expense, categories }: { expense: PropertyExpense, categories: ExpenseCategory[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date(expense.date));
  const [currency, setCurrency] = useState<'ARS' | 'USD'>(expense.originalUsdAmount ? 'USD' : 'ARS');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const originalAmount = parseFloat(formData.get('amount') as string);
    const selectedCurrency = formData.get('currency') as 'ARS' | 'USD';
    const exchangeRateStr = formData.get('exchangeRate') as string;
    const exchangeRate = exchangeRateStr ? parseFloat(exchangeRateStr) : undefined;
    
    let updatedData: Partial<PropertyExpense> = {
        id: expense.id,
        propertyId: expense.propertyId,
        date: date?.toISOString() || new Date().toISOString(),
        categoryId: formData.get('categoryId') === 'none' ? undefined : formData.get('categoryId') as string,
        description: formData.get('description') as string,
        amount: 0, // Calculated in ARS
        currency: 'ARS'
    };

    if (selectedCurrency === 'USD') {
        if (!exchangeRate || exchangeRate <= 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'El valor del USD es obligatorio para gastos en USD.'});
            return;
        }
        updatedData.originalUsdAmount = originalAmount;
        updatedData.exchangeRate = exchangeRate;
        updatedData.amount = originalAmount * exchangeRate;
    } else {
        updatedData.amount = originalAmount;
        updatedData.originalUsdAmount = undefined;
        updatedData.exchangeRate = undefined;
    }

    startTransition(async () => {
        try {
            await updatePropertyExpense(updatedData as PropertyExpense);
            toast({ title: 'Éxito', description: 'Gasto actualizado.' });
            setIsOpen(false);
            window.location.reload();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: `No se pudo actualizar el gasto: ${error.message}` });
        }
    });
  };

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
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date-picker" className="text-right">
                        Fecha
                    </Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date-picker"
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
                    <Label htmlFor="categoryId" className="text-right">
                        Categoría
                    </Label>
                    <Select name="categoryId" defaultValue={expense.categoryId || 'none'}>
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
                    <Label htmlFor="currency" className="text-right">
                    Moneda
                    </Label>
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
                    <Label htmlFor="amount" className="text-right">
                    Monto
                    </Label>
                    <Input id="amount" name="amount" type="number" step="0.01" defaultValue={expense.originalUsdAmount || expense.amount} className="col-span-3" required />
                </div>
                {currency === 'USD' && (
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="exchangeRate" className="text-right">
                        Valor USD
                        </Label>
                        <Input id="exchangeRate" name="exchangeRate" type="number" step="0.01" defaultValue={expense.exchangeRate} className="col-span-3" placeholder="Valor del USD en ARS" required />
                    </div>
                )}
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="description" className="text-right pt-2">
                    Descripción
                    </Label>
                    <Textarea id="description" name="description" defaultValue={expense.description?.split('|')[0].trim()} className="col-span-3" />
                </div>
            </div>
            <DialogFooter>
                 <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <SubmitButton isPending={isPending}/>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    