'use client';

import { useEffect, useRef, useState, useTransition, useCallback } from 'react';
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
import { addTask } from '@/lib/actions';
import { Property, Provider, TaskCategory, TaskScope, CurrencySettings } from '@/lib/data';
import { Loader2, PlusCircle } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';
import { DatePicker } from './ui/date-picker';
import { useToast } from './ui/use-toast';
import { useAuth } from './auth-provider';
import { currencies } from '@/lib/currencies';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTranslation } from '@/i18n/useTranslation';
import { cn } from '@/lib/utils';

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

export function TaskAddForm({
    propertyId,
    properties,
    providers,
    categories,
    scopes,
    children,
    isOpen: propIsOpen,
    onOpenChange: propOnOpenChange,
    onTaskAdded,
    currencySettings: initialCurrencySettings
}: {
    propertyId?: string,
    properties?: Property[],
    providers?: Provider[],
    categories: TaskCategory[],
    scopes: TaskScope[],
    children?: React.ReactNode,
    isOpen?: boolean,
    onOpenChange?: (open: boolean) => void;
    onTaskAdded: () => void;
    currencySettings: CurrencySettings | null;
}) {
  const { appUser, orgId } = useAuth();
  const { t } = useTranslation();
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const { toast } = useToast();
  const [costCurrency, setCostCurrency] = useState('');
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings | null>(initialCurrencySettings);

  const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;
  const setIsOpen = propOnOpenChange !== undefined ? propOnOpenChange : setInternalIsOpen;

  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await addTask(initialState, formData);
        setState(result);
    });
  };

  const resetForm = useCallback(() => {
    formRef.current?.reset();
    setDueDate(undefined);
    setState(initialState);
  }, []);

  useEffect(() => {
    if (isOpen && appUser && orgId) {
        resetForm();
        const isCommercial = appUser.appFlavor === 'commercial';
        if (isCommercial) {
            getDoc(doc(db, 'settings', `currencies_${orgId}`)).then(snap => {
                if (snap.exists()) {
                    const settings = snap.data() as CurrencySettings;
                    setCurrencySettings(settings);
                    setCostCurrency(settings.baseCurrency || 'ARS');
                } else {
                    setCostCurrency('ARS');
                }
            });
        } else {
            setCostCurrency('ARS');
        }
    }
  }, [isOpen, appUser, orgId, resetForm]);

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? t('common.success') : t('common.error'),
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
    }
    if (state.success) {
      onTaskAdded();
      setIsOpen(false);
    }
  }, [state, onTaskAdded, setIsOpen, toast, t]);

  const isPersonalFlavor = appUser?.appFlavor !== 'commercial';
  const selectedPropertyName = properties?.find(p => p.id === propertyId)?.name || 'Propiedad Seleccionada';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent 
        className="sm:max-w-xl p-0 overflow-hidden rounded-3xl flex flex-col max-h-[90vh]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-6 bg-background border-b shrink-0">
          <DialogTitle>{t('tasks.add_dialog.title')}</DialogTitle>
          <DialogDescription>{t('tasks.add_dialog.description')}</DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef} className="flex-1 flex flex-col overflow-hidden bg-muted/30">
            <input type="hidden" name="dueDate" value={dueDate?.toISOString().split('T')[0] || ''} />
            <input type="hidden" name="orgId" value={orgId || ''} />
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 shadow-inner">
                <div className="space-y-2">
                    <Label htmlFor="assignment" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('tasks.filters.assignment_type')}</Label>
                    {propertyId ? (
                        <>
                            <input type="hidden" name="assignment" value={`property-${propertyId}`} />
                            <div className="p-3 border-2 border-primary/20 rounded-xl bg-primary/5 font-black text-primary shadow-sm flex items-center gap-2">
                                <PlusCircle className="h-4 w-4 opacity-70" />
                                {selectedPropertyName}
                            </div>
                        </>
                    ) : (
                        <Select name="assignment" required>
                            <SelectTrigger className="bg-background h-11 shadow-sm"><SelectValue placeholder={isPersonalFlavor ? t('tasks.assignment_types.all') : t('navigation.properties')}/></SelectTrigger>
                            <SelectContent>
                                {properties && properties.length > 0 && (
                                    <SelectGroup>
                                        <Label>{t('navigation.properties')}</Label>
                                        {properties.map(p => <SelectItem key={p.id} value={`property-${p.id}`}>{p.name}</SelectItem>)}
                                    </SelectGroup>
                                )}
                                {isPersonalFlavor && scopes && scopes.length > 0 && (
                                    <SelectGroup>
                                        <Label>{t('tasks.assignment_types.scope')}</Label>
                                        {scopes.map(s => <SelectItem key={s.id} value={`scope-${s.id}`}>{s.name}</SelectItem>)}
                                    </SelectGroup>
                                )}
                            </SelectContent>
                        </Select>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('tasks.table.description')}</Label>
                    <Input id="description" name="description" required className="h-11 bg-background shadow-sm" />
                </div>
                {isPersonalFlavor && (
                    <div className="space-y-2">
                        <Label htmlFor="providerId" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('tasks.filters.provider')}</Label>
                        <Select name="providerId">
                            <SelectTrigger className="bg-background h-11 shadow-sm"><SelectValue placeholder={t('tasks.filters.provider')} /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">{t('common.none')}</SelectItem>
                                {providers?.map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="status" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('tasks.filters.status')}</Label>
                        <Select name="status" defaultValue="pending" required>
                            <SelectTrigger className="bg-background h-11 shadow-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">{t('tasks.status.pending')}</SelectItem>
                                <SelectItem value="in_progress">{t('tasks.status.in_progress')}</SelectItem>
                                <SelectItem value="completed">{t('tasks.status.completed')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="priority" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('tasks.filters.priority')}</Label>
                        <Select name="priority" defaultValue="medium" required>
                            <SelectTrigger className="bg-background h-11 shadow-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="high">{t('tasks.priority.high')}</SelectItem>
                                <SelectItem value="medium">{t('tasks.priority.medium')}</SelectItem>
                                <SelectItem value="low">{t('tasks.priority.low')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="categoryId" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('tasks.filters.category')}</Label>
                        <Select name="categoryId">
                            <SelectTrigger className="bg-background h-11 shadow-sm"><SelectValue placeholder={t('tasks.filters.category')} /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">{t('common.none')}</SelectItem>
                                {categories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dueDate" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('tasks.table.due_date')}</Label>
                        <DatePicker date={dueDate} onDateSelect={setDueDate} placeholder={t('tasks.table.due_date')} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="estimatedCost" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('tasks.table.est_cost')}</Label>
                        <Input id="estimatedCost" name="estimatedCost" type="number" step="0.01" className="h-11 bg-background shadow-sm font-bold" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="costCurrency" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('tasks.filters.currency')}</Label>
                        <Select name="costCurrency" value={costCurrency} onValueChange={setCostCurrency}>
                            <SelectTrigger className="bg-background h-11 shadow-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {appUser?.appFlavor !== 'commercial' ? (
                                    <><SelectItem value="ARS">ARS</SelectItem><SelectItem value="USD">USD</SelectItem></>
                                ) : (
                                    (currencySettings?.favoriteCurrencies?.length ?? 0) > 0 ? (
                                        currencySettings!.favoriteCurrencies.map(code => {
                                            const currencyInfo = currencies.find(c => c.code === code);
                                            return (<SelectItem key={code} value={code}>{currencyInfo ? currencyInfo.name : code}</SelectItem>)
                                        })
                                    ) : (
                                        <><SelectItem value="ARS">ARS</SelectItem><SelectItem value="USD">USD</SelectItem>
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
                <SubmitButton />
            </DialogFooter>
        </form>
         {state.message && !state.success && <p className="text-red-500 text-sm mt-2 px-6 pb-6">{state.message}</p>}
      </DialogContent>
    </Dialog>
  );
}
