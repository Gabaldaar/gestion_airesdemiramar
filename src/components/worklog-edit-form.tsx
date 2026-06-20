'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { DatePicker } from './ui/date-picker';
import { Textarea } from './ui/textarea';
import { Loader2 } from 'lucide-react';
import { updateWorkLog } from '@/lib/actions';
import { Provider, Property, TaskScope, WorkLog } from '@/lib/data';
import { useToast } from './ui/use-toast';
import { parseDateSafely, cn, parseAssignment } from '@/lib/utils';
import { useAuth } from './auth-provider';
import { useTranslation } from "@/i18n/useTranslation";
import { Checkbox } from './ui/checkbox';

const initialState = { success: false, message: '' };

export function WorkLogEditForm({ provider, properties, scopes, workLog, isOpen, onOpenChange, onActionComplete }: {
    provider: Provider;
    properties: Property[];
    scopes: TaskScope[];
    workLog: WorkLog;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onActionComplete: () => void;
}) {
    const { appUser } = useAuth();
    const { t } = useTranslation();
    const isAdmin = appUser?.role === 'admin';

    const initialAssignment = parseAssignment(workLog.assignment);
    const [state, setState] = useState(initialState);
    const [isPending, startTransition] = useTransition();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [activityType, setActivityType] = useState<'hourly' | 'per_visit' | 'monthly'>('hourly');
    const [rate, setRate] = useState<number | ''>('');
    const formRef = useRef<HTMLFormElement>(null);
    const { toast } = useToast();
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(initialAssignment.id);
    const [assignment, setAssignment] = useState<string>(`${initialAssignment.type}-${initialAssignment.id}`);


    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            const result = await updateWorkLog(initialState, formData);
            setState(result);
        });
    };

    useEffect(() => {
        if (state.message) {
            toast({
                title: state.success ? t('common.success') : t('common.error'),
                description: state.message,
                variant: state.success ? 'default' : 'destructive',
                duration: 3000,
            });
            if (state.success) {
                onActionComplete();
                onOpenChange(false);
            }
        }
    }, [state, onActionComplete, onOpenChange, toast, t]);
    
    useEffect(() => {
        if (isOpen) {
            setDate(parseDateSafely(workLog.date));
            setActivityType(workLog.activityType);
            setRate(workLog.rateApplied);
            const parsed = parseAssignment(workLog.assignment);
            setSelectedAssignmentId(parsed.id);
            setAssignment(`${parsed.type}-${parsed.id}`);
            setState(initialState);
        }
    }, [isOpen, workLog]);
    
    useEffect(() => {
        let newRate: number | '' = '';
        const isVisit = activityType === 'per_visit';

        if (activityType === 'monthly') {
             newRate = provider.monthlyRate || '';
        } else if (isVisit && selectedAssignmentId) {
             const selectedProperty = properties.find(p => p.id === selectedAssignmentId);
             const specificRate = selectedProperty?.visitRates?.[provider.id];
             newRate = specificRate ?? (provider.perVisitRate || '');
        } else if (isVisit) {
             newRate = provider.perVisitRate || '';
        } else { // hourly
            newRate = provider.hourlyRate || '';
        }

        setRate(newRate);
        
    }, [activityType, selectedAssignmentId, properties, provider]);

    const showActivityTypeSelect = provider.billingType === 'hourly_or_visit';
    const quantityLabel = activityType === 'hourly' ? t('liquidations.add_activity_dialog.hours_label') : activityType === 'monthly' ? t('liquidations.add_activity_dialog.months_label') : t('liquidations.add_activity_dialog.visits_label');
    const quantityPlaceholder = activityType === 'hourly' ? "Ej: 2.5" : "Ej: 1";
    const rateLabel = activityType === 'hourly' ? t('liquidations.add_activity_dialog.rate_hour_label') : activityType === 'monthly' ? t('liquidations.add_activity_dialog.rate_month_label') : t('liquidations.add_activity_dialog.rate_visit_label');

    const defaultAssignmentValue = `${workLog.assignment.type}-${workLog.assignment.id}`;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent 
              className="sm:max-w-[500px] p-0 overflow-hidden rounded-3xl"
              onPointerDownOutside={(e) => e.preventDefault()}
              onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader className="p-6 bg-background border-b">
                    <DialogTitle>{t('liquidations.edit_activity_dialog.title').replace('{{name}}', provider.name)}</DialogTitle>
                    <DialogDescription>{t('liquidations.edit_activity_dialog.description')}</DialogDescription>
                </DialogHeader>
                <form ref={formRef} onSubmit={handleSubmit} className="bg-muted/30">
                    <input type="hidden" name="id" value={workLog.id} />
                    <input type="hidden" name="providerId" value={provider.id} />
                    <input type="hidden" name="date" value={date?.toISOString() || ''} />
                    
                    <div className="p-6 max-h-[60vh] overflow-y-auto shadow-inner border-y border-muted-foreground/10 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('common.date')}</Label>
                            <DatePicker date={date} onDateSelect={setDate} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="assignment" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('expenses.add_dialog.impute_to')}</Label>
                            <Select name="assignment" value={assignment} onValueChange={(val) => { setAssignment(val); setSelectedAssignmentId(val.split('-')[1]); }} required>
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
                        
                        {showActivityTypeSelect ? (
                            <div className="space-y-2">
                                <Label htmlFor="activityType" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('expenses.filters.type')}</Label>
                                <Select name="activityType" value={activityType} onValueChange={(v) => setActivityType(v as 'hourly' | 'per_visit')} required>
                                    <SelectTrigger className="bg-background h-11 shadow-sm"><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hourly">{t('liquidations.pending_items.hours_visits').split(' ')[0]}</SelectItem>
                                        <SelectItem value="per_visit">{t('liquidations.pending_items.hours_visits').split(' ')[2]}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <input type="hidden" name="activityType" value={activityType} />
                        )}

                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="quantity" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{quantityLabel}</Label>
                                <Input key={activityType} id="quantity" name="quantity" type="number" step="0.5" defaultValue={workLog.activityType === activityType ? workLog.quantity : (activityType === 'monthly' ? 1 : undefined)} placeholder={quantityPlaceholder} required className="h-11 bg-background shadow-sm" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rate" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{rateLabel}</Label>
                                <Input 
                                    id="rate" 
                                    name="rate" 
                                    type="number" 
                                    step="0.01" 
                                    value={rate}
                                    onChange={(e) => setRate(parseFloat(e.target.value) || '')} 
                                    readOnly={!isAdmin} 
                                    className={cn("h-11 shadow-sm font-bold", !isAdmin ? "bg-muted/50" : "bg-background")} 
                                    required 
                                />
                            </div>
                        </div>
                        
                        {isAdmin && (
                            <div className="flex items-center space-x-2 py-2">
                                <Checkbox id="paid" name="paid" />
                                <Label htmlFor="paid" className="cursor-pointer text-muted-foreground font-bold uppercase text-[10px] tracking-widest select-none">
                                    {t('liquidations.add_activity_dialog.paid_label')}
                                </Label>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('common.description')}</Label>
                            <Textarea id="description" name="description" defaultValue={workLog.description} className="bg-background shadow-inner min-h-[100px]" />
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-background border-t">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="font-bold uppercase text-[10px] tracking-widest h-11">{t('common.cancel')}</Button>
                        <Button type="submit" disabled={isPending} className="font-bold uppercase text-[10px] tracking-widest h-11 px-8 shadow-lg">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            {t('common.save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
