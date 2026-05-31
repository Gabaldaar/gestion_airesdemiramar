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
import { addContrato } from '@/lib/actions';
import { Tenant, Property, CurrencySettings } from '@/lib/data';
import { PlusCircle, Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils"
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
import { Textarea } from './ui/textarea';
import { useAuth } from './auth-provider';
import { currencies } from '@/lib/currencies';
import { DatePicker } from './ui/date-picker';
import { doc, getDoc } from 'firebase/firestore';
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
                t('contratos.new_contract')
            )}
        </Button>
    )
}

export function ContratoAddForm({
  propertyId,
  properties,
  tenants,
  onDataChanged,
  children,
}: {
  propertyId?: string;
  properties?: Property[];
  tenants: Tenant[];
  onDataChanged: () => void;
  children?: React.ReactNode;
}) {
  const { appUser, orgId } = useAuth();
  const { t } = useTranslation();

  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedPropertyId, setSelectedPropertyId] = useState(propertyId || '');
  const [tenantComboboxOpen, setTenantComboboxOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ARS');

  const isPropertySelectionMode = !propertyId;

  const sortedTenants = useMemo(() => {
    return [...tenants].sort((a, b) => a.name.localeCompare(b.name));
  }, [tenants]);

  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await addContrato(initialState, formData);
        setState(result);
    });
  };

  const resetForm = useCallback(() => {
    formRef.current?.reset();
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedTenantId('');
    setSelectedPropertyId(propertyId || '');
  }, [propertyId]);

  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
      resetForm();
      onDataChanged();
    }
  }, [state.success, onDataChanged, resetForm]);

  useEffect(() => {
    if (isOpen && appUser && orgId) {
      resetForm();
      const isCommercial = appUser.appFlavor === 'commercial';
      if (isCommercial) {
        getDoc(doc(db, 'settings', `currencies_${orgId}`)).then(snap => {
            if (snap.exists()) {
                const settings = snap.data() as CurrencySettings;
                setCurrencySettings(settings);
                setSelectedCurrency(settings.baseCurrency || 'ARS');
            } else {
                setSelectedCurrency('ARS');
            }
        });
      } else {
        setSelectedCurrency('ARS');
      }
    }
  }, [isOpen, appUser, orgId, resetForm]);

  const isFormValid = startDate && endDate && selectedTenantId && selectedPropertyId;
  const selectedPropertyName = properties?.find(p => p.id === selectedPropertyId)?.name || 'N/A';
  const isPersonalFlavor = appUser?.appFlavor !== 'commercial';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { resetForm() }; setIsOpen(open)}}>
      <DialogTrigger asChild>
        {children || (
            <Button onClick={() => { setIsOpen(true); }}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('contratos.new_contract')}
            </Button>
        )}
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-xl p-0 overflow-hidden rounded-3xl flex flex-col max-h-[90vh]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-6 bg-background border-b shrink-0">
          <DialogTitle>{t('contratos.add_dialog.title')}</DialogTitle>
          <DialogDescription>{t('contratos.add_dialog.description')}</DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef} className="flex-1 flex flex-col overflow-hidden bg-muted/30">
            <input type="hidden" name="propertyId" value={selectedPropertyId} />
            <input type="hidden" name="orgId" value={orgId || ''} />
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 shadow-inner">
                <div className="space-y-2">
                    <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('bookings.filters.property')}</Label>
                    {isPropertySelectionMode && properties ? (
                        <Select name="propertyId-select" value={selectedPropertyId} onValueChange={setSelectedPropertyId} required>
                            <SelectTrigger className="bg-background h-11 shadow-sm"><SelectValue placeholder={t('common.select_property')} /></SelectTrigger>
                            <SelectContent>
                                {properties.map(prop => (<SelectItem key={prop.id} value={prop.id}>{prop.name}</SelectItem>))}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="fechaInicio" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('common.from')}</Label>
                        <DatePicker date={startDate} onDateSelect={setStartDate} placeholder="Inicio" />
                        <input type="hidden" name="fechaInicio" value={startDate?.toISOString().split('T')[0] || ''} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="fechaFin" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('common.to')}</Label>
                        <DatePicker date={endDate} onDateSelect={setEndDate} placeholder="Fin" defaultMonth={startDate} />
                        <input type="hidden" name="fechaFin" value={endDate?.toISOString().split('T')[0] || ''} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="status" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('bookings.filters.status')}</Label>
                    <Select name="status" defaultValue="active" required disabled={!selectedPropertyId && isPropertySelectionMode}>
                        <SelectTrigger className="bg-background h-11 shadow-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="draft">{t('contratos.status.draft')}</SelectItem>
                            <SelectItem value="active">{t('contratos.status.active')}</SelectItem>
                            <SelectItem value="ended">{t('contratos.status.ended')}</SelectItem>
                            <SelectItem value="cancelled">{t('contratos.status.cancelled')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="montoInicial" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('contratos.initial_fee')}</Label>
                        <Input id="montoInicial" name="montoInicial" type="number" step="0.01" required disabled={!selectedPropertyId && isPropertySelectionMode} className="h-11 bg-background shadow-sm font-bold" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="moneda" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('common.currency')}</Label>
                        <Select name="moneda" value={selectedCurrency} onValueChange={setSelectedCurrency} required disabled={!selectedPropertyId && isPropertySelectionMode}>
                            <SelectTrigger className="bg-background h-11 shadow-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {isPersonalFlavor ? (
                                    <><SelectItem value="ARS">ARS</SelectItem><SelectItem value="USD">USD</SelectItem></>
                                ) : (
                                    (currencySettings?.favoriteCurrencies?.length ?? 0) > 0 ? (
                                        currencySettings!.favoriteCurrencies.map(code => {
                                            const currencyInfo = currencies.find(c => c.code === code);
                                            return (<SelectItem key={code} value={code}>{currencyInfo ? currencyInfo.name : code}</SelectItem>)
                                        })
                                    ) : (
                                        <><SelectItem value="ARS">ARS</SelectItem><SelectItem value="USD">USD</SelectItem></>
                                    )
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="frecuenciaAjuste" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('contratos.adjustment')}</Label>
                        <Select name="frecuenciaAjuste" defaultValue="6" required disabled={!selectedPropertyId && isPropertySelectionMode}>
                             <SelectTrigger className="bg-background h-11 shadow-sm"><SelectValue/></SelectTrigger>
                             <SelectContent>
                                <SelectItem value="3">Cada 3 meses</SelectItem>
                                <SelectItem value="4">Cada 4 meses</SelectItem>
                                <SelectItem value="6">Cada 6 meses</SelectItem>
                                <SelectItem value="12">Cada 12 meses</SelectItem>
                             </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="diaVencimiento" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Día de Vencimiento</Label>
                        <Input id="diaVencimiento" name="diaVencimiento" type="number" min="1" max="28" defaultValue="10" required disabled={!selectedPropertyId && isPropertySelectionMode} className="h-11 bg-background shadow-sm" />
                    </div>
                </div>
                 <div className="border-t pt-4 mt-6 space-y-4">
                     <h4 className="text-sm font-black uppercase text-primary tracking-widest border-l-4 border-primary pl-2">{t('bookings.filters.guarantee')}</h4>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="montoGarantia" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('expenses.add_dialog.amount')}</Label>
                            <Input id="montoGarantia" name="montoGarantia" type="number" step="0.01" disabled={!selectedPropertyId && isPropertySelectionMode} className="h-11 bg-background shadow-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="monedaGarantia" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('common.currency')}</Label>
                            <Select name="monedaGarantia" defaultValue="USD" disabled={!selectedPropertyId && isPropertySelectionMode}>
                                <SelectTrigger className="bg-background h-11 shadow-sm"><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="ARS">ARS</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent>
                            </Select>
                        </div>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="notes" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('tenants.card.notes')}</Label>
                    <Textarea id="notes" name="notes" placeholder="..." disabled={!selectedPropertyId && isPropertySelectionMode} className="bg-background shadow-inner min-h-[100px]" />
                </div>
            </div>
            
            <DialogFooter className="p-6 bg-background border-t shrink-0 flex flex-row items-center justify-end gap-2">
                <DialogClose asChild><Button type="button" variant="outline" onClick={resetForm}>{t('common.cancel')}</Button></DialogClose>
                <SubmitButton isDisabled={!isFormValid} />
            </DialogFooter>
        </form>
         {state.message && !state.success && <p className="text-red-500 text-sm mt-2 px-6 pb-6">{state.message}</p>}
      </DialogContent>
    </Dialog>
  );
}
