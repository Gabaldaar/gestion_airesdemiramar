
'use client';

import { useActionState, useEffect, useRef, useState, useMemo } from 'react';
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
import { Tenant, Booking, Origin, getOrigins } from '@/lib/data';
import { PlusCircle, AlertTriangle, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format, addDays, isSameDay } from "date-fns"
import { es } from 'date-fns/locale';
import { cn, checkDateConflict } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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

export function BookingAddForm({ propertyId, tenants, existingBookings }: { propertyId: string, tenants: Tenant[], existingBookings: Booking[] }) {
  const [state, formAction] = useActionState(addBooking, initialState);
  const [isOpen, setIsOpen] = useState(false);
  const [origins, setOrigins] = useState<Origin[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [conflict, setConflict] = useState<Booking | null>(null);

  const resetForm = () => {
    formRef.current?.reset();
    setDate(undefined);
    setConflict(null);
  };

  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
      resetForm();
    }
  }, [state]);

  useEffect(() => {
    if (date?.from && date?.to) {
        const conflictingBooking = checkDateConflict(date, existingBookings, '');
        setConflict(conflictingBooking);
    } else {
        setConflict(null);
    }
  }, [date, existingBookings]);
  
   useEffect(() => {
    if (isOpen) {
      getOrigins().then(setOrigins);
    }
  }, [isOpen]);

  const disabledDays = useMemo(() => {
    return existingBookings.flatMap(booking => {
        const startDate = new Date(booking.startDate);
        const endDate = new Date(booking.endDate);
        
        const firstDayToBlock = addDays(startDate, 1);
        const lastDayToBlock = addDays(endDate, -1);
        
        if (firstDayToBlock > lastDayToBlock) {
            return [];
        }
        
        return [{ from: firstDayToBlock, to: lastDayToBlock }];
    });
  }, [existingBookings]);
  
  const { message: conflictMessage, isOverlap: isDateOverlap } = useMemo(() => {
    if (!conflict || !date?.from || !date?.to) return { message: "", isOverlap: false };
    
    const conflictStart = new Date(conflict.startDate);
    const conflictEnd = new Date(conflict.endDate);
    const selectedStart = new Date(date.from);
    const selectedEnd = new Date(date.to);
    
    // Check for back-to-back (warning, not an error)
    if (isSameDay(selectedEnd, conflictStart)) {
      return { message: "Atención: El check-out coincide con el check-in de otra reserva.", isOverlap: false };
    }
    if (isSameDay(selectedStart, conflictEnd)) {
      return { message: "Atención: El check-in coincide con el check-out de otra reserva.", isOverlap: false };
    }

    // Any other conflict is a true overlap
    return { message: "¡Conflicto de Fechas! El rango seleccionado se solapa con una reserva existente.", isOverlap: true };
  }, [conflict, date]);


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { resetForm() }; setIsOpen(open)}}>
      <DialogTrigger asChild>
        <Button onClick={() => { setIsOpen(true); resetForm(); }}>
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
                <div className="space-y-2">
                    <Label htmlFor="tenantId">Inquilino</Label>
                    <Select name="tenantId" required>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona un inquilino" />
                        </SelectTrigger>
                        <SelectContent>
                            {tenants.map(tenant => (
                                <SelectItem key={tenant.id} value={tenant.id}>
                                    {tenant.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
                            numberOfMonths={2}
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
                        <Input id="amount" name="amount" type="number" step="0.01" required />
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
                <input type="hidden" name="propertyId" value={propertyId} />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                </DialogClose>
                <SubmitButton isDisabled={!date?.from || !date?.to || isDateOverlap} />
            </DialogFooter>
        </form>
         {state.message && !state.success && (
            <p className="text-red-500 text-sm mt-2">{state.message}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
