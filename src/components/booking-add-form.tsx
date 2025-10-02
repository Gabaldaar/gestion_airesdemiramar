
'use client';

import { useEffect, useRef, useState, useMemo, useTransition } from 'react';
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
import { addBooking } from '@/lib/data';
import { Tenant, Booking, Origin, getOrigins, ContractStatus, GuaranteeStatus } from '@/lib/data';
import { PlusCircle, AlertTriangle, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format, subDays, isSameDay } from "date-fns"
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
import { useToast } from './ui/use-toast';


function SubmitButton({ isDisabled, isPending }: { isDisabled: boolean, isPending: boolean }) {
    return (
        <Button type="submit" disabled={isDisabled || isPending}>
            {isPending ? (
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
  const [isOpen, setIsOpen] = useState(false);
  const [origins, setOrigins] = useState<Origin[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [conflict, setConflict] = useState<Booking | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const resetForm = () => {
    formRef.current?.reset();
    setDate(undefined);
    setConflict(null);
  };

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
        const lastNight = subDays(new Date(booking.endDate), 1);
        if (startDate > lastNight) return [];
        return [{ from: startDate, to: lastNight }];
    });
  }, [existingBookings]);
  
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
    
    const bookingData = {
        propertyId: formData.get("propertyId") as string,
        tenantId: formData.get("tenantId") as string,
        startDate: formData.get("startDate") as string,
        endDate: formData.get("endDate") as string,
        amount: parseFloat(formData.get("amount") as string),
        currency: formData.get("currency") as 'USD' | 'ARS',
        notes: formData.get("notes") as string || "",
        originId: formData.get("originId") === 'none' ? undefined : formData.get("originId") as string,
        contractStatus: 'not_sent' as ContractStatus,
        guaranteeStatus: 'not_solicited' as GuaranteeStatus,
    };

    if (!bookingData.propertyId || !bookingData.tenantId || !bookingData.startDate || !bookingData.endDate || isNaN(bookingData.amount)) {
        toast({ variant: "destructive", title: "Error", description: "Todos los campos obligatorios deben ser completados." });
        return;
    }
    
    startTransition(async () => {
        try {
            await addBooking(bookingData);
            toast({ title: "Éxito", description: "Reserva creada correctamente." });
            setIsOpen(false);
            resetForm();
            window.location.reload(); // Simple way to refresh data
        } catch (error: any) {
            console.error("Error adding booking:", error);
            toast({ variant: "destructive", title: "Error", description: `No se pudo crear la reserva: ${error.message}` });
        }
    });
  };


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
        
        {conflict && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Alerta de Fechas</AlertTitle>
                <AlertDescription>
                    {getConflictMessage()}
                </AlertDescription>
            </Alert>
        )}

        <form onSubmit={handleSubmit} ref={formRef}>
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
                    <Select name="originId" defaultValue="none">
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
                <SubmitButton isDisabled={!date?.from || !date?.to} isPending={isPending} />
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
