'use client';

import { useEffect, useRef, useState, useTransition, useCallback, useMemo } from 'react';
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
import { addBooking } from '@/lib/actions';
import { Tenant, Booking, Origin, PriceConfig, getPropertyById, Property, DateBlock, CurrencySettings } from '@/lib/data';
import { PlusCircle, AlertTriangle, Calendar as CalendarIcon, Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { format, isSameDay } from "date-fns"
import { es } from 'date-fns/locale';
import { cn, checkDateConflict, parseDateSafely } from "@/lib/utils"
import { calculatePriceForStay } from "@/lib/utils";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DateRange } from 'react-day-picker';
import { Textarea } from './ui/textarea';
import { useAuth } from './auth-provider';
import { currencies } from '@/lib/currencies';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTranslation } from "@/i18n/useTranslation";


const initialState = {
  message: '',
  success: false,
};

function SubmitButton({ isDisabled }: { isDisabled: boolean }) {
    const { t } = useTranslation();
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={isDisabled || pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}
                </>
            ) : (
                t('bookings.add_dialog.submit')
            )}
        </Button>
    )
}

export function BookingAddForm({
  propertyId,
  properties,
  tenants,
  allBookings,
  allBlocks,
  onDataChanged,
  children,
  isOpen: propIsOpen,
  onOpenChange: propOnOpenChange,
}: {
  propertyId?: string;
  properties?: Property[];
  tenants: Tenant[];
  allBookings: Booking[];
  allBlocks: DateBlock[];
  onDataChanged: () => void;
  children?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { appUser, orgId } = useAuth();
  const { t } = useTranslation();
  const isPersonalFlavor = appUser?.appFlavor !== 'commercial';

  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [origins, setOrigins] = useState<Origin[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [conflict, setConflict] = useState<Booking | DateBlock | null>(null);
  const [amount, setAmount] = useState<number | string>('');

  const [selectedPropertyId, setSelectedPropertyId] = useState(propertyId || '');
  const [tenantComboboxOpen, setTenantComboboxOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');

  const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;
  const setIsOpen = propOnOpenChange !== undefined ? propOnOpenChange : setInternalIsOpen;

  const isPropertySelectionMode = !propertyId;

  const sortedTenants = useMemo(() => {
    return [...tenants].sort((a, b) => a.name.localeCompare(b.name));
  }, [tenants]);

  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await addBooking(initialState, formData);
        setState(result);
    });
  };

  const resetForm = useCallback(() => {
    formRef.current?.reset();
    setDate(undefined);
    setConflict(null);
    setSelectedTenantId('');
    setSelectedPropertyId(propertyId || '');
    setAmount('');
  }, [propertyId]);

  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
      resetForm();
      onDataChanged();
    }
  }, [state.success, onDataChanged, resetForm, setIsOpen]);

  const bookingsForSelectedProperty = useMemo(() => {
    if (!selectedPropertyId) return [];
    return allBookings.filter(b => b.propertyId === selectedPropertyId && (!b.status || b.status === 'active'));
  }, [selectedPropertyId, allBookings]);

  const blocksForSelectedProperty = useMemo(() => {
    if (!selectedPropertyId) return [];
    return allBlocks.filter(b => b.propertyId === selectedPropertyId);
  }, [selectedPropertyId, allBlocks]);

  useEffect(() => {
    const calculateAndSetPrice = async () => {
        if (date?.from && date?.to && selectedPropertyId) {
            const bookingConflict = checkDateConflict(date, bookingsForSelectedProperty, '');
            if (bookingConflict) {
              setConflict(bookingConflict);
            } else {
              const blockConflict = blocksForSelectedProperty.find(block => {
                const blockStart = parseDateSafely(block.startDate);
                const blockEnd = parseDateSafely(block.endDate);
                if (!blockStart || !blockEnd) return false;
                return date.from! < blockEnd && date.to! > blockStart;
              });
              setConflict(blockConflict || null);
            }

            try {
                const [property, priceConfigsResponse] = await Promise.all([
                    getPropertyById(selectedPropertyId),
                    fetch('/api/get-price-configurations')
                ]);

                if (!property || !priceConfigsResponse.ok) {
                    setAmount('');
                    return;
                }

                const priceConfigs: Record<string, PriceConfig> = await priceConfigsResponse.json();
                const lookupName = property.priceSheetName || property.name;
                const propertyRules = priceConfigs[lookupName];

                const priceResult = calculatePriceForStay(propertyRules, date.from, date.to);

                if (priceResult && !priceResult.error && !priceResult.minNightsError) {
                    setAmount(Math.round(priceResult.totalPrice).toString());
                } else {
                    setAmount('');
                }

            } catch (error) {
                console.error("Error al calcular el precio:", error);
                setAmount('');
            }
        } else {
            setConflict(null);
            setAmount('');
        }
    };
    
    if (isPersonalFlavor) {
        calculateAndSetPrice();
    }
  }, [date, bookingsForSelectedProperty, blocksForSelectedProperty, selectedPropertyId, isPersonalFlavor]);
  
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
      resetForm();
      fetchOrigins();
      if (appUser.appFlavor !== 'commercial') {
        setSelectedCurrency('USD');
      } else {
        getDoc(doc(db, 'settings', `currencies_${orgId}`)).then(snap => {
            if (snap.exists()) {
                const settings = snap.data() as CurrencySettings;
                setCurrencySettings(settings);
                setSelectedCurrency(settings.baseCurrency || 'ARS');
            } else {
                setSelectedCurrency('ARS');
            }
        });
      }
    }
  }, [isOpen, appUser, orgId, fetchOrigins, resetForm]);

  const disabledDays = useMemo(() => {
    const bookedDays = bookingsForSelectedProperty.flatMap(booking => {
        const from = parseDateSafely(booking.startDate);
        const to = parseDateSafely(booking.endDate);
        if (!from || !to) return [];
        return [{ from, to }];
    });
    const blockedDays = blocksForSelectedProperty.flatMap(block => {
        const from = parseDateSafely(block.startDate);
        const to = parseDateSafely(block.endDate);
        if (!from || !to) return [];
        return [{ from, to }];
    });
    return [...bookedDays, ...blockedDays];
  }, [bookingsForSelectedProperty, blocksForSelectedProperty]);
  
  const { message: conflictMessage, isOverlap: isDateOverlap } = useMemo(() => {
    if (!conflict || !date?.from || !date?.to) return { message: "", isOverlap: false };
    const conflictStart = parseDateSafely(conflict.startDate);
    const conflictEnd = parseDateSafely(conflict.endDate);
    const selectedStart = new Date(date.from);
    const selectedEnd = new Date(date.to);
    if (!conflictStart || !conflictEnd) return { message: "", isOverlap: false };
    if ('reason' in conflict) { return { message: "¡Conflicto de Fechas! El rango seleccionado se solapa con un bloqueo manual.", isOverlap: true }; }
    if (isSameDay(selectedEnd, conflictStart)) { return { message: "Atención: El check-out coincide con el check-in de otra reserva.", isOverlap: false }; }
    if (isSameDay(selectedStart, conflictEnd)) { return { message: "Atención: El check-in coincide con el check-out de otra reserva.", isOverlap: false }; }
    return { message: "¡Conflicto de Fechas! El rango seleccionado se solapa con una reserva existente.", isOverlap: true };
  }, [conflict, date]);

  const selectedPropertyName = properties?.find(p => p.id === selectedPropertyId)?.name || 'N/A';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { resetForm() }; setIsOpen(open)}}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent 
        className="sm:max-w-md p-0 overflow-hidden rounded-3xl flex flex-col max-h-[90vh]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-6 bg-background border-b shrink-0">
          <DialogTitle>{t('bookings.add_dialog.title')}</DialogTitle>
          <DialogDescription>{t('bookings.add_dialog.description')}</DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef} className="flex-1 flex flex-col overflow-hidden bg-muted/30">
            <input type="hidden" name="propertyId" value={selectedPropertyId} />
            <input type="hidden" name="orgId" value={orgId || ''} />
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 shadow-inner">
                {conflictMessage && (
                    <Alert variant={isDateOverlap ? "destructive" : "default"} className="bg-background">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>{isDateOverlap ? "Conflicto de Fechas" : "Aviso de Fechas"}</AlertTitle>
                        <AlertDescription>{conflictMessage}</AlertDescription>
                    </Alert>
                )}
                
                <div className="space-y-2">
                    <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('bookings.filters.property')}</Label>
                    {isPropertySelectionMode ? (
                        <Select name="propertyId-select" value={selectedPropertyId} onValueChange={(value) => { setSelectedPropertyId(value); setDate(undefined); }} required>
                            <SelectTrigger className="bg-background h-11 shadow-sm"><SelectValue placeholder={t('common.select_property')} /></SelectTrigger>
                            <SelectContent>
                                {properties && properties.length > 0 ? (
                                    properties.map(prop => (
                                        <SelectItem key={prop.id} value={prop.id}>{prop.name}</SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="none" disabled>{t('common.loading')}</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    ) : (
                        <div className="p-3 border-2 border-primary/20 rounded-xl bg-primary/5 font-black text-primary shadow-sm">
                            {selectedPropertyName}
                        </div>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="tenantId" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('bookings.table.tenant')}</Label>
                    <input type="hidden" name="tenantId" value={selectedTenantId} required />
                    <Popover open={tenantComboboxOpen} onOpenChange={setTenantComboboxOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={tenantComboboxOpen} className="w-full justify-between h-11 bg-background shadow-sm" disabled={!selectedPropertyId && isPropertySelectionMode}>
                                {selectedTenantId ? tenants.find((tenant) => tenant.id === selectedTenantId)?.name : t('common.select_tenant')}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                            <CommandInput placeholder={t('tenants.filters.placeholder_search')} />
                            <CommandList>
                                <CommandEmpty>{t('tenants.no_tenants')}</CommandEmpty>
                                <CommandGroup>
                                {sortedTenants.map((tenant) => (
                                    <CommandItem key={tenant.id} value={tenant.name} onSelect={(currentValue) => {
                                        const tenantId = tenants.find(t => t.name.toLowerCase() === currentValue.toLowerCase())?.id || '';
                                        setSelectedTenantId(tenantId === selectedTenantId ? "" : tenantId);
                                        setTenantComboboxOpen(false);
                                    }}>
                                    <Check className={cn("mr-2 h-4 w-4", selectedTenantId === tenant.id ? "opacity-100" : "opacity-0")} />
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
                    <Label htmlFor="dates" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('bookings.table.stay')}</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button id="date" variant={"outline"} className={cn("w-full justify-start text-left font-normal h-11 bg-background shadow-sm", !date && "text-muted-foreground")} disabled={!selectedPropertyId && isPropertySelectionMode}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (date.to ? (<>{format(date.from, "dd 'de' LLL, y", { locale: es })} - {format(date.to, "dd 'de' LLL, y", { locale: es })}</>) : format(date.from, "dd 'de' LLL, y", { locale: es })) : (<span>{t('common.select_dates')}</span>)}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={1} locale={es} disabled={disabledDays} />
                        </PopoverContent>
                    </Popover>
                    <input type="hidden" name="startDate" value={date?.from?.toISOString() || ''} />
                    <input type="hidden" name="endDate" value={date?.to?.toISOString() || ''} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="originId" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('bookings.filters.origin')}</Label>
                    <Select name="originId">
                        <SelectTrigger className="bg-background h-11 shadow-sm"><SelectValue placeholder={t('common.select_origin')} /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">{t('common.none')}</SelectItem>
                            {origins.map(origin => (
                                <SelectItem key={origin.id} value={origin.id}>{origin.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-4">
                    <div className="space-y-2 flex-1">
                        <Label htmlFor="amount" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('bookings.table.amount')}</Label>
                        <Input id="amount" name="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className="h-11 bg-background shadow-sm font-bold" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="currency" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('common.currency')}</Label>
                        <Select name="currency" value={selectedCurrency} onValueChange={setSelectedCurrency} required>
                            <SelectTrigger className="bg-background h-11 shadow-sm"><SelectValue /></SelectTrigger>
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
                                            return (<SelectItem key={code} value={code}>{currencyInfo ? currencyInfo.name : code}</SelectItem>)
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
                    <Label htmlFor="notes" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('tenants.card.notes')}</Label>
                    <Textarea id="notes" name="notes" className="bg-background shadow-inner min-h-[100px]" />
                </div>
            </div>
            
            <DialogFooter className="p-6 bg-background border-t shrink-0 flex flex-row items-center justify-end gap-2">
                <DialogClose asChild><Button type="button" variant="outline" onClick={resetForm}>{t('common.cancel')}</Button></DialogClose>
                <SubmitButton isDisabled={!date?.from || !date?.to || isDateOverlap || !selectedPropertyId || !selectedTenantId} />
            </DialogFooter>
        </form>
         {state.message && !state.success && <p className="text-red-500 text-sm mt-2 px-6 pb-6">{state.message}</p>}
      </DialogContent>
    </Dialog>
  );
}
