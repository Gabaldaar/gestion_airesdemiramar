
'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
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
import { Calendar as CalendarIcon, Loader2, RefreshCw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from './ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useToast } from './ui/use-toast';

export interface Categoria { id: string; nombre: string; }
export interface Cuenta { id: string; nombre: string; }
export interface Billetera { id: string; nombre: string; }
export interface DatosImputacion {
    categorias: Categoria[];
    cuentas: Cuenta[];
    billeteras: Billetera[];
}

const initialState = {
  message: '',
  success: false,
};

export interface PaymentPreloadData {
  amount: number;
  currency: 'USD' | 'ARS';
  exchangeRate?: number;
}

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button type="submit" disabled={isPending}>
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Añadiendo...
        </>
      ) : (
        'Añadir Pago'
      )}
    </Button>
  );
}

interface PaymentAddFormProps {
  bookingId: string;
  onPaymentAdded: () => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  preloadData?: PaymentPreloadData;
}

export function PaymentAddForm({
  bookingId,
  onPaymentAdded,
  isOpen,
  onOpenChange,
  preloadData,
}: PaymentAddFormProps) {
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('USD');
  const [amount, setAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const { toast } = useToast();

  const [datosImputacion, setDatosImputacion] =
    useState<DatosImputacion | null>(null);
  const [isFetchingFinanceData, setIsFetchingFinanceData] = useState(false);
  const [financeApiError, setFinanceApiError] = useState<string | null>(null);
  
  const formAction = (formData: FormData) => {
    startTransition(async () => {
      const result = await addPayment(initialState, formData);
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
      console.error('Failed to fetch dollar rate:', error);
      toast({
        title: 'Error',
        description: 'No se pudo obtener el valor del dólar.',
        variant: 'destructive',
      });
    } finally {
      setIsFetchingRate(false);
    }
  };

  useEffect(() => {
    if (state.success) {
      toast({
        title: 'Éxito',
        description: state.message || 'Pago añadido correctamente.',
      });
      onOpenChange(false);
      onPaymentAdded();
    } else if (state.message) {
      toast({
        title: 'Error',
        description: state.message,
        variant: 'destructive',
      });
    }
  }, [state, onPaymentAdded, onOpenChange, toast]);

  const resetForm = () => {
    formRef.current?.reset();
    setDate(new Date());
    setCurrency('USD');
    setAmount('');
    setExchangeRate('');
    setState(initialState);
    setIsFetchingRate(false);
    setDatosImputacion(null);
    setFinanceApiError(null);
  };

  useEffect(() => {
    const fetchFinanceData = async () => {
      setIsFetchingFinanceData(true);
      setFinanceApiError(null);
      try {
        const response = await fetch('/api/finance-proxy');
        
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Respuesta no válida del proxy de finanzas.');
        }

        setDatosImputacion(data);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido.';
        console.error('Error fetching finance data:', errorMessage);
        setFinanceApiError(`No se pudo conectar a la API de finanzas. Causa: ${errorMessage}`);
      } finally {
        setIsFetchingFinanceData(false);
      }
    };

    if (isOpen) {
      fetchFinanceData();
      if (preloadData) {
        setAmount(preloadData.amount.toString());
        setCurrency(preloadData.currency);
        setExchangeRate(preloadData.exchangeRate?.toString() || '');
      } else {
        resetForm();
        fetchFinanceData();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, preloadData, toast]);

  const handleCurrencyChange = (value: string) => {
    const newCurrency = value as 'ARS' | 'USD';
    setCurrency(newCurrency);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir Pago</DialogTitle>
          <DialogDescription>
            Completa los datos del pago. Se registrará en esta app y en el
            sistema de finanzas.
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
                    variant={'outline'}
                    className={cn(
                      'col-span-3 justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                      format(date, 'PPP', { locale: es })
                    ) : (
                      <span>Selecciona una fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={d => {
                      setDate(d);
                    }}
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
              <Select
                name="currency"
                value={currency}
                onValueChange={handleCurrencyChange}
                required
              >
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
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                className="col-span-3"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
            </div>
            {currency === 'ARS' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="exchangeRate" className="text-right">
                  Valor USD
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="exchangeRate"
                    name="exchangeRate"
                    type="number"
                    step="0.01"
                    placeholder="Valor del USD en ARS"
                    required
                    value={exchangeRate}
                    onChange={e => setExchangeRate(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={fetchRate}
                    disabled={isFetchingRate}
                  >
                    {isFetchingRate ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                Descripción
              </Label>
              <Textarea
                id="description"
                name="description"
                className="col-span-3"
                placeholder="Comentarios sobre el pago..."
              />
            </div>

            {/* Finance API Fields */}
            <div className="border-t pt-4 mt-2 grid gap-4">
              <h4 className="text-md font-medium text-center col-span-4">
                Datos para App de Finanzas
              </h4>
              {isFetchingFinanceData && (
                <div className="text-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline-block" />
                  Cargando datos...
                </div>
              )}
              {financeApiError && !isFetchingFinanceData && (
                 <Alert variant="destructive" className="col-span-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error de API de Finanzas</AlertTitle>
                    <AlertDescription>{financeApiError}</AlertDescription>
                </Alert>
              )}
              {datosImputacion && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="categoria_id" className="text-right">
                      Categoría
                    </Label>
                    <Select name="categoria_id" required>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {datosImputacion.categorias.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cuenta_id" className="text-right">
                      Cuenta
                    </Label>
                    <Select name="cuenta_id" required>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecciona una cuenta" />
                      </SelectTrigger>
                      <SelectContent>
                        {datosImputacion.cuentas.map(cta => (
                          <SelectItem key={cta.id} value={cta.id}>
                            {cta.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="billetera_id" className="text-right">
                      Billetera
                    </Label>
                    <Select name="billetera_id" required>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecciona una billetera" />
                      </SelectTrigger>
                      <SelectContent>
                        {datosImputacion.billeteras.map(bill => (
                          <SelectItem key={bill.id} value={bill.id}>
                            {bill.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <SubmitButton isPending={isPending} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
