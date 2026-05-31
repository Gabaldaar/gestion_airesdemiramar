'use client';

import { useEffect, useState, useTransition, useMemo } from 'react';
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
import { updateExpense } from '@/lib/actions';
import { ExpenseWithDetails, ExpenseCategory, Provider, CurrencySettings } from '@/lib/data';
import { Pencil, Calendar as CalendarIcon, Loader2, RefreshCw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn, parseDateSafely } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from './ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from './ui/textarea';
import { useAuth } from './auth-provider';
import { currencies } from '@/lib/currencies';
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
        <Button type="submit" disabled={pending}>
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

export function ExpenseEditForm({ expense, categories, providers, onExpenseUpdated, isOpen, onOpenChange }: {
    expense: ExpenseWithDetails,
    categories: ExpenseCategory[],
    providers?: Provider[],
    onExpenseUpdated: () => void;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}) {
  const { appUser } = useAuth();
  const { t } = useTranslation();
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState<Date | undefined>(parseDateSafely(expense.date));
  const [currency, setCurrency] = useState<string>(expense.originalUsdAmount ? 'USD' : expense.currency || 'ARS');
  const [exchangeRate, setExchangeRate] = useState(expense.exchangeRate?.toString() || '');
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string>(expense.providerId || 'none');
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings | null>(null);

  const isPersonalFlavor = appUser?.appFlavor !== 'commercial';

  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await updateExpense(initialState, formData);
        setState(result);
    });
  };

  const fetchRate = async () => {
    setIsFetchingRate(true);
    try {
        const response = await fetch('/api/dollar-rate');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setExchangeRate(data.venta.toString());
    } catch (error) {
        console.error("Failed to fetch dollar rate:", error);
    } finally {
        setIsFetchingRate(false);
    }
  };

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
      onExpenseUpdated();
    }
  }, [state, onExpenseUpdated, onOpenChange]);

  useEffect(() => {
    if (!isOpen) {
        setState(initialState);
        setDate(parseDateSafely(expense.date));
        setCurrency(expense.originalUsdAmount ? 'USD' : expense.currency || 'ARS');
        setExchangeRate(expense.exchangeRate?.toString() || '');
        setSelectedProviderId(expense.providerId || 'none');
        setIsFetchingRate(false);
    } else if (appUser) {
        if (appUser.appFlavor === 'commercial') {
            getDoc(doc(db, 'settings', 'currencies')).then(snap => {
                if (snap.exists()) setCurrencySettings(snap.data() as CurrencySettings);
            });
        }
    }
  }, [isOpen, expense, appUser]);

  const isConversionNeeded = useMemo(() => {
    return currency === 'USD' && appUser?.appFlavor !== 'commercial';
  }, [currency, appUser?.appFlavor]);

  useEffect(() => {
    if (isConversionNeeded && !exchangeRate && !isFetchingRate && isOpen) {
      fetchRate();
    }
  }, [isConversionNeeded, exchangeRate, isFetchingRate, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[425px] p-0 overflow-hidden rounded-3xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-6 bg-background border-b">
          <DialogTitle>{t('expenses.edit_dialog.title')}</DialogTitle>
            <DialogDescription>
                {t('expenses.edit_dialog.description')}
            </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="bg-muted/30">
            <input type="hidden" name="id" value={expense.id} />
            <input type="hidden" name="assignmentType" value={expense.assignment.type} />
            <input type="hidden" name="assignmentId" value={expense.assignment.id} />
            <input type="hidden" name="date" value={date?.toISOString() || ''} />
            <input type="hidden" name="providerId" value={isPersonalFlavor ? selectedProviderId : 'none'} />
            
            <div className="p-6 max-h-[60vh] overflow-y-auto shadow-inner border-y border-muted-foreground/10 space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date" className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('expenses.add_dialog.date')}</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "col-span-3 justify-start text-left font-normal h-11 bg-background shadow-sm",
                            !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP", { locale: es }) : <span>{t('expenses.add_dialog.date_placeholder')}</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={es} /></PopoverContent>
                    </Popover>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="categoryId" className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('expenses.add_dialog.category')}</Label>
                    <Select name="categoryId" defaultValue={expense.categoryId || 'none'}>
                        <SelectTrigger className="col-span-3 bg-background h-11 shadow-sm">
                            <SelectValue placeholder={t('expenses.add_dialog.category_placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="none">{t('common.none')}</SelectItem>
                            {categories.map(category => (
                                <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {isPersonalFlavor && providers && (
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="providerId-select" className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('expenses.add_dialog.provider')}</Label>
                        <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                            <SelectTrigger id="providerId-select" className="col-span-3 bg-background h-11 shadow-sm">
                                <SelectValue placeholder={t('expenses.add_dialog.provider_placeholder')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">{t('common.none')}</SelectItem>
                                {providers.map(provider => (
                                    <SelectItem key={provider.id} value={provider.id}>{provider.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="currency" className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('common.currency')}</Label>
                    <Select name="currency" value={currency} onValueChange={(value) => setCurrency(value)} required>
                        <SelectTrigger className="col-span-3 bg-background h-11 shadow-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {appUser?.appFlavor !== 'commercial' ? (
                                <><SelectItem value="ARS">ARS</SelectItem><SelectItem value="USD">USD</SelectItem></>
                            ) : (
                                (currencySettings?.favoriteCurrencies?.length ?? 0) > 0 ? (
                                    currencySettings!.favoriteCurrencies.map(code => {
                                        const currencyInfo = currencies.find(c => c.code === code);
                                        return (<SelectItem key={code} value={code}>
                                            {currencyInfo ? currencyInfo.name : code}
                                        </SelectItem>)
                                    })
                                ) : (
                                    <><SelectItem value="ARS">ARS</SelectItem><SelectItem value="USD">USD</SelectItem></>
                                )
                            )}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('expenses.add_dialog.amount')}</Label>
                    <Input id="amount" name="amount" type="number" step="0.01" defaultValue={expense.originalUsdAmount || expense.amount} className="col-span-3 h-11 bg-background shadow-sm font-bold" required />
                </div>
                {isConversionNeeded && (
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="exchangeRate" className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('expenses.add_dialog.exchange_rate')}</Label>
                        <div className="col-span-3 flex items-center gap-2">
                           <Input id="exchangeRate" name="exchangeRate" type="number" step="0.01" placeholder={t('expenses.add_dialog.exchange_rate_placeholder')} required value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} className="h-11 bg-background shadow-sm" />
                            <Button type="button" variant="outline" size="icon" onClick={fetchRate} disabled={isFetchingRate}>
                                {isFetchingRate ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="description" className="text-right pt-2 text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('expenses.add_dialog.description')}</Label>
                    <Textarea id="description" name="description" defaultValue={expense.description?.split('|')[0].trim()} className="col-span-3 bg-background shadow-inner min-h-[100px]" />
                </div>
            </div>
            <DialogFooter className="p-6 bg-background border-t">
                 <DialogClose asChild><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button></DialogClose>
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
