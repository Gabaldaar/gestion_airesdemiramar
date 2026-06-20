
'use client';

import { useEffect, useRef, useState, useTransition, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { DatePicker } from './ui/date-picker';
import { Textarea } from './ui/textarea';
import { Loader2, RefreshCw } from 'lucide-react';
import { addManualAdjustment } from '@/lib/actions';
import { Provider, Property, TaskScope, AdjustmentCategory, CurrencySettings, getAdjustmentCategories } from '@/lib/data';
import { useToast } from './ui/use-toast';
import { useAuth } from './auth-provider';
import { currencies } from '@/lib/currencies';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from '@/lib/utils';
import { Checkbox } from './ui/checkbox';

const initialState = { success: false, message: '' };

export function ManualAdjustmentAddForm({ provider, properties, scopes, isOpen, onOpenChange, onActionComplete }: {
    provider: Provider | null;
    properties: Property[];
    scopes: TaskScope[];
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onActionComplete: () => void;
}) {
    const { appUser, orgId } = useAuth();
    const { t } = useTranslation();
    const isPersonalFlavor = appUser?.appFlavor !== 'commercial';
    const isAdmin = appUser?.role === 'admin';

    const [state, setState] = useState(initialState);
    const [isPending, startTransition] = useTransition();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [categories, setCategories] = useState<AdjustmentCategory[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
    const showPaidOption = selectedCategory?.type === 'addition';
    const formRef = useRef<HTMLFormElement>(null);
    const { toast } = useToast();

    const [currency, setCurrency] = useState('ARS');
    const [exchangeRate, setExchangeRate] = useState('');
    const [isFetchingRate, setIsFetchingRate] = useState(false);
    const [currencySettings, setCurrencySettings] = useState<CurrencySettings | null>(null);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            const result = await addManualAdjustment(initialState, formData);
            setState(result);
        });
    };

    const fetchRate = async (type: string = 'oficial') => {
        setIsFetchingRate(true);
        try {
            const response = await fetch(`/api/dollar-rate?type=${type}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            setExchangeRate(data.venta.toString());
        } catch (error) {
            console.error("Failed to fetch dollar rate:", error);
        } finally {
            setIsFetchingRate(false);
        }
    };

    const handleCurrencyChange = (value: string) => {
        setCurrency(value);
        if (value === 'ARS') {
            setExchangeRate('');
        }
    };

    useEffect(() => {
        if (state.message) {
            toast({
                title: state.success ? t('common.success') : t('common.error'),
                description: state.message,
                variant: state.success ? 'default' : 'destructive',
            });
            if (state.success) {
                onActionComplete();
                onOpenChange(false);
            }
        }
    }, [state, onActionComplete, onOpenChange, toast, t]);
    
    useEffect(() => {
        if (isOpen && appUser && orgId) {
            getAdjustmentCategories(orgId).then(setCategories);
            if (appUser.appFlavor === 'commercial') {
                const currentOrgId = orgId || 'global';
                getDoc(doc(db, 'settings', `currencies_${currentOrgId}`)).then(snap => {
                    if (snap.exists()) {
                        const settings = snap.data() as CurrencySettings;
                        setCurrencySettings(settings);
                        setCurrency(settings.baseCurrency || 'ARS');
                    } else {
                        setCurrency('ARS');
                    }
                });
            } else {
                setCurrency('ARS');
            }
            formRef.current?.reset();
            setDate(new Date());
            setState(initialState);
            setExchangeRate('');
            setSelectedCategoryId('');
        }
    }, [isOpen, appUser, orgId]);

    if (!provider) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent 
              className="sm:max-w-[500px] p-0 overflow-hidden rounded-3xl flex flex-col max-h-[90vh]"
              onPointerDownOutside={(e) => e.preventDefault()}
              onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader className="p-6 bg-background border-b shrink-0">
                    <DialogTitle>{t('liquidations.add_adjustment_dialog.title').replace('{{name}}', provider.name)}</DialogTitle>
                    <DialogDescription>{t('liquidations.add_adjustment_dialog.description')}</DialogDescription>
                </DialogHeader>
                <form ref={formRef} onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden bg-muted/30">
                    <input type="hidden" name="providerId" value={provider.id} />
                    <input type="hidden" name="date" value={date?.toISOString() || ''} />
                    <input type="hidden" name="orgId" value={orgId || ''} />
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 shadow-inner">
                        <div className="space-y-2">
                            <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('common.date')}</Label>
                            <DatePicker date={date} onDateSelect={setDate} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="assignment" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('expenses.add_dialog.impute_to')}</Label>
                            <Select name="assignment" required>
                                <SelectTrigger className="bg-background h-11 shadow-sm"><SelectValue placeholder={t('expenses.add_dialog.impute_placeholder')}/></SelectTrigger>
                                <SelectContent>
                                    {properties && properties.length > 0 && (
                                        <SelectGroup>
                                            <SelectLabel>{t('navigation.properties')}</SelectLabel>
                                            {properties.map(p => <SelectItem key={p.id} value={`property-${p.id}`}>{p.name}</SelectItem>)}
                                        </SelectGroup>
                                    )}
                                    {scopes && scopes.length > 0 && (
                                        <SelectGroup>
                                            <SelectLabel>{t('tasks.assignment_types.scope')}</SelectLabel>
                                            {scopes.map(s => <SelectItem key={s.id} value={`scope-${s.id}`}>{s.name}</SelectItem>)}
                                        </SelectGroup>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="categoryId" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('liquidations.pending_items.manual_adjustments')}</Label>
                            <Select name="categoryId" value={selectedCategoryId} onValueChange={setSelectedCategoryId} required>
                                 <SelectTrigger className="bg-background h-11 shadow-sm"><SelectValue placeholder={t('common.select_category')}/></SelectTrigger>
                                 <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name} {cat.type === 'addition' ? `(+) ${t('liquidations.adjustment_types.addition')}` : `(-) ${t('liquidations.adjustment_types.deduction')}`}
                                        </SelectItem>
                                    ))}
                                    {categories.length === 0 && <SelectItem value="none" disabled>Sin categorías disponibles</SelectItem>}
                                 </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('expenses.add_dialog.amount')}</Label>
                                <Input id="amount" name="amount" type="number" step="0.01" required className="h-11 bg-background shadow-sm font-bold" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currency" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('common.currency')}</Label>
                                 <Select name="currency" value={currency} onValueChange={handleCurrencyChange} required>
                                    <SelectTrigger className="bg-background h-11 shadow-sm"><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        {appUser?.appFlavor !== 'commercial' ? (
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

                         {currency === 'USD' && isPersonalFlavor && (
                            <div className="space-y-2">
                                <Label htmlFor="exchangeRate" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('expenses.add_dialog.exchange_rate')}</Label>
                                <div className="flex items-center gap-2">
                                    <Input 
                                        id="exchangeRate" 
                                        name="exchangeRate" 
                                        type="number" 
                                        step="0.01" 
                                        placeholder={t('expenses.add_dialog.exchange_rate_placeholder')} 
                                        required 
                                        value={exchangeRate} 
                                        onChange={(e) => setExchangeRate(e.target.value)} 
                                        className="h-11 bg-background shadow-sm"
                                    />
                                    <Button type="button" variant="outline" size="icon" onClick={() => fetchRate()} disabled={isFetchingRate} className="h-11 w-11 shadow-sm shrink-0">
                                        {isFetchingRate ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        )}
                        
                        
                        {showPaidOption && isAdmin && (
                            <div className="flex items-center space-x-2 py-2">
                                <Checkbox id="paid" name="paid" />
                                <Label htmlFor="paid" className="cursor-pointer text-muted-foreground font-bold uppercase text-[10px] tracking-widest select-none">
                                    {t('liquidations.add_adjustment_dialog.paid_label')}
                                </Label>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="notes" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('tenants.card.notes')}</Label>
                            <Textarea id="notes" name="notes" placeholder="..." className="bg-background shadow-inner min-h-[100px]" />
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-background border-t shrink-0 flex flex-row items-center justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="font-bold uppercase text-[10px] tracking-widest h-11">{t('common.cancel')}</Button>
                        <Button type="submit" disabled={isPending} className="font-bold uppercase text-[10px] tracking-widest h-11 px-8">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            {t('common.save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
