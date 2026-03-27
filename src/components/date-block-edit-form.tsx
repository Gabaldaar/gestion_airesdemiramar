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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { updateDateBlock } from '@/lib/actions';
import { Booking, DateBlock } from '@/lib/data';
import { Pencil, Calendar as CalendarIcon, Loader2, AlertTriangle } from 'lucide-react';
import { format } from "date-fns"
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
            {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : 'Guardar Cambios'}
        </Button>
    )
}

export function DateBlockEditForm({
  block,
  allBookings,
  allBlocks,
  isOpen,
  onOpenChange,
  onDataChanged,
}: {
  block: DateBlock;
  allBookings: Booking[];
  allBlocks: DateBlock[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onDataChanged: () => void;
}) {
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const [date, setDate] = useState<DateRange | undefined>({
      from: parseDateSafely(block.startDate),
      to: parseDateSafely(block.endDate),
  });
  const [reason, setReason] = useState(block.reason || '');
  const [conflict, setConflict] = useState<Booking | DateBlock | null>(null);

  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await updateDateBlock(initialState, formData);
        setState(result);
    });
  };

  const resetForm = () => {
    setDate({ from: parseDateSafely(block.startDate), to: parseDateSafely(block.endDate) });
    setReason(block.reason || '');
    setConflict(null);
  };

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
      onDataChanged();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, onOpenChange]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, block]);

  const bookingsForThisProperty = useMemo(() => {
    return allBookings.filter(b => b.propertyId === block.propertyId && (!b.status || b.status === 'active'));
  }, [allBookings, block.propertyId]);

  const otherBlocksForThisProperty = useMemo(() => {
    return allBlocks.filter(b => b.propertyId === block.propertyId && b.id !== block.id);
  }, [allBlocks, block.propertyId, block.id]);

  useEffect(() => {
    if (date?.from && date?.to) {
        const bookingConflict = checkDateConflict(date, bookingsForThisProperty, '');
        if (bookingConflict) {
            setConflict(bookingConflict);
            return;
        }
        
        const blockConflict = otherBlocksForThisProperty.find(b => {
            const blockStart = parseDateSafely(b.startDate);
            const blockEnd = parseDateSafely(b.endDate);
            if (!blockStart || !blockEnd) return false;
            return date.from! < blockEnd && date.to! > blockStart;
        });

        setConflict(blockConflict || null);

    } else {
        setConflict(null);
    }
  }, [date, bookingsForThisProperty, otherBlocksForThisProperty]);

  const disabledDays = useMemo(() => {
    const bookedDays = bookingsForThisProperty.flatMap(booking => ({ from: parseDateSafely(booking.startDate), to: parseDateSafely(booking.endDate) }));
    const blockedDays = otherBlocksForThisProperty.flatMap(b => ({ from: parseDateSafely(b.startDate), to: parseDateSafely(b.endDate) }));
    return [...bookedDays, ...blockedDays];
  }, [bookingsForThisProperty, otherBlocksForThisProperty]);
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Bloqueo de Fechas</DialogTitle>
          <DialogDescription>
            Modifica el rango de fechas o el motivo del bloqueo.
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
            <input type="hidden" name="id" value={block.id} />
            <input type="hidden" name="propertyId" value={block.propertyId} />
            <input type="hidden" name="startDate" value={date?.from?.toISOString() || ''} />
            <input type="hidden" name="endDate" value={date?.to?.toISOString() || ''} />
            
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="dates">Fechas</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (date.to ? (<>{format(date.from, "dd LLL, y", { locale: es })} - {format(date.to, "dd LLL, y", { locale: es })}</>) : format(date.from, "dd LLL, y", { locale: es })) : (<span>Selecciona las fechas</span>)}
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
                    <Label htmlFor="reason">Motivo (Opcional)</Label>
                    <Textarea id="reason" name="reason" placeholder="Ej: Mantenimiento, uso personal..." value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <SubmitButton isDisabled={!date?.from || !date?.to || !!conflict} />
            </DialogFooter>
        </form>
         {state.message && !state.success && (
            <p className="text-red-500 text-sm mt-2">{state.message}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
