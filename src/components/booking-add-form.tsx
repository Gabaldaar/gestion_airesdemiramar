
'use client';

import { useActionState, useEffect, useRef, useState, useMemo } from 'react';
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
import { Tenant, Booking } from '@/lib/data';
import { PlusCircle, AlertTriangle } from 'lucide-react';
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
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

export function BookingAddForm({ propertyId, tenants, existingBookings }: { propertyId: string, tenants: Tenant[], existingBookings: Booking[] }) {
  const [state, formAction] = useActionState(addBooking, initialState);
  const [isOpen, setIsOpen] = useState(false);
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

  const disabledDays = useMemo(() => {
    // Disable all days that are part of an existing booking range.
    // The `to` date is exclusive, so `react-day-picker` will disable
    // days *up to* but not including the checkout day.
    // This allows a new check-in on the same day as a previous check-out.
    return existingBookings.map(booking => ({
        from: new Date(booking.startDate),
        to: new Date(booking.endDate)
    }));
  }, [existingBookings]);


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { resetForm() }; setIsOpen(open)}}>
      <DialogTrigger asChild>
        <Button onClick={() => { setIsOpen(true); resetForm(); }}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva Reserva
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Reserva</DialogTitle>
          <DialogDescription>
            Completa los datos de la reserva.
          </DialogDescription>
        </DialogHeader>
        
        {conflict && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>¡Conflicto de Fechas!</AlertTitle>
                <AlertDescription>
                    El rango seleccionado se solapa con otra reserva. Puedes continuar si lo deseas.
                </AlertDescription>
            </Alert>
        )}

        <form action={formAction} ref={formRef}>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="tenantId" className="text-right">
                    Inquilino
                    </Label>
                    <Select name="tenantId" required>
                        <SelectTrigger className="col-span-3">
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
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="dates" className="text-right">
                        Fechas
                    </Label>
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                            "col-span-3 justify-start text-left font-normal",
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

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">
                    Monto
                    </Label>
                    <Input id="amount" name="amount" type="number" step="0.01" className="col-span-3" required />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="currency" className="text-right">
                    Moneda
                    </Label>
                    <Select name="currency" defaultValue='USD' required>
                        <SelectTrigger className="col-span-3">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ARS">ARS</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="notes" className="text-right pt-2">
                        Notas
                    </Label>
                    <Textarea id="notes" name="notes" className="col-span-3" />
                </div>
                <input type="hidden" name="propertyId" value={propertyId} />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={!date?.from || !date?.to || !!conflict}>Crear Reserva</Button>
            </DialogFooter>
        </form>
         {state.message && !state.success && (
            <p className="text-red-500 text-sm mt-2">{state.message}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
