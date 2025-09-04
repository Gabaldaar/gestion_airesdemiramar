
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
import { updateBooking } from '@/lib/actions';
import { Booking, Tenant, Property, ContractStatus } from '@/lib/data';
import { Pencil, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';
import { format } from "date-fns"
import { es } from 'date-fns/locale';
import { cn, checkDateConflict } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DateRange } from 'react-day-picker';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';


const initialState = {
  message: '',
  success: false,
};

export function BookingEditForm({ booking, tenants, properties, allBookings }: { booking: Booking, tenants: Tenant[], properties: Property[], allBookings?: Booking[] }) {
  const [state, formAction] = useActionState(updateBooking, initialState);
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>({
      from: new Date(booking.startDate),
      to: new Date(booking.endDate)
  });
  const [conflict, setConflict] = useState<Booking | null>(null);
  const formId = `booking-edit-form-${booking.id}`;

  const resetForm = () => {
    setDate({ from: new Date(booking.startDate), to: new Date(booking.endDate) });
    setConflict(null);
  };

  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
    }
  }, [state]);

   useEffect(() => {
    if (date?.from && date?.to && allBookings) {
        const bookingsForProperty = allBookings.filter(b => b.propertyId === booking.propertyId);
        const conflictingBooking = checkDateConflict(date, bookingsForProperty, booking.id);
        setConflict(conflictingBooking);
    } else {
        setConflict(null);
    }
  }, [date, allBookings, booking.id, booking.propertyId]);


  return (
    <>
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { resetForm() }; setIsOpen(open)}}>
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

            {conflict && (
                <Alert variant="destructive" className='mb-4'>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>¡Conflicto de Fechas!</AlertTitle>
                    <AlertDescription>
                        El rango seleccionado se solapa con otra reserva.
                    </AlertDescription>
                </Alert>
            )}

            <form id={formId} action={formAction}>
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
                                    <SelectItem key={property.id} value={property.id}>
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
                        <Input id="amount" name="amount" type="number" step="0.01" defaultValue={booking.amount} className="col-span-3" required />
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
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="contractStatus" className="text-right">
                        Contrato
                        </Label>
                        <Select name="contractStatus" defaultValue={booking.contractStatus || 'not_sent'} required>
                            <SelectTrigger className="col-span-3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="not_sent">Sin Enviar</SelectItem>
                                <SelectItem value="sent">Enviado</SelectItem>
                                <SelectItem value="signed">Firmado</SelectItem>
                                <SelectItem value="not_required">No Requiere</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="notes" className="text-right pt-2">
                            Notas
                        </Label>
                        <Textarea id="notes" name="notes" defaultValue={booking.notes} className="col-span-3" />
                    </div>

                </div>
            </form>
             <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                </DialogClose>
                <Button type="submit" form={formId} disabled={!date?.from || !date?.to}>Guardar Cambios</Button>
            </DialogFooter>
            {state.message && !state.success && (
                <p className="text-red-500 text-sm mt-2">{state.message}</p>
            )}
        </DialogContent>
        </Dialog>
    </>
  );
}
