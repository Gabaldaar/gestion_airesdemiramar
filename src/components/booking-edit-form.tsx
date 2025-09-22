
'use client';

import { useActionState, useEffect, useRef, useState, useMemo, ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Booking, Tenant, Property, ContractStatus, GuaranteeStatus } from '@/lib/data';
import { Pencil, Calendar as CalendarIcon, AlertTriangle, Loader2 } from 'lucide-react';
import { format, subDays, isSameDay } from "date-fns"
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
import { DatePicker } from './ui/date-picker';


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
                    Guardando...
                </>
            ) : (
                'Guardar Cambios'
            )}
        </Button>
    )
}

interface BookingEditFormProps {
    booking: Booking;
    tenants: Tenant[];
    properties: Property[];
    allBookings?: Booking[];
    children?: ReactNode;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}


export function BookingEditForm({ booking, tenants, properties, allBookings, children, isOpen, onOpenChange }: BookingEditFormProps) {
  const [state, formAction] = useActionState(updateBooking, initialState);
  const [date, setDate] = useState<DateRange | undefined>({
      from: new Date(booking.startDate),
      to: new Date(booking.endDate)
  });
  const [conflict, setConflict] = useState<Booking | null>(null);

  // Guarantee state
  const [guaranteeStatus, setGuaranteeStatus] = useState<GuaranteeStatus>(booking.guaranteeStatus || 'not_solicited');
  const [guaranteeAmount, setGuaranteeAmount] = useState<number | undefined>(booking.guaranteeAmount || undefined);
  const [guaranteeReceivedDate, setGuaranteeReceivedDate] = useState<Date | undefined>(
    booking.guaranteeReceivedDate ? new Date(booking.guaranteeReceivedDate) : undefined
  );
  const [guaranteeReturnedDate, setGuaranteeReturnedDate] = useState<Date | undefined>(
    booking.guaranteeReturnedDate ? new Date(booking.guaranteeReturnedDate) : undefined
  );


  const resetForm = () => {
    setDate({ from: new Date(booking.startDate), to: new Date(booking.endDate) });
    setConflict(null);
    setGuaranteeStatus(booking.guaranteeStatus || 'not_solicited');
    setGuaranteeAmount(booking.guaranteeAmount || undefined);
    setGuaranteeReceivedDate(booking.guaranteeReceivedDate ? new Date(booking.guaranteeReceivedDate) : undefined);
    setGuaranteeReturnedDate(booking.guaranteeReturnedDate ? new Date(booking.guaranteeReturnedDate) : undefined);
  };

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
    }
  }, [state, onOpenChange]);

   useEffect(() => {
    if (date?.from && date?.to && allBookings) {
        const bookingsForProperty = allBookings.filter(b => b.propertyId === booking.propertyId);
        const conflictingBooking = checkDateConflict(date, bookingsForProperty, booking.id);
        setConflict(conflictingBooking);
    } else {
        setConflict(null);
    }
  }, [date, allBookings, booking.id, booking.propertyId]);

  const disabledDays = useMemo(() => {
    if (!allBookings) return [];
    
    const otherBookings = allBookings.filter(b => b.id !== booking.id && b.propertyId === booking.propertyId);
    
    return otherBookings.flatMap(otherBooking => {
        const startDate = new Date(otherBooking.startDate);
        const lastNight = subDays(new Date(otherBooking.endDate), 1);
        if (startDate > lastNight) return [];
        return [{ from: startDate, to: lastNight }];
    });
  }, [allBookings, booking.id, booking.propertyId]);

  const getConflictMessage = (): string => {
    if (!conflict || !date?.from) return "";
    
    const conflictEndDate = new Date(conflict.endDate);
    if (isSameDay(date.from, conflictEndDate)) {
        return "Atención: La fecha de check-in coincide con un check-out el mismo día.";
    }

    return "¡Conflicto de Fechas! El rango seleccionado se solapa con una reserva existente.";
  }

  return (
    <>
      {children}
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { resetForm() }; onOpenChange(open)}}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
            <DialogTitle>Editar Reserva</DialogTitle>
            <DialogDescription>
                Modifica los datos de la reserva.
            </DialogDescription>
            </DialogHeader>

            {conflict && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Alerta de Fechas</AlertTitle>
                    <AlertDescription>
                        {getConflictMessage()}
                    </AlertDescription>
                </Alert>
            )}

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
                                <SelectItem value="not_sent">S/Enviar</SelectItem>
                                <SelectItem value="sent">Enviado</SelectItem>
                                <SelectItem value="signed">Firmado</SelectItem>
                                <SelectItem value="not_required">N/A</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="notes" className="text-right pt-2">
                            Notas
                        </Label>
                        <Textarea id="notes" name="notes" defaultValue={booking.notes} className="col-span-3" />
                    </div>
                    
                    {/* Guarantee Fields */}
                     <div className="col-span-4 border-t pt-4 mt-4">
                        <h4 className="text-md font-semibold mb-2">Garantía</h4>
                         <div className="grid grid-cols-4 items-center gap-4 mb-4">
                             <Label htmlFor="guaranteeStatus" className="text-right">
                                 Estado
                             </Label>
                             <Select name="guaranteeStatus" value={guaranteeStatus} onValueChange={(val) => setGuaranteeStatus(val as GuaranteeStatus)}>
                                 <SelectTrigger className="col-span-3">
                                     <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                     <SelectItem value="not_solicited">S/Solicitar</SelectItem>
                                     <SelectItem value="solicited">Solicitada</SelectItem>
                                     <SelectItem value="received">Recibida</SelectItem>
                                     <SelectItem value="returned">Devuelta</SelectItem>
                                     <SelectItem value="not_applicable">N/A</SelectItem>
                                 </SelectContent>
                             </Select>
                         </div>
                         <div className="grid grid-cols-4 items-center gap-4 mb-4">
                            <Label htmlFor="guaranteeAmount" className="text-right">Monto</Label>
                            <Input id="guaranteeAmount" name="guaranteeAmount" type="number" step="0.01" value={guaranteeAmount || ''} onChange={(e) => setGuaranteeAmount(e.target.value ? parseFloat(e.target.value) : undefined)} className="col-span-2" />
                            <Select name="guaranteeCurrency" defaultValue={booking.guaranteeCurrency || 'USD'}>
                                <SelectTrigger className="col-span-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ARS">ARS</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                </SelectContent>
                            </Select>
                         </div>
                         <div className="grid grid-cols-4 items-center gap-4 mb-4">
                             <Label className="text-right">Fecha Recibida</Label>
                             <div className="col-span-3">
                                <DatePicker date={guaranteeReceivedDate} onDateSelect={setGuaranteeReceivedDate} placeholder='Fecha de recepción' />
                             </div>
                             <input type="hidden" name="guaranteeReceivedDate" value={guaranteeReceivedDate ? guaranteeReceivedDate.toISOString().split('T')[0] : ''} />
                         </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                             <Label className="text-right">Fecha Devuelta</Label>
                             <div className="col-span-3">
                                <DatePicker date={guaranteeReturnedDate} onDateSelect={setGuaranteeReturnedDate} placeholder='Fecha de devolución' />
                             </div>
                             <input type="hidden" name="guaranteeReturnedDate" value={guaranteeReturnedDate ? guaranteeReturnedDate.toISOString().split('T')[0] : ''} />
                         </div>
                     </div>


                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                    </DialogClose>
                    <SubmitButton isDisabled={!date?.from || !date?.to} />
                </DialogFooter>
            </form>
            {state.message && !state.success && (
                <p className="text-red-500 text-sm mt-2">{state.message}</p>
            )}
        </DialogContent>
        </Dialog>
    </>
  );
}
