'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
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
import { updateTask } from '@/lib/actions';
import { Property, TaskCategory, TaskPriority, TaskStatus, TaskWithDetails, Task, Provider, TaskScope, CurrencySettings, getCurrencySettings } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';
import { DatePicker } from './ui/date-picker';
import { parseDateSafely } from '@/lib/utils';
import { useToast } from './ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from './auth-provider';
import { currencies } from '@/lib/currencies';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTranslation } from '@/i18n/useTranslation';
import { cn } from '@/lib/utils';


const initialState: { message: string; success: boolean } = {
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

export function TaskEditForm({
    task,
    properties,
    categories,
    providers,
    scopes,
    isOpen,
    onOpenChange,
    onTaskUpdated,
    onTaskCompletedWithExpense,
}: {
    task: TaskWithDetails;
    properties: Property[];
    categories: TaskCategory[];
    providers?: Provider[];
    scopes: TaskScope[];
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onTaskUpdated: () => void;
    onTaskCompletedWithExpense: (task: Task) => void;
}) {
  const { t } = useTranslation();
  const { appUser } = useAuth();
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  
  const [dueDate, setDueDate] = useState<Date | undefined>(parseDateSafely(task.dueDate));
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [costCurrency, setCostCurrency] = useState<string>('');
  const [showConfirmExpenseDialog, setShowConfirmExpenseDialog] = useState(false);
  const [formDataForExpense, setFormDataForExpense] = useState<FormData | null>(null);
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings | null>(null);

  const formAction = (formData: FormData) => {
    const newStatus = formData.get('status') as TaskStatus;
    const estimatedCost = parseFloat(formData.get('estimatedCost') as string);
    
    if (task.status !== 'completed' && newStatus === 'completed' && estimatedCost > 0) {
        setFormDataForExpense(formData);
        setShowConfirmExpenseDialog(true);
    } else {
        submitUpdate(formData);
    }
  };

  const submitUpdate = (formData: FormData) => {
    startTransition(async () => {
        const result = await updateTask(initialState, formData);
        setState(result);
    });
  }

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
      onTaskUpdated();
      toast({ title: t('common.success'), description: state.message });
    } else if (state.message) {
      toast({ title: t('common.error'), description: state.message, variant: "destructive" });
    }
  }, [state, onOpenChange, onTaskUpdated, toast, t]);
  
  const handleConfirmExpense = () => {
    if (formDataForExpense) {
        const rawCostCurrency = formDataForExpense.get('costCurrency') as string | null;
        const costCurrency: 'ARS' | 'USD' | null =
          rawCostCurrency === 'ARS' || rawCostCurrency === 'USD'
            ? rawCostCurrency
            : null;
        
        const taskDataForExpense = {
            ...task,
            estimatedCost: parseFloat(formDataForExpense.get('estimatedCost') as string) || 0,
            costCurrency: costCurrency,
            providerId: (formDataForExpense.get('providerId') as string) || null,
        };
        onTaskCompletedWithExpense(taskDataForExpense);
        submitUpdate(formDataForExpense);
    }
    setShowConfirmExpenseDialog(false);
    setFormDataForExpense(null);
  };
  
  const handleDeclineExpense = () => {
    if (formDataForExpense) {
        submitUpdate(formDataForExpense);
    }
    setShowConfirmExpenseDialog(false);
    setFormDataForExpense(null);
  }

  useEffect(() => {
    if (isOpen && appUser) {
        setDueDate(parseDateSafely(task.dueDate));
        setStatus(task.status);
        if (appUser.appFlavor === 'commercial') {
            getDoc(doc(db, 'settings', 'currencies')).then(snap => {
                if (snap.exists()) {
                    const settings = snap.data() as CurrencySettings;
                    setCurrencySettings(settings);
                    setCostCurrency(task.costCurrency || settings.baseCurrency || 'ARS');
                } else {
                    setCostCurrency(task.costCurrency || 'ARS');
                }
            });
        } else {
            setCostCurrency(task.costCurrency || 'ARS');
        }
    }
  }, [isOpen, task, appUser]);

  const defaultAssignmentValue = task.assignment ? `${task.assignment.type}-${task.assignment.id}` : undefined;
  const isPersonalFlavor = appUser?.appFlavor !== 'commercial';

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-xl p-0 overflow-hidden rounded-3xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-6 bg-background border-b">
          <DialogTitle>{t('tasks.edit_dialog.title')}</DialogTitle>
          <DialogDescription>
            {t('tasks.edit_dialog.description')}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef} className="bg-muted/30">
            <input type="hidden" name="id" value={task.id} />
            <input type="hidden" name="dueDate" value={dueDate?.toISOString().split('T')[0] || ''} />
            
            <div className="p-6 max-h-[60vh] overflow-y-auto shadow-inner border-y border-muted-foreground/10 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="assignment" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('tasks.filters.assignment_type')}</Label>
                    <Select name="assignment" defaultValue={defaultAssignmentValue} required>
                        <SelectTrigger className="bg-background h-11 shadow-sm"><SelectValue placeholder={isPersonalFlavor ? t('tasks.filters.assignment_type') : t('navigation.properties')}/></SelectTrigger>
                        <SelectContent>
                           <SelectGroup>
                                <Label>{t('navigation.properties')}</Label>
                                {properties.map(p => <SelectItem key={p.id} value={`property-${p.id}`}>{p.name}</SelectItem>)}
                            </SelectGroup>
                           {isPersonalFlavor && scopes && scopes.length > 0 && (
                                <SelectGroup>
                                    <Label>{t('tasks.assignment_types.scope')}</Label>
                                    {scopes.map(s => <SelectItem key={s.id} value={`scope-${s.id}`}>{s.name}</SelectItem>)}
                               </SelectGroup>
                           )}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('tasks.table.description')}</Label>
                    <Input id="description" name="description" defaultValue={task.description} required className="h-11 bg-background shadow-sm" />
                </div>

                {isPersonalFlavor && (
                    <div className="space-y-2">
                        <Label htmlFor="providerId" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('tasks.filters.provider')}</Label>
                        <Select name="providerId" defaultValue={task.providerId || 'none'}>
                            <SelectTrigger className="bg-background h-11 shadow-sm"><SelectValue placeholder={t('tasks.filters.provider')} /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">{t('common.none')}</SelectItem>
                                {providers?.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="status" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('tasks.filters.status')}</Label>
                        <Select name="status" value={status} onValueChange={(v) => setStatus(v as TaskStatus)} required>
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
                        <Select name="priority" defaultValue={task.priority} required>
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
                        <Select name="categoryId" defaultValue={task.categoryId || 'none'}>
                            <SelectTrigger className="bg-background h-11 shadow-sm"><SelectValue placeholder={t('tasks.filters.category')} /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">{t('common.none')}</SelectItem>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
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
                        <Input id="estimatedCost" name="estimatedCost" type="number" step="0.01" defaultValue={task.estimatedCost || undefined} className="h-11 bg-background shadow-sm font-bold" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="costCurrency" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('tasks.filters.currency')}</Label>
                        <Select name="costCurrency" value={costCurrency} onValueChange={(v) => setCostCurrency(v)}>
                            <SelectTrigger className="bg-background h-11 shadow-sm"><SelectValue /></SelectTrigger>
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
                <div className="space-y-2">
                    <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('tasks.table.real_cost')}</Label>
                    <Input value={task.actualCost?.toFixed(2) || '0.00'} readOnly disabled className="h-11 bg-background shadow-inner opacity-70" />
                </div>


                <div className="space-y-2">
                    <Label htmlFor="notes" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('tenants.card.notes')}</Label>
                    <Textarea id="notes" name="notes" defaultValue={task.notes || undefined} className="bg-background shadow-inner min-h-[100px]" />
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

    <AlertDialog open={showConfirmExpenseDialog} onOpenChange={setShowConfirmExpenseDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t('tasks.tooltips.register_expense')}</AlertDialogTitle>
                <AlertDialogDescription>
                    La tarea se marcó como "Cumplida" y tiene un costo estimado. ¿Deseas registrar un gasto asociado a esta tarea?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <Button variant="outline" onClick={handleDeclineExpense}>No, solo guardar la tarea</Button>
                <Button onClick={handleConfirmExpense}>Sí, registrar gasto</Button>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
