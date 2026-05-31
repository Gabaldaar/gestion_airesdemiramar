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
import { format } from "date-fns"
import { es, enUS, ptBR } from 'date-fns/locale';
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
import { useTranslation } from "@/i18n/useTranslation";
import { useAuth } from './auth-provider';

const locales: Record<string, any> = { es, en: enUS, pt: ptBR };
const initialState = { message: '', success: false };

function SubmitButton({ isDisabled }: { isDisabled: boolean }) {
    const { t } = useTranslation();
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={isDisabled || pending} className="font-bold uppercase text-[10px] tracking-widest h-11 px-8">
            {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('common.loading')}</> : t('bookings.block_dates')}
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
  const { t, language } = useTranslation();
  const { orgId } = useAuth();
  const currentLocale = locales[language] || es;

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

  const selectedPropertyName = properties?.find(p => p.id === selectedPropertyId)?.name || 'N/A';
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
            {children || (
                <Button variant="secondary">
                    <CalendarX className="mr-2 h-4 w-4" />
                    {t('bookings.block_dates')}
                </Button>
            )}
        </DialogTrigger>
      <DialogContent 
        className="sm:max-w-md p-0 overflow-hidden rounded-3xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-6 bg-background border-b">
          <DialogTitle>{t('bookings.block_dates')}</DialogTitle>
          <DialogDescription>
            {t('dashboard.searcher.desc_only')}
          </DialogDescription>
        </DialogHeader>
        
        <form action={formAction} ref={formRef} className="bg-muted/30">
            <input type="hidden" name="orgId" value={orgId || ''} />
            <input type="hidden" name="propertyId" value={selectedPropertyId} />

            <div className="p-6 max-h-[60vh] overflow-y-auto shadow-inner border-y border-muted-foreground/10 space-y-4">
                {conflict && (
                    <Alert variant="destructive" className="bg-background">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Conflicto de Fechas</AlertTitle>
                        <AlertDescription>
                            El rango seleccionado se solapa con una reserva o bloqueo existente.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="space-y-2">
                    <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('bookings.filters.property')}</Label>
                    {isPropertySelectionMode && properties ? (
                        <Select name="propertyId-select" value={selectedPropertyId} onValueChange={(value) => { setSelectedPropertyId(value); setDate(undefined); }} required>
                            <SelectTrigger className="bg-background h-11 shadow-sm"><SelectValue placeholder={t('common.select_property')} /></SelectTrigger>
                            <SelectContent>
                                {properties.map(prop => (
                                    <SelectItem key={prop.id} value={prop.id}>{prop.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <div className="p-3 border-2 border-primary/20 rounded-xl bg-primary/5 font-black text-primary shadow-sm">
                            {selectedPropertyName}
                        </div>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="dates" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('common.dates')}</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal h-11 bg-background shadow-sm", !date && "text-muted-foreground")}
                            disabled={!selectedPropertyId && isPropertySelectionMode}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (date.to ? (<>{format(date.from, "dd 'de' LLL, y", { locale: currentLocale })} - {format(date.to, "dd 'de' LLL, y", { locale: currentLocale })}</>) : format(date.from, "dd 'de' LLL, y", { locale: currentLocale })) : (<span>{t('common.select_dates')}</span>)}
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
                            locale={currentLocale}
                            disabled={disabledDays}
                        />
                        </PopoverContent>
                    </Popover>
                    <input type="hidden" name="startDate" value={date?.from?.toISOString() || ''} />
                    <input type="hidden" name="endDate" value={date?.to?.toISOString() || ''} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="reason" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('common.reason')} ({t('common.optional')})</Label>
                    <Textarea id="reason" name="reason" placeholder="Ej: Mantenimiento, uso personal..." disabled={!selectedPropertyId && isPropertySelectionMode} className="bg-background shadow-inner min-h-[100px]" />
                </div>
            </div>
            <DialogFooter className="p-6 bg-background border-t">
                <DialogClose asChild><Button type="button" variant="outline" onClick={resetForm} className="font-bold uppercase text-[10px] tracking-widest h-11">{t('common.cancel')}</Button></DialogClose>
                <SubmitButton isDisabled={!date?.from || !date?.to || !!conflict || !selectedPropertyId} />
            </DialogFooter>
        </form>
         {state.message && !state.success && <p className="text-red-500 text-sm mt-2 px-6 pb-6">{state.message}</p>}
      </DialogContent>
    </Dialog>
  );
}
