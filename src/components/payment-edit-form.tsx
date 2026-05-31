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
import { updatePayment } from '@/lib/actions';
import { PaymentWithDetails, CurrencySettings } from '@/lib/data';
import { Pencil, Calendar as CalendarIcon, Loader2, RefreshCw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn, parseDateSafely } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from './ui/calendar';
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

interface PaymentEditFormProps {
    payment: PaymentWithDetails;
    onPaymentUpdated: () => void;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}


export function PaymentEditForm({ payment, onPaymentUpdated, isOpen, onOpenChange }: PaymentEditFormProps) {
  const { appUser } = useAuth();
  const { t } = useTranslation();
  const isPersonalFlavor = appUser?.appFlavor !== 'commercial';

  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  
  const [date, setDate] = useState<Date | undefined>(parseDateSafely(payment.date));
  const [currency, setCurrency] = useState<string>(payment.receivedCurrency || payment.currency || 'USD');
  const [exchangeRate, setExchangeRate] = useState(payment.exchangeRate?.toString() || '');
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings | null>(null);
  
  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
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


  const formAction = (formData: FormData) => {
    formData.append('appFlavor', isPersonalFlavor ? 'personal' : 'commercial');
    startTransition(async () => {
        const result = await updatePayment(initialState, formData);
        setState(result);
    });
  };

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
      onPaymentUpdated();
    }
  }, [state.success, onPaymentUpdated, onOpenChange]);

  useEffect(() => {
    if (!isOpen) {
        setState(initialState);
        setDate(parseDateSafely(payment.date));
        setCurrency(payment.receivedCurrency || payment.currency || 'USD');
        setExchangeRate(payment.exchangeRate?.toString() || '');
        setIsFetchingRate(false);
    } else if (appUser) {
        if (appUser.appFlavor === 'commercial') {
            getDoc(doc(db, 'settings', 'currencies')).then(snap => {
                if (snap.exists()) setCurrencySettings(snap.data() as CurrencySettings);
            });
        }
    }
  }, [isOpen, payment, appUser]);

  const isConversionNeeded = useMemo(() => {
      const debtCur = (payment.sourceCurrency || 'USD').toUpperCase();
      const currentCur = (currency || 'USD').toUpperCase();
      return currentCur !== debtCur;
  }, [currency, payment.sourceCurrency]);

  useEffect(() => {
    if (isConversionNeeded && !exchangeRate && !isFetchingRate && isPersonalFlavor && isOpen) {
      fetchRate();
    }
  }, [isConversionNeeded, exchangeRate, isFetchingRate, isPersonalFlavor, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[425px]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t('payments_page.edit_dialog.title')}</DialogTitle>
          <DialogDescription>
            {t('payments_page.edit_dialog.description')}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
            <input type="hidden" name="id" value={payment.id} />
            <input type="hidden" name="bookingId" value={payment.bookingId || ''} />
            <input type="hidden" name="contratoId" value={payment.contratoId || ''} />
            <input type="hidden" name="date" value={date?.toISOString() || ''} />
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date-popover" className="text-right">{t('expenses.add_dialog.date')}</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date-popover"
                            variant={"outline"}
                            className={cn(
                            "col-span-3 justify-start text-left font-normal",
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
                    <Label htmlFor="currency" className="text-right">{t('common.currency')}</Label>
                    <Select
                        name="currency"
                        value={currency}
                        onValueChange={handleCurrencyChange}
                        required
                    >
                        <SelectTrigger className="col-span-3">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                             {isPersonalFlavor ? (
                                <>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="ARS">ARS</SelectItem>
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
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="ARS">ARS</SelectItem>
                                    </>
                                )
                            )}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">{t('expenses.add_dialog.amount')}</Label>
                    <Input id="amount" name="amount" type="number" step="0.01" defaultValue={payment.receivedAmount || payment.amount} className="col-span-3" required />
                </div>
                 {isConversionNeeded && isPersonalFlavor && (
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="exchangeRate" className="text-right">{t('expenses.add_dialog.exchange_rate')}</Label>
                        <div className="col-span-3 flex items-center gap-2">
                           <Input id="exchangeRate" name="exchangeRate" type="number" step="0.01" placeholder={t('expenses.add_dialog.exchange_rate_placeholder')} required value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} />
                            <Button type="button" variant="outline" size="icon" onClick={fetchRate} disabled={isFetchingRate}>
                                {isFetchingRate ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                )}
                 <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="description" className="text-right pt-2">{t('expenses.add_dialog.description')}</Label>
                    <Textarea id="description" name="description" defaultValue={payment.description} className="col-span-3" placeholder="..." />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
                <SubmitButton />
            </DialogFooter>
        </form>
         {state.message && !state.success && (
            <p className="text-red-500 text-sm mt-2">{state.message}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
