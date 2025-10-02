
'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
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
import { addPropertyExpense, PropertyExpense, ExpenseCategory } from '@/lib/data';
import { PlusCircle, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
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
            {isPending ? (
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

export function ExpenseAddForm({ propertyId, categories }: { propertyId: string, categories: ExpenseCategory[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const resetForm = () => {
    formRef.current?.reset();
    setDate(new Date());
    setCurrency('ARS');
    setIsOpen(false);
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const originalAmount = parseFloat(formData.get('amount') as string);
    const selectedCurrency = formData.get('currency') as 'ARS' | 'USD';
    const exchangeRateStr = formData.get('exchangeRate') as string;
    const exchangeRate = exchangeRateStr ? parseFloat(exchangeRateStr) : undefined;
    
    let expenseData: Omit<PropertyExpense, 'id'> = {
        propertyId: formData.get("propertyId") as string,
        date: date?.toISOString() || new Date().toISOString(),
        categoryId: formData.get('categoryId') === 'none' ? undefined : formData.get('categoryId') as string,
        description: formData.get('description') as string,
        amount: 0,
        currency: 'ARS',
    };

    if (selectedCurrency === 'USD') {
        if (!exchangeRate || exchangeRate <= 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'El valor del USD es obligatorio para gastos en USD.'});
            return;
        }
        expenseData.originalUsdAmount = originalAmount;
        expenseData.exchangeRate = exchangeRate;
        expenseData.amount = originalAmount * exchangeRate;
    } else {
        expenseData.amount = originalAmount;
    }

    startTransition(async () => {
        try {
            await addPropertyExpense(expenseData);
            toast({ title: 'Éxito', description: 'Gasto añadido correctamente.' });
            resetForm();
            window.location.reload();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: `No se pudo añadir el gasto: ${error.message}` });
        }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Gasto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Gasto a la Propiedad</DialogTitle>
          <DialogDescription>
            Completa los datos del gasto.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} ref={formRef}>
            <input type="hidden" name="propertyId" value={propertyId} />
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
                    <Select name="categoryId" defaultValue="none">
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
                    <Input id="amount" name="amount" type="number" step="0.01" className="col-span-3" required />
                </div>
                 {currency === 'USD' && (
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="exchangeRate" className="text-right">
                        Valor USD
                        </Label>
                        <Input id="exchangeRate" name="exchangeRate" type="number" step="0.01" className="col-span-3" placeholder="Valor del USD en ARS" required />
                    </div>
                )}
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="description" className="text-right pt-2">
                    Descripción
                    </Label>
                    <Textarea id="description" name="description" className="col-span-3" />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <SubmitButton isPending={isPending} />
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    