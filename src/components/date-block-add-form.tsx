
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
import { addDateBlock } from '@/lib/actions';
import { Property, Booking, DateBlock } from '@/lib/data';
import { CalendarX, Calendar as CalendarIcon, Loader2, AlertTriangle } from 'lucide-react';
import { format, addDays } from "date-fns"
import { es } from 'date-fns/locale';
import { cn, checkDateConflict, parseDateSafely } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DateRange } from 'react-day-picker';
import { Textarea } from './ui/textarea';

const initialState = { message: '', success: false };

function SubmitButton({ isDisabled }: { isDisabled: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={isDisabled || pending}>
            {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Bloqueando...</> : 'Bloquear Fechas'}
        </Button>
    )
}

export function DateBlockAddForm({
  propertyId,
  properties,
  allBookings,
  allBlocks,
  children,
  isOpen,
  onOpenChange,
  onDataChanged,
}: {
  propertyId?: string;
  properties?: Property[];
  allBookings: Booking[];
  allBlocks: DateBlock[];
  children?: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onDataChanged: () => void;
}) {
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [conflict, setConflict] = useState<Booking | DateBlock | null>(null);

  const [selectedPropertyId, setSelectedPropertyId] = useState(propertyId || '');

  const isPropertySelectionMode = !propertyId;

  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await addDateBlock(initialState, formData);
        setState(result);
    });
  };

  const resetForm = () => {
    formRef.current?.reset();
    setDate(undefined);
    setConflict(null);
    setSelectedPropertyId(propertyId || '');
  };

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
      resetForm();
      onDataChanged();
    }
  }, [state, onOpenChange, onDataChanged]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const bookingsForSelectedProperty = useMemo(() => {
    if (!selectedPropertyId) return [];
    return allBookings.filter(b => b.propertyId === selectedPropertyId && (!b.status || b.status === 'active'));
  }, [selectedPropertyId, allBookings]);

  const blocksForSelectedProperty = useMemo(() => {
    if (!selectedPropertyId) return [];
    return allBlocks.filter(b => b.propertyId === selectedPropertyId);
  }, [selectedPropertyId, allBlocks]);

  useEffect(() => {
    if (date?.from && date?.to) {
        const bookingConflict = checkDateConflict(date, bookingsForSelectedProperty, '');
        if (bookingConflict) {
            setConflict(bookingConflict);
            return;
        }
        
        // Simplified conflict check for blocks
        const blockConflict = blocksForSelectedProperty.find(block => {
            const blockStart = parseDateSafely(block.startDate);
            const blockEnd = parseDateSafely(block.endDate);
            if (!blockStart || !blockEnd) return false;
            return date.from! < blockEnd && date.to! > blockStart;
        });

        setConflict(blockConflict || null);

    } else {
        setConflict(null);
    }
  }, [date, bookingsForSelectedProperty, blocksForSelectedProperty]);

  const disabledDays = useMemo(() => {
    const bookedDays = bookingsForSelectedProperty.flatMap(booking => ({ from: parseDateSafely(booking.startDate), to: parseDateSafely(booking.endDate) }));
    const blockedDays = blocksForSelectedProperty.flatMap(block => ({ from: parseDateSafely(block.startDate), to: parseDateSafely(block.endDate) }));
    return [...bookedDays, ...blockedDays];
  }, [bookingsForSelectedProperty, blocksForSelectedProperty]);
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        {children || (
             <DialogTrigger asChild>
                <Button variant="secondary">
                    <CalendarX className="mr-2 h-4 w-4" />
                    Bloquear Fechas
                </Button>
            </DialogTrigger>
        )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bloquear Fechas</DialogTitle>
          <DialogDescription>
            Selecciona un rango de fechas para marcar como no disponible.
          </DialogDescription>
        </DialogHeader>
        
        {conflict && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Conflicto de Fechas</AlertTitle>
                <AlertDescription>
                    El rango seleccionado se solapa con una reserva o bloqueo existente.
                </AlertDescription>
            </Alert>
        )}

        <form action={formAction} ref={formRef}>
            <div className="grid gap-4 py-4">
                 {isPropertySelectionMode && properties && (
                    <div className="space-y-2">
                        <Label htmlFor="propertyId-select">Propiedad</Label>
                        <Select name="propertyId-select" value={selectedPropertyId} onValueChange={(value) => { setSelectedPropertyId(value); setDate(undefined); }} required>
                            <SelectTrigger><SelectValue placeholder="Selecciona una propiedad..." /></SelectTrigger>
                            <SelectContent>
                                {properties.map(prop => (
                                    <SelectItem key={prop.id} value={prop.id}>{prop.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <div className="space-y-2">
                    <Label htmlFor="dates">Fechas</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                            disabled={!selectedPropertyId && isPropertySelectionMode}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (date.to ? (<>{format(date.from, "dd LLL, y")} - {format(date.to, "dd LLL, y")}</>) : format(date.from, "dd LLL, y")) : (<span>Selecciona las fechas</span>)}
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
                    <Label htmlFor="reason">Motivo (Opcional)</Label>
                    <Textarea id="reason" name="reason" placeholder="Ej: Mantenimiento, uso personal..." />
                </div>
                <input type="hidden" name="propertyId" value={selectedPropertyId} />
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button></DialogClose>
                <SubmitButton isDisabled={!date?.from || !date?.to || !!conflict || !selectedPropertyId} />
            </DialogFooter>
        </form>
         {state.message && !state.success && (
            <p className="text-red-500 text-sm mt-2">{state.message}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
