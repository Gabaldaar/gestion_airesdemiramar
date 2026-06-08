
'use client';

import { useEffect, useRef, useState, useMemo, ReactNode, useTransition, useCallback } from 'react';
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
import { Booking, Tenant, Property, GuaranteeStatus, Origin, CurrencySettings, DateBlock } from '@/lib/data';
import { Calendar as CalendarIcon, AlertTriangle, Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { format, isSameDay } from "date-fns"
import { es } from 'date-fns/locale';
import { cn, checkDateConflict, parseDateSafely } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { DateRange } from 'react-day-picker';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { DatePicker } from './ui/date-picker';
import { useAuth } from './auth-provider';
import { currencies } from '@/lib/currencies';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTranslation } from '@/i18n/useTranslation';


const initialState: { message: string, success: boolean, updatedBooking?: Booking; } = {
  message: '',
  success: false,
};

function SubmitButton({ isDisabled }: { isDisabled: boolean }) {
    const { t } = useTranslation();
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={isDisabled || pending} className="px-8 font-bold uppercase text-[10px] tracking-widest h-11 shadow-lg">
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}
                </>
            ) : (
                t('common.save')
            )}
        </Button>
    )
}

interface BookingEditFormProps {
    booking: Booking;
    tenants: Tenant[];
    properties: Property[];
    allBookings?: Booking[];
    allBlocks?: DateBlock[];
    children?: ReactNode;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onBookingUpdated: () => void;
}

