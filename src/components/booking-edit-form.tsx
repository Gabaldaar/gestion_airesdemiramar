
'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateBooking } from '@/lib/actions';
import { Booking, Tenant, Property } from '@/lib/data';
import { Pencil, Calendar as CalendarIcon } from 'lucide-react';
import { format } from "date-fns"
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DateRange } from 'react-day-picker';


const initialState = {
  message: '',
  success: false,
};

export function BookingEditForm({ booking, tenants, properties }: { booking: Booking, tenants: Tenant[], properties: Property[] }) {
  const [state, formAction] = useActionState(updateBooking, initialState);
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>({
      from: new Date(booking.startDate),
      to: new Date(booking.endDate)
  });

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
          <span className="sr-only">Editar Reserva</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Reserva</DialogTitle>
          <DialogDescription>
            Modifica los datos de la reserva.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
            <input type="hidden" name="id" value={booking.id} />
            <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="propertyId" className="text-right">
                    Propiedad
                    </Label>
                    <Select name="propertyId" defaultValue={String(booking.propertyId)} required>
                        <SelectTrigger className="col-span-3">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {properties.map(property => (
                                <SelectItem key={property.id} value={String(property.id)}>
                                    {property.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="tenantId" className="text-right">
                    Inquilino
                    </Label>
                    <Select name="tenantId" defaultValue={String(booking.tenantId)} required>
                        <SelectTrigger className="col-span-3">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {tenants.map(tenant => (
                                <SelectItem key={tenant.id} value={String(tenant.id)}>
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
                    <Input id="amount" name="amount" type="number" defaultValue={booking.amount} className="col-span-3" required />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="currency" className="text-right">
                    Moneda
                    </Label>
                    <Select name="currency" defaultValue={booking.currency} required>
                        <SelectTrigger className="col-span-3">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ARS">ARS</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                    </Select>
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
