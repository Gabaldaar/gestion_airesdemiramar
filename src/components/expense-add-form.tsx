

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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addPropertyExpense } from '@/lib/actions';
import { Calendar as CalendarIcon, Loader2, RefreshCw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from './ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { ExpenseCategory, Provider } from '@/lib/data';

const initialState = {
  message: '',
  success: false,
};

export interface ExpensePreloadData {
  amount: number;
  description: string;
  currency?: 'ARS' | 'USD';
  taskId?: string;
  providerId?: string | null;
  propertyName?: string;
  providerName?: string;
  amountPaidSoFar?: number;
}


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

const formatCurrency = (amount: number, currency: 'USD' | 'ARS' = 'ARS') => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency, minimumFractionDigits: 0 }).format(amount);
}

export function ExpenseAddForm({
    propertyId,
    categories,
    providers,
    children,
    isOpen,
    onOpenChange,
    onExpenseAdded,
    preloadData
}: {
    propertyId: string,
    categories: ExpenseCategory[],
    providers?: Provider[],
    children?: React.ReactNode,
    isOpen: boolean,
    onOpenChange: (isOpen: boolean) => void;
    onExpenseAdded: () => void;
    preloadData?: ExpensePreloadData;
}) {
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [exchangeRate, setExchangeRate] = useState('');
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState<string>('none');

  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await addPropertyExpense(initialState, formData);
        setState(result);
    });
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
  
  const resetForm = () => {
    formRef.current?.reset();
    setDate(new Date());
    setCurrency('ARS');
    setExchangeRate('');
    setAmount('');
    setDescription('');
    setSelectedProviderId('none');
    onOpenChange(false);
    setState(initialState);
    setIsFetchingRate(false);
  }

  useEffect(() => {
    if (state.success) {
      onExpenseAdded();
      resetForm();
    }
  }, [state, onExpenseAdded]); // eslint-disable-line react-hooks/exhaustive-deps
  
  useEffect(() => {
    if (isOpen) {
        if (preloadData) {
            setAmount(preloadData.amount.toString());
            setDescription(preloadData.description);
            if (preloadData.currency) {
                setCurrency(preloadData.currency);
            }
            if (preloadData.providerId) {
                setSelectedProviderId(preloadData.providerId);
            }
        }
    } else {
        // Clear form when dialog closes
        setAmount('');
        setDescription('');
        setCurrency('ARS');
        setSelectedProviderId('none');
    }
  }, [isOpen, preloadData]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Gasto</DialogTitle>
           <DialogDescription>
                Completa los datos del gasto.
                {preloadData?.propertyName && <> para la propiedad <span className="font-semibold text-foreground">{preloadData.propertyName}</span></>}
            </DialogDescription>
            {(preloadData?.providerName || (preloadData?.amountPaidSoFar && preloadData.amountPaidSoFar > 0)) && (
                <div className="text-sm text-muted-foreground border-t pt-2 mt-2 space-y-1">
                    {preloadData.providerName && <p>Proveedor: <span className="font-medium text-foreground">{preloadData.providerName}</span></p>}
                    {(preloadData.amountPaidSoFar && preloadData.amountPaidSoFar > 0) && <p>Pagado hasta ahora: <span className="font-medium text-foreground">{formatCurrency(preloadData.amountPaidSoFar, preloadData.currency)}</span></p>}
                </div>
            )}
        </DialogHeader>
        <form action={formAction} ref={formRef}>
            <input type="hidden" name="propertyId" value={propertyId} />
            <input type="hidden" name="date" value={date?.toISOString() || ''} />
            {preloadData?.taskId && <input type="hidden" name="taskId" value={preloadData.taskId} />}
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
                    <Label htmlFor="categoryId" className="text-right">
                        Categoría
                    </Label>
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
                {providers && (
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="providerId" className="text-right">
                            Proveedor
                        </Label>
                        <Select name="providerId" value={selectedProviderId} onValueChange={setSelectedProviderId}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecciona un proveedor" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Sin Asignar</SelectItem>
                                {providers.map(provider => (
                                    <SelectItem key={provider.id} value={provider.id}>
                                        {provider.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
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
                    <Input id="amount" name="amount" type="number" step="0.01" className="col-span-3" required value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                 {currency === 'USD' && (
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
                    <Textarea id="description" name="description" className="col-span-3" value={description} onChange={e => setDescription(e.target.value)} />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
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
