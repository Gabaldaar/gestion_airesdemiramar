
'use client';

import { useEffect, useState, useMemo, ReactNode, useTransition } from 'react';
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
import { updateBooking } from '@/lib/data';
import { Booking, Tenant, Property, ContractStatus, GuaranteeStatus, Origin, getOrigins } from '@/lib/data';
import { Calendar as CalendarIcon, AlertTriangle, Loader2 } from 'lucide-react';
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
import { useToast } from './ui/use-toast';


function SubmitButton({ isDisabled, isPending }: { isDisabled: boolean, isPending: boolean }) {
    return (
        <Button type="submit" disabled={isDisabled || isPending}>
            {isPending ? (
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
    onBookingUpdated: () => void;
}


export function BookingEditForm({ booking, tenants, properties, allBookings, children, isOpen, onOpenChange, onBookingUpdated }: BookingEditFormProps) {
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [date, setDate] = useState<DateRange | undefined>({
      from: new Date(booking.startDate),
      to: new Date(booking.endDate)
  });
  const [conflict, setConflict] = useState<Booking | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Guarantee state
  const [guaranteeStatus, setGuaranteeStatus] = useState<GuaranteeStatus>(booking.guaranteeStatus || 'not_solicited');
  const [guaranteeAmount, setGuaranteeAmount] = useState<string | undefined>(
    booking.guaranteeAmount !== null && booking.guaranteeAmount !== undefined 
      ? String(booking.guaranteeAmount) 
      : undefined
  );
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
    setGuaranteeAmount(booking.guaranteeAmount ? String(booking.guaranteeAmount) : undefined);
    setGuaranteeReceivedDate(booking.guaranteeReceivedDate ? new Date(booking.guaranteeReceivedDate) : undefined);
    setGuaranteeReturnedDate(booking.guaranteeReturnedDate ? new Date(booking.guaranteeReturnedDate) : undefined);
  };

  useEffect(() => {
    if (isOpen) {
      getOrigins().then(setOrigins);
      resetForm(); // Reset form state every time it opens
    }
  }, [isOpen, booking]); // Rerun when booking changes as well

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const updatedBookingData: Partial<Booking> = {
        id: formData.get("id") as string,
        propertyId: formData.get("propertyId") as string,
        tenantId: formData.get("tenantId") as string,
        startDate: date?.from?.toISOString(),
        endDate: date?.to?.toISOString(),
        amount: parseFloat(formData.get("amount") as string),
        currency: formData.get("currency") as 'USD' | 'ARS',
        notes: formData.get("notes") as string,
        contractStatus: formData.get("contractStatus") as ContractStatus,
        originId: formData.get("originId") === 'none' ? undefined : formData.get("originId") as string,
        guaranteeStatus: formData.get("guaranteeStatus") as GuaranteeStatus,
        guaranteeCurrency: formData.get("guaranteeCurrency") as 'USD' | 'ARS',
    };

    const guaranteeAmountStr = formData.get("guaranteeAmount") as string;
    updatedBookingData.guaranteeAmount = (guaranteeAmountStr && guaranteeAmountStr !== '') ? parseFloat(guaranteeAmountStr) : undefined;
    
    const guaranteeReceivedDateStr = guaranteeReceivedDate ? guaranteeReceivedDate.toISOString().split('T')[0] : undefined;
    updatedBookingData.guaranteeReceivedDate = guaranteeReceivedDateStr;

    const guaranteeReturnedDateStr = guaranteeReturnedDate ? guaranteeReturnedDate.toISOString().split('T')[0] : undefined;
    updatedBookingData.guaranteeReturnedDate = guaranteeReturnedDateStr;

    startTransition(async () => {
        try {
            await updateBooking(updatedBookingData);
            toast({ title: "Éxito", description: "Reserva actualizada." });
            onBookingUpdated();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error updating booking:", error);
            toast({ variant: "destructive", title: "Error", description: `No se pudo actualizar la reserva: ${error.message}` });
        }
    });
  };

  return (
    <>
      {children}
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { resetForm() }; onOpenChange(open)}}>
        <DialogContent className="sm:max-w-md">
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

            <form onSubmit={handleSubmit}>
                <input type="hidden" name="id" value={booking.id} />
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="propertyId">Propiedad</Label>
                        <Select name="propertyId" defaultValue={String(booking.propertyId)} required>
                            <SelectTrigger>
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
                    <div className="space-y-2">
                        <Label htmlFor="tenantId">Inquilino</Label>
                        <Select name="tenantId" defaultValue={String(booking.tenantId)} required>
                            <SelectTrigger>
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
                                numberOfMonths={1}
                                locale={es}
                                disabled={disabledDays}
                            />
                            </PopoverContent>
                        </Popover>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="originId">Origen</Label>
                        <Select name="originId" defaultValue={booking.originId || 'none'}>
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
                    <div className="space-y-2">
                        <Label htmlFor="amount">Monto</Label>
                        <Input id="amount" name="amount" type="number" step="0.01" defaultValue={booking.amount} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="currency">Moneda</Label>
                        <Select name="currency" defaultValue={booking.currency} required>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ARS">ARS</SelectItem>
                                <SelectItem value="USD">USD</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contractStatus">Contrato</Label>
                        <Select name="contractStatus" defaultValue={booking.contractStatus || 'not_sent'} required>
                            <SelectTrigger>
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
                     <div className="space-y-2">
                        <Label htmlFor="notes">Notas</Label>
                        <Textarea id="notes" name="notes" defaultValue={booking.notes} />
                    </div>
                    
                    {/* Guarantee Fields */}
                     <div className="border-t pt-4 mt-4 space-y-4">
                        <h4 className="text-md font-semibold">Garantía</h4>
                         <div className="space-y-2">
                             <Label htmlFor="guaranteeStatus">
                                 Estado
                             </Label>
                             <Select name="guaranteeStatus" value={guaranteeStatus} onValueChange={(val) => setGuaranteeStatus(val as GuaranteeStatus)}>
                                 <SelectTrigger>
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
                         <div className='flex gap-2'>
                            <div className="space-y-2 flex-grow">
                                <Label htmlFor="guaranteeAmount">Monto</Label>
                                <Input id="guaranteeAmount" name="guaranteeAmount" type="number" step="0.01" value={guaranteeAmount || ''} onChange={(e) => setGuaranteeAmount(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="guaranteeCurrency">Moneda</Label>
                                <Select name="guaranteeCurrency" defaultValue={booking.guaranteeCurrency || 'USD'}>
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
                             <Label>Fecha Recibida</Label>
                            <DatePicker date={guaranteeReceivedDate} onDateSelect={setGuaranteeReceivedDate} placeholder='Fecha de recepción' />
                         </div>
                         <div className="space-y-2">
                             <Label>Fecha Devuelta</Label>
                            <DatePicker date={guaranteeReturnedDate} onDateSelect={setGuaranteeReturnedDate} placeholder='Fecha de devolución' />
                         </div>
                     </div>


                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                    </DialogClose>
                    <SubmitButton isDisabled={!date?.from || !date?.to} isPending={isPending} />
                </DialogFooter>
            </form>
        </DialogContent>
        </Dialog>
    </>
  );
}
