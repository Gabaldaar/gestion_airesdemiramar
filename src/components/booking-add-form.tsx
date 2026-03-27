'use client';

import { useEffect, useRef, useState, useMemo, useTransition } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { addBooking } from '@/lib/actions';
import { Tenant, Booking, Origin, getOrigins, BookingStatus, PriceConfig, getPropertyById, Property } from '@/lib/data';
import { PlusCircle, AlertTriangle, Calendar as CalendarIcon, Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { format, addDays, isSameDay } from "date-fns"
import { es } from 'date-fns/locale';
import { cn, checkDateConflict } from "@/lib/utils"
import { calculatePriceForStay } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DateRange } from 'react-day-picker';
import { Textarea } from './ui/textarea';


const initialState = {
  message: '',
  success: false,
};

function SubmitButton({ isDisabled }: { isDisabled: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={isDisabled || pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                </>
            ) : (
                'Crear Reserva'
            )}
        </Button>
    )
}

export function BookingAddForm({
  propertyId,
  properties,
  tenants,
  allBookings,
  onDataChanged,
}: {
  propertyId?: string;
  properties?: Property[];
  tenants: Tenant[];
  allBookings: Booking[];
  onDataChanged: () => void;
}) {
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [origins, setOrigins] = useState<Origin[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [conflict, setConflict] = useState<Booking | null>(null);
  const [amount, setAmount] = useState<number | string>('');

  // New state for handling property selection
  const [selectedPropertyId, setSelectedPropertyId] = useState(propertyId || '');

  // Combobox state
  const [tenantComboboxOpen, setTenantComboboxOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState('');

  const isPropertySelectionMode = !propertyId;

  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await addBooking(initialState, formData);
        setState(result);
    });
  };

  const resetForm = () => {
    formRef.current?.reset();
    setDate(undefined);
    setConflict(null);
    setSelectedTenantId('');
    setSelectedPropertyId(propertyId || ''); // Reset to initial prop or clear
    setAmount('');
  };

  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
      resetForm();
      onDataChanged();
    }
  }, [state, onDataChanged]); // eslint-disable-line react-hooks/exhaustive-deps

  const bookingsForSelectedProperty = useMemo(() => {
    if (!selectedPropertyId) return [];
    return allBookings.filter(b => b.propertyId === selectedPropertyId);
  }, [selectedPropertyId, allBookings]);

  useEffect(() => {
    const calculateAndSetPrice = async () => {
        if (date?.from && date?.to && selectedPropertyId) {
            const conflictingBooking = checkDateConflict(date, bookingsForSelectedProperty, '');
            setConflict(conflictingBooking);

            try {
                const [property, priceConfigsResponse] = await Promise.all([
                    getPropertyById(selectedPropertyId),
                    fetch('/api/get-price-configurations')
                ]);

                if (!property || !priceConfigsResponse.ok) {
                    console.error("No se pudo obtener la propiedad o la configuración de precios.");
                    setAmount('');
                    return;
                }

                const priceConfigs: Record<string, PriceConfig> = await priceConfigsResponse.json();
                const lookupName = property.priceSheetName || property.name;
                const propertyRules = priceConfigs[lookupName];

                const priceResult = calculatePriceForStay(propertyRules, date.from, date.to);

                if (priceResult && !priceResult.error && !priceResult.minNightsError) {
                    setAmount(Math.round(priceResult.totalPrice).toString());
                } else {
                    setAmount('');
                }

            } catch (error) {
                console.error("Error al calcular el precio:", error);
                setAmount('');
            }
        } else {
            setConflict(null);
            setAmount('');
        }
    };
    
    calculateAndSetPrice();
  }, [date, bookingsForSelectedProperty, selectedPropertyId]);
  
   useEffect(() => {
    if (isOpen) {
      getOrigins().then(setOrigins);
      // Reset form state when dialog opens
      resetForm();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const disabledDays = useMemo(() => {
    const activeBookings = bookingsForSelectedProperty.filter(b => !b.status || b.status === 'active');
    
    return activeBookings.flatMap(booking => {
        const startDate = new Date(booking.startDate);
        const endDate = new Date(booking.endDate);
        
        const firstDayToBlock = addDays(startDate, 1);
        const lastDayToBlock = addDays(endDate, -1);
        
        if (firstDayToBlock > lastDayToBlock) {
            return [];
        }
        
        return [{ from: firstDayToBlock, to: lastDayToBlock }];
    });
  }, [bookingsForSelectedProperty]);
  
  const { message: conflictMessage, isOverlap: isDateOverlap } = useMemo(() => {
    if (!conflict || !date?.from || !date?.to) return { message: "", isOverlap: false };
    
    const conflictStart = new Date(conflict.startDate);
    const conflictEnd = new Date(conflict.endDate);
    const selectedStart = new Date(date.from);
    const selectedEnd = new Date(date.to);
    
    if (isSameDay(selectedEnd, conflictStart)) {
      return { message: "Atención: El check-out coincide con el check-in de otra reserva.", isOverlap: false };
    }
    if (isSameDay(selectedStart, conflictEnd)) {
      return { message: "Atención: El check-in coincide con el check-out de otra reserva.", isOverlap: false };
    }

    return { message: "¡Conflicto de Fechas! El rango seleccionado se solapa con una reserva existente.", isOverlap: true };
  }, [conflict, date]);


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { resetForm() }; setIsOpen(open)}}>
      <DialogTrigger asChild>
        <Button onClick={() => { setIsOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva Reserva
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nueva Reserva</DialogTitle>
          <DialogDescription>
            Completa los datos de la reserva.
          </DialogDescription>
        </DialogHeader>
        
        {conflictMessage && (
            <Alert variant={isDateOverlap ? "destructive" : "default"}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{isDateOverlap ? "Conflicto de Fechas" : "Aviso de Fechas"}</AlertTitle>
                <AlertDescription>
                    {conflictMessage}
                </AlertDescription>
            </Alert>
        )}

        <form action={formAction} ref={formRef}>
            <div className="grid gap-4 py-4">
                 {isPropertySelectionMode && properties && (
                    <div className="space-y-2">
                        <Label htmlFor="propertyId-select">Propiedad</Label>
                        <Select name="propertyId-select" value={selectedPropertyId} onValueChange={(value) => { setSelectedPropertyId(value); setDate(undefined); }} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una propiedad..." />
                            </SelectTrigger>
                            <SelectContent>
                                {properties.map(prop => (
                                    <SelectItem key={prop.id} value={prop.id}>{prop.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <div className="space-y-2">
                    <Label htmlFor="tenantId">Inquilino</Label>
                    <input type="hidden" name="tenantId" value={selectedTenantId} required />
                    <Popover open={tenantComboboxOpen} onOpenChange={setTenantComboboxOpen}>
                        <PopoverTrigger asChild>
                            <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={tenantComboboxOpen}
                            className="w-full justify-between"
                            disabled={!selectedPropertyId && isPropertySelectionMode}
                            >
                            {selectedTenantId
                                ? tenants.find((tenant) => tenant.id === selectedTenantId)?.name
                                : "Selecciona un inquilino..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[375px] p-0">
                            <Command>
                            <CommandInput placeholder="Buscar inquilino..." />
                            <CommandList>
                                <CommandEmpty>No se encontró ningún inquilino.</CommandEmpty>
                                <CommandGroup>
                                {tenants.map((tenant) => (
                                    <CommandItem
                                    key={tenant.id}
                                    value={tenant.name}
                                    onSelect={(currentValue) => {
                                        const tenantId = tenants.find(t => t.name.toLowerCase() === currentValue.toLowerCase())?.id || '';
                                        setSelectedTenantId(tenantId === selectedTenantId ? "" : tenantId);
                                        setTenantComboboxOpen(false);
                                    }}
                                    >
                                    <Check
                                        className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedTenantId === tenant.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {tenant.name}
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                            </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="dates">Fechas</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                            )}
                            disabled={!selectedPropertyId && isPropertySelectionMode}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (
                            date.to ? (
                                <>
                                {format(date.from, "dd 'de' LLL, y", { locale: es })} -{" "}
                                {format(date.to, "dd 'de' LLL, y", { locale: es })}
                                </>
                            ) : (
                                format(date.from, "dd 'de' LLL, y", { locale: es })
                            )
                            ) : (
                            <span>Selecciona las fechas</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={1}
                            locale={es}
                            disabled={disabledDays}
                        />
                        </PopoverContent>
                    </Popover>
                    <input type="hidden" name="startDate" value={date?.from?.toISOString() || ''} />
                    <input type="hidden" name="endDate" value={date?.to?.toISOString() || ''} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="originId">Origen</Label>
                    <Select name="originId">
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona un origen" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Ninguno</SelectItem>
                            {origins.map(origin => (
                                <SelectItem key={origin.id} value={origin.id}>
                                    {origin.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-4">
                    <div className="space-y-2 flex-1">
                        <Label htmlFor="amount">Monto</Label>
                        <Input id="amount" name="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="currency">Moneda</Label>
                        <Select name="currency" defaultValue='USD' required>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ARS">ARS</SelectItem>
                                <SelectItem value="USD">USD</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea id="notes" name="notes" />
                </div>
                <input type="hidden" name="propertyId" value={selectedPropertyId} />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                </DialogClose>
                <SubmitButton isDisabled={!date?.from || !date?.to || isDateOverlap || !selectedPropertyId || !selectedTenantId} />
            </DialogFooter>
        </form>
         {state.message && !state.success && (
            <p className="text-red-500 text-sm mt-2">{state.message}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
