
'use client';

import { useEffect, useRef, useState, useTransition, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateContrato } from '@/lib/actions';
import { Tenant, Property, ContratoWithDetails, CurrencySettings, GuaranteeStatus, ContratoStatus } from '@/lib/data';
import { Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { useAuth } from './auth-provider';
import { currencies } from '@/lib/currencies';
import { DatePicker } from './ui/date-picker';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { cn, parseDateSafely } from '@/lib/utils';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTranslation } from "@/i18n/useTranslation";

const initialState = {
  message: '',
  success: false,
};

function SubmitButton() {
    const { t } = useTranslation();
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="px-8 font-bold uppercase text-[10px] tracking-widest h-11 shadow-lg">
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

export function ContratoEditForm({
  contrato,
  properties,
  tenants,
  isOpen,
  onOpenChange,
  onDataChanged,
}: {
  contrato: ContratoWithDetails;
  properties?: Property[];
  tenants: Tenant[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onDataChanged: () => void;
}) {
  const { appUser, orgId } = useAuth();
  const { t } = useTranslation();
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedPropertyId, setSelectedPropertyId] = useState(contrato.propertyId);
  const [tenantComboboxOpen, setTenantComboboxOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState(contrato.tenantId);
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState(contrato.moneda);
  const [status, setStatus] = useState<ContratoStatus>(contrato.status || 'active');

  // Guarantee state
  const [guaranteeStatus, setGuaranteeStatus] = useState<GuaranteeStatus>(contrato.guaranteeStatus || 'not_solicited');
  const [guaranteeReceivedDate, setGuaranteeReceivedDate] = useState<Date | undefined>(
    parseDateSafely(contrato.guaranteeReceivedDate)
  );
  const [guaranteeReturnedDate, setGuaranteeReturnedDate] = useState<Date | undefined>(
    parseDateSafely(contrato.guaranteeReturnedDate)
  );

  const sortedTenants = useMemo(() => {
    return [...tenants].sort((a, b) => a.name.localeCompare(b.name));
  }, [tenants]);

  useEffect(() => {
    if(isOpen && appUser) {
        setStartDate(parseDateSafely(contrato.fechaInicio));
        setEndDate(parseDateSafely(contrato.fechaFin));
        setSelectedPropertyId(contrato.propertyId);
        setSelectedTenantId(contrato.tenantId);
        setSelectedCurrency(contrato.moneda);
        setStatus(contrato.status || 'active');
        setGuaranteeStatus(contrato.guaranteeStatus || 'not_solicited');
        setGuaranteeReceivedDate(parseDateSafely(contrato.guaranteeReceivedDate));
        setGuaranteeReturnedDate(parseDateSafely(contrato.guaranteeReturnedDate));

        if (appUser.appFlavor === 'commercial') {
            const currentOrgId = orgId || 'global';
            getDoc(doc(db, 'settings', `currencies_${currentOrgId}`)).then(snap => {
                if (snap.exists()) setCurrencySettings(snap.data() as CurrencySettings);
            });
        }
    }
  }, [isOpen, contrato, appUser, orgId]);

  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await updateContrato(initialState, formData);
        if (result.success) {
            onDataChanged();
            onOpenChange(false);
        }
        setState(result);
    });
  };

  const isPersonalFlavor = appUser?.appFlavor !== 'commercial';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-xl p-0 overflow-hidden rounded-[2rem] flex flex-col max-h-[90vh]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-6 bg-background border-b shrink-0">
          <DialogTitle className="text-xl font-black uppercase italic tracking-tighter text-primary">{t('contratos.edit_dialog.title')}</DialogTitle>
          <DialogDescription>
            {t('contratos.edit_dialog.description')}
          </DialogDescription>
        </DialogHeader>
        
        <form action={formAction} ref={formRef} className="flex-1 flex flex-col overflow-hidden bg-muted/30">
            <input type="hidden" name="id" value={contrato.id} />
            <input type="hidden" name="propertyId" value={selectedPropertyId} />
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 shadow-inner border-y border-muted-foreground/10">
                {properties && (
                    <div className="space-y-2">
                        <Label htmlFor="propertyId-select" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('bookings.filters.property')}</Label>
                        <Select name="propertyId-select" value={selectedPropertyId} onValueChange={setSelectedPropertyId} required>
                            <SelectTrigger className="bg-background h-11 shadow-sm">
                                <SelectValue placeholder={t('common.select_property')} />
                            </SelectTrigger>
                            <SelectContent>
                                {properties.map(prop => (
                                    <SelectItem key={prop.id} value={prop.id}>{prop.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
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
                            {selectedTenantId && tenants
                                ? tenants.find((tenant) => tenant.id === selectedTenantId)?.name
                                : t('common.select_tenant')}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="fechaInicio" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('common.from')}</Label>
                        <DatePicker date={startDate} onDateSelect={setStartDate} placeholder="Inicio del contrato" />
                        <input type="hidden" name="fechaInicio" value={startDate?.toISOString().split('T')[0] || ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="fechaFin" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('common.to')}</Label>
                        <DatePicker date={endDate} onDateSelect={setEndDate} placeholder="Fin del contrato" defaultMonth={startDate} />
                        <input type="hidden" name="fechaFin" value={endDate?.toISOString().split('T')[0] || ''} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="status" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('bookings.filters.status')}</Label>
                    <Select name="status" value={status} onValueChange={(v) => setStatus(v as ContratoStatus)} required>
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
                        <Input id="montoInicial" name="montoInicial" type="number" step="0.01" defaultValue={contrato.montoInicial} required className="h-11 bg-background shadow-sm font-black text-primary text-lg" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="moneda" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('common.currency')}</Label>
                        <Select name="moneda" value={selectedCurrency} onValueChange={setSelectedCurrency} required>
                            <SelectTrigger className="bg-background h-11 shadow-sm w-24"><SelectValue /></SelectTrigger>
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
                        <Label htmlFor="frecuenciaAjuste" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('contratos.adjustment')}</Label>
                        <Select name="frecuenciaAjuste" defaultValue={String(contrato.frecuenciaAjuste)} required>
                                <SelectTrigger className="bg-background h-11 shadow-sm"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">{t('contratos.monthly')}</SelectItem>
                                    <SelectItem value="3">{t('contratos.every_x_months', { count: 3 })}</SelectItem>
                                    <SelectItem value="4">{t('contratos.every_x_months', { count: 4 })}</SelectItem>
                                    <SelectItem value="6">{t('contratos.every_x_months', { count: 6 })}</SelectItem>
                                    <SelectItem value="12">{t('contratos.every_x_months', { count: 12 })}</SelectItem>
                                </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="diaVencimiento" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('contratos.due_date')}</Label>
                        <Input id="diaVencimiento" name="diaVencimiento" type="number" min="1" max="28" defaultValue={contrato.diaVencimiento} required className="h-11 bg-background shadow-sm" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="contractStatus" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('bookings.filters.contract')}</Label>
                    <Select name="contractStatus" defaultValue={contrato.contractStatus || 'not_sent'} required>
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
                
                <div className="border-t pt-4 mt-6 space-y-4">
                     <h4 className="text-sm font-black uppercase text-primary tracking-widest border-l-4 border-primary pl-2">{t('bookings.filters.guarantee')}</h4>
                     <div className="space-y-2">
                         <Label htmlFor="guaranteeStatus" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('bookings.filters.guarantee_status')}</Label>
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
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="montoGarantia" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('bookings.filters.guarantee_amount')}</Label>
                            <Input id="montoGarantia" name="montoGarantia" type="number" step="0.01" defaultValue={contrato.montoGarantia} className="h-11 bg-background shadow-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="monedaGarantia" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('bookings.filters.guarantee_currency')}</Label>
                            <Select name="monedaGarantia" defaultValue={contrato.monedaGarantia || "USD"}>
                                <SelectTrigger className="bg-background h-11 shadow-sm w-24"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ARS">ARS</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('common.received_date')}</Label>
                            <DatePicker date={guaranteeReceivedDate} onDateSelect={setGuaranteeReceivedDate} placeholder={t('bookings.filters.guarantee_received_placeholder')} />
                            <input type="hidden" name="guaranteeReceivedDate" value={guaranteeReceivedDate ? guaranteeReceivedDate.toISOString().split('T')[0] : ''} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('common.returned_date')}</Label>
                            <DatePicker date={guaranteeReturnedDate} onDateSelect={setGuaranteeReturnedDate} placeholder={t('bookings.filters.guarantee_returned_placeholder')} />
                            <input type="hidden" name="guaranteeReturnedDate" value={guaranteeReturnedDate ? guaranteeReturnedDate.toISOString().split('T')[0] : ''} />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="notes" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('tenants.card.notes')} (Internas)</Label>
                    <Textarea id="notes" name="notes" defaultValue={contrato.notes || ''} placeholder="..." className="bg-background shadow-inner min-h-[100px]" />
                </div>
            </div>
            <DialogFooter className="p-6 bg-background border-t shrink-0 flex flex-row items-center justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="font-bold uppercase text-[10px] tracking-widest h-11 bg-background">{t('common.cancel')}</Button>
                <SubmitButton />
            </DialogFooter>
        </form>
         {state.message && !state.success && (
            <p className="text-red-500 text-sm mt-2 px-6 pb-6">{state.message}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