export function BookingEditForm({ booking, tenants, properties, allBookings, allBlocks, children, isOpen, onOpenChange, onBookingUpdated }: BookingEditFormProps) {
  const { t } = useTranslation();
  const { appUser, orgId } = useAuth();
  const isPersonalFlavor = appUser?.appFlavor !== 'commercial';

  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [date, setDate] = useState<DateRange | undefined>({
      from: parseDateSafely(booking.startDate),
      to: parseDateSafely(booking.endDate)
  });
  const [conflict, setConflict] = useState<Booking | DateBlock | null>(null);

  const [currencySettings, setCurrencySettings] = useState<CurrencySettings | null>(null);

  // Combobox state
  const [tenantComboboxOpen, setTenantComboboxOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState(booking.tenantId);

  const sortedTenants = useMemo(() => {
    return [...tenants].sort((a, b) => a.name.localeCompare(b.name));
  }, [tenants]);

  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await updateBooking(initialState, formData);
        setState(result);
    });
  };

  // Guarantee state
  const [guaranteeStatus, setGuaranteeStatus] = useState<GuaranteeStatus>(booking.guaranteeStatus || 'not_solicited');
  const [guaranteeAmount, setGuaranteeAmount] = useState<number | string>(booking.guaranteeAmount || '');
  const [guaranteeReceivedDate, setGuaranteeReceivedDate] = useState<Date | undefined>(
    parseDateSafely(booking.guaranteeReceivedDate)
  );
  const [guaranteeReturnedDate, setGuaranteeReturnedDate] = useState<Date | undefined>(
    parseDateSafely(booking.guaranteeReturnedDate)
  );

    useEffect(() => {
        if (booking && isOpen) {
            setSelectedTenantId(booking.tenantId);
            setDate({
                from: parseDateSafely(booking.startDate),
                to: parseDateSafely(booking.endDate)
            });
            setGuaranteeStatus(booking.guaranteeStatus || 'not_solicited');
            setGuaranteeAmount(booking.guaranteeAmount || '');
            setGuaranteeReceivedDate(parseDateSafely(booking.guaranteeReceivedDate));
            setGuaranteeReturnedDate(parseDateSafely(booking.guaranteeReturnedDate));
        }
    }, [booking, isOpen]);


  const resetForm = () => {
    setDate({ from: parseDateSafely(booking.startDate), to: parseDateSafely(booking.endDate) });
    setConflict(null);
    setGuaranteeStatus(booking.guaranteeStatus || 'not_solicited');
    setGuaranteeAmount(booking.guaranteeAmount || '');
    setGuaranteeReceivedDate(parseDateSafely(booking.guaranteeReceivedDate));
    setGuaranteeReturnedDate(parseDateSafely(booking.guaranteeReturnedDate));
  };

  useEffect(() => {
    if (state.success) {
      onBookingUpdated();
      onOpenChange(false);
    }
  }, [state.success, onOpenChange, onBookingUpdated]);

  const fetchOrigins = useCallback(async () => {
    if (!orgId) return;
    try {
        const q = query(collection(db, 'origins'), where('orgId', '==', orgId));
        let snap = await getDocs(q);
        setOrigins(snap.docs.map(d => ({ id: d.id, ...d.data() } as Origin)).sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })));
    } catch (e) {
        console.error("Error fetching origins:", e);
    }
  }, [orgId]);

  useEffect(() => {
    if (isOpen && appUser && orgId) {
      fetchOrigins();
      if (appUser.appFlavor === 'commercial') {
        getDoc(doc(db, 'settings', `currencies_${orgId}`)).then(snap => {
            if (snap.exists()) setCurrencySettings(snap.data() as CurrencySettings);
        });
      }
    }
  }, [isOpen, appUser, orgId, fetchOrigins]);

   useEffect(() => {
    if (date?.from && date?.to && allBookings) {
        const bookingsForProperty = allBookings.filter(b => b.propertyId === booking.propertyId);
        const bookingConflict = checkDateConflict(date, bookingsForProperty, booking.id);
        if (bookingConflict) {
            setConflict(bookingConflict);
            return;
        }

        if (allBlocks) {
             const blocksForProperty = allBlocks.filter(b => b.propertyId === booking.propertyId);
             const blockConflict = blocksForProperty.find(block => {
                const blockStart = parseDateSafely(block.startDate);
                const blockEnd = parseDateSafely(block.endDate);
                if (!blockStart || !blockEnd) return false;
                return date.from! < blockEnd && date.to! > blockStart;
             });
             setConflict(blockConflict || null);
        }

    } else {
        setConflict(null);
    }
  }, [date, allBookings, allBlocks, booking.id, booking.propertyId]);

  const disabledDays = useMemo(() => {
    if (!allBookings || !allBlocks) return [];
    
    const otherBookings = allBookings.filter(b => b.id !== booking.id && b.propertyId === booking.propertyId && (!b.status || b.status === 'active'));
    
    const bookedRanges = otherBookings.flatMap(otherBooking => {
        const from = parseDateSafely(otherBooking.startDate);
        const to = parseDateSafely(otherBooking.endDate);
        if (!from || !to) return [];
        return [{ from, to }];
    });
    
    const blocksForProperty = allBlocks.filter(b => b.propertyId === booking.propertyId);
    const blockedRanges = blocksForProperty.flatMap(block => {
        const from = parseDateSafely(block.startDate);
        const to = parseDateSafely(block.endDate);
        if (!from || !to) return [];
        return [{ from, to }];
    });

    return [...bookedRanges, ...blockedRanges];

  }, [allBookings, allBlocks, booking.id, booking.propertyId]);
  
  const { message: conflictMessage, isOverlap: isDateOverlap } = useMemo(() => {
    if (!conflict || !date?.from || !date?.to) return { message: "", isOverlap: false };
    
    const conflictStart = parseDateSafely(conflict.startDate);
    const conflictEnd = parseDateSafely(conflict.endDate);
    const selectedStart = date.from;
    const selectedEnd = date.to;
    
    if (!conflictStart || !conflictEnd) return { message: "", isOverlap: false };

    if ('reason' in conflict) {
        return { message: "¡Conflicto de Fechas! El rango seleccionado se solapa con un bloqueo manual.", isOverlap: true };
    }

    if (isSameDay(selectedEnd, conflictStart)) {
        return { message: "Atención: El check-out coincide con el check-in de otra reserva.", isOverlap: false };
    }
    if (isSameDay(selectedStart, conflictEnd)) {
        return { message: "Atención: El check-in coincide con el check-out de otra reserva.", isOverlap: false };
    }

    return { message: "¡Conflicto de Fechas! El rango seleccionado se solapa con una reserva existente.", isOverlap: true };
  }, [conflict, date]);


  return (
    <>
      {children}
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { resetForm() }; onOpenChange(open)}}>
        <DialogContent 
            className="sm:max-w-xl p-0 overflow-hidden rounded-[2rem] flex flex-col max-h-[90vh]"
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
        >
            <DialogHeader className="p-6 bg-background border-b shrink-0">
                <DialogTitle className="text-xl font-black uppercase italic tracking-tighter text-primary">{t('bookings.edit_dialog.title')}</DialogTitle>
                <DialogDescription>
                    {t('bookings.edit_dialog.description')}
                </DialogDescription>
            </DialogHeader>

            <form action={formAction} className="flex-1 flex flex-col overflow-hidden bg-muted/30">
                <input type="hidden" name="id" value={booking.id} />
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6 shadow-inner border-y border-muted-foreground/10">
                    {conflictMessage && (
                        <Alert variant={isDateOverlap ? "destructive" : "default"} className="bg-background">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>{isDateOverlap ? "Conflicto de Fechas" : "Aviso de Fechas"}</AlertTitle>
                            <AlertDescription>
                                {conflictMessage}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="propertyId" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('bookings.filters.property')}</Label>
                        <Select name="propertyId" defaultValue={String(booking.propertyId)} required>
                            <SelectTrigger className="bg-background h-11 shadow-sm">
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
                        <Label htmlFor="tenantId" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('bookings.table.tenant')}</Label>
                        <input type="hidden" name="tenantId" value={selectedTenantId} required />
                        <Popover open={tenantComboboxOpen} onOpenChange={setTenantComboboxOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={tenantComboboxOpen}
                                className="w-full justify-between h-11 bg-background shadow-sm font-bold"
                                >
                                {selectedTenantId
                                    ? tenants.find((tenant) => tenant.id === selectedTenantId)?.name
                                    : "Selecciona un inquilino..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                <CommandInput placeholder="Buscar inquilino..." />
                                 <CommandList>
                                    <CommandEmpty>No se encontró ningún inquilino.</CommandEmpty>
                                    <CommandGroup>
                                    {sortedTenants.map((tenant) => (
                                        <CommandItem
                                        key={tenant.id}
                                        value={tenant.name}
                                        onSelect={(currentValue) => {
                                            const tenantId = tenants.find(t => t.name.toLowerCase() === currentValue.toLowerCase())?.id || '';
                                            setSelectedTenantId(tenantId === selectedTenantId ? "" : tenantId);
                                            setTenantComboboxOpen(false);
                                        }}
                                        >
                                        <Check
                                            className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedTenantId === tenant.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {tenant.name}
                                        </CommandItem>
                                    ))}
                                    </CommandGroup>
                                </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dates" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('common.from')} / {t('common.to')}</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                "w-full justify-start text-left font-normal h-11 bg-background shadow-sm",
                                !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                date.to ? (
                                    <>
                                    {format(date.from, "dd 'de' LLLL, y", { locale: es })} -{" "}
                                    {format(date.to, "dd 'de' LLLL, y", { locale: es })}
                                    </>
                                ) : (
                                    format(date.from, "dd 'de' LLLL, y", { locale: es })
                                )
                                ) : (
                                <span>{t('common.select_dates')}</span>
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
                        <input type="hidden" name="startDate" value={date?.from?.toISOString() || ''} />
                        <input type="hidden" name="endDate" value={date?.to?.toISOString() || ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="originId" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('bookings.filters.origin')}</Label>
                        <Select name="originId" defaultValue={booking.originId || undefined}>
                            <SelectTrigger className="bg-background h-11 shadow-sm">
                                <SelectValue placeholder="Selecciona un origen" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">{t('common.none')}</SelectItem>
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
                            <Label htmlFor="amount" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('bookings.table.amount')}</Label>
                            <Input id="amount" name="amount" type="number" step="0.01" defaultValue={booking.amount} required className="h-11 bg-background shadow-sm font-black text-primary text-lg" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="currency" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('common.currency')}</Label>
                            <Select name="currency" defaultValue={booking.currency} required>
                                 <SelectTrigger className="bg-background h-11 shadow-sm w-24">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {isPersonalFlavor ? (
                                        <>
                                            <SelectItem value="ARS">ARS</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                        </>
                                    ) : (
                                        (currencySettings?.favoriteCurrencies?.length ?? 0) > 0 ? (
                                            currencySettings!.favoriteCurrencies.map(code => {
                                                const currencyInfo = currencies.find(c => c.code === code);
                                                return (
                                                    <SelectItem key={code} value={code}>
                                                        {currencyInfo ? currencyInfo.name : code}
                                                    </SelectItem>
                                                )
                                            })
                                        ) : (
                                            <>
                                                <SelectItem value="ARS">ARS</SelectItem>
                                                <SelectItem value="USD">USD</SelectItem>
                                            </>
                                        )
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contractStatus" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('bookings.filters.contract')}</Label>
                        <Select name="contractStatus" defaultValue={booking.contractStatus || 'not_sent'} required>
                            <SelectTrigger className="bg-background h-11 shadow-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="not_sent">{t('bookings.contract_status.not_sent')}</SelectItem>
                                <SelectItem value="sent">{t('bookings.contract_status.sent')}</SelectItem>
                                <SelectItem value="signed">{t('bookings.contract_status.signed')}</SelectItem>
                                <SelectItem value="not_required">{t('bookings.contract_status.not_required')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="status" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('bookings.filters.status')}</Label>
                        <Select name="status" defaultValue={booking.status || 'active'} required>
                            <SelectTrigger className="bg-background h-11 shadow-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">{t('bookings.status.active')}</SelectItem>
                                <SelectItem value="pending">{t('bookings.status.pending')}</SelectItem>
                                <SelectItem value="cancelled">{t('bookings.status.cancelled')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="notes" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('tenants.card.notes')}</Label>
                        <Textarea id="notes" name="notes" defaultValue={booking.notes} className="bg-background shadow-inner min-h-[100px]" />
                    </div>
                    
                     <div className="border-t pt-4 mt-6 space-y-4">
                        <h4 className="text-sm font-black uppercase text-primary tracking-widest border-l-4 border-primary pl-2">{t('bookings.filters.guarantee')}</h4>
                         <div className="space-y-2">
                             <Label htmlFor="guaranteeStatus" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
                                 {t('common.status')}
                             </Label>
                             <Select name="guaranteeStatus" value={guaranteeStatus} onValueChange={(val) => setGuaranteeStatus(val as GuaranteeStatus)}>
                                 <SelectTrigger className="bg-background h-11 shadow-sm">
                                     <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                     <SelectItem value="not_solicited">{t('bookings.guarantee_status.not_solicited')}</SelectItem>
                                     <SelectItem value="solicited">{t('bookings.guarantee_status.solicited')}</SelectItem>
                                     <SelectItem value="received">{t('bookings.guarantee_status.received')}</SelectItem>
                                     <SelectItem value="returned">{t('bookings.guarantee_status.returned')}</SelectItem>
                                     <SelectItem value="not_applicable">{t('bookings.guarantee_status.not_applicable')}</SelectItem>
                                 </SelectContent>
                             </Select>
                         </div>
                         <div className='flex gap-4'>
                            <div className="space-y-2 flex-grow">
                                <Label htmlFor="guaranteeAmount" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('common.amount')}</Label>
                                <Input id="guaranteeAmount" name="guaranteeAmount" type="number" step="0.01" value={guaranteeAmount} onChange={(e) => setGuaranteeAmount(e.target.value)} className="h-11 bg-background shadow-sm" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="guaranteeCurrency" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('common.currency')}</Label>
                                <Select name="guaranteeCurrency" defaultValue={booking.guaranteeCurrency || 'USD'}>
                                    <SelectTrigger className="bg-background h-11 shadow-sm w-24">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {isPersonalFlavor ? (
                                            <>
                                                <SelectItem value="ARS">ARS</SelectItem>
                                                <SelectItem value="USD">USD</SelectItem>
                                            </>
                                        ) : (
                                            (currencySettings?.favoriteCurrencies?.length ?? 0) > 0 ? (
                                                currencySettings!.favoriteCurrencies.map(code => {
                                                    const currencyInfo = currencies.find(c => c.code === code);
                                                    return (
                                                        <SelectItem key={code} value={code}>
                                                            {currencyInfo ? currencyInfo.name : code}
                                                        </SelectItem>
                                                    )
                                                })
                                            ) : (
                                                <>
                                                    <SelectItem value="ARS">ARS</SelectItem>
                                                    <SelectItem value="USD">USD</SelectItem>
                                                </>
                                            )
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('common.received_date')}</Label>
                                <DatePicker date={guaranteeReceivedDate} onDateSelect={setGuaranteeReceivedDate} placeholder={t('common.received_date')} />
                                <input type="hidden" name="guaranteeReceivedDate" value={guaranteeReceivedDate ? guaranteeReceivedDate.toISOString().split('T')[0] : ''} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('common.returned_date')}</Label>
                                <DatePicker date={guaranteeReturnedDate} onDateSelect={setGuaranteeReturnedDate} placeholder={t('common.returned_date')} />
                                <input type="hidden" name="guaranteeReturnedDate" value={guaranteeReturnedDate ? guaranteeReturnedDate.toISOString().split('T')[0] : ''} />
                            </div>
                         </div>
                     </div>
                </div>

                <DialogFooter className="p-6 bg-background border-t shrink-0 flex flex-row items-center justify-end gap-3">
                    <DialogClose asChild>
                        <Button type="button" variant="outline" onClick={resetForm} className="font-bold uppercase text-[10px] tracking-widest h-11 bg-background">{t('common.cancel')}</Button>
                    </DialogClose>
                    <SubmitButton isDisabled={!date?.from || !date?.to || isDateOverlap} />
                </DialogFooter>
            </form>
            {state.message && !state.success && (
                <p className="text-red-500 text-sm mt-2 px-6 pb-6">{state.message}</p>
            )}
        </DialogContent>
        </Dialog>
    </>
  );
}
