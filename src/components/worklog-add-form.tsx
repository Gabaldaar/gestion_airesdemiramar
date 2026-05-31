'use client';

import { useEffect, useRef, useState, useTransition, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { DatePicker } from './ui/date-picker';
import { Textarea } from './ui/textarea';
import { Loader2 } from 'lucide-react';
import { addWorkLog } from '@/lib/actions';
import { Provider, Property, TaskScope } from '@/lib/data';
import { useToast } from './ui/use-toast';
import { useAuth } from './auth-provider';
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from '@/lib/utils';

const initialState = { success: false, message: '' };

export function WorkLogAddForm({ provider, properties, scopes, isOpen, onOpenChange, onActionComplete }: {
    provider: Provider | null;
    properties: Property[];
    scopes: TaskScope[];
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onActionComplete: () => void;
}) {
    const { appUser, orgId } = useAuth();
    const { t } = useTranslation();
    const isAdmin = appUser?.role === 'admin';

    const [state, setState] = useState(initialState);
    const [isPending, startTransition] = useTransition();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [activityType, setActivityType] = useState<'hourly' | 'per_visit'>('hourly');
    const [rate, setRate] = useState<number | ''>('');
    const formRef = useRef<HTMLFormElement>(null);
    const { toast } = useToast();
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            const result = await addWorkLog(initialState, formData);
            setState(result);
        });
    };

    useEffect(() => {
        if (state.message) {
            toast({
                title: state.success ? t('common.success') : t('common.error'),
                description: state.message,
                variant: state.success ? 'default' : 'destructive',
                duration: state.success ? 3000 : 5000,
            });
            if (state.success) {
                onActionComplete();
                onOpenChange(false);
            }
        }
    }, [state, onActionComplete, onOpenChange, toast, t]);
    
    useEffect(() => {
        if (isOpen && provider) {
            formRef.current?.reset();
            setDate(new Date());
            setState(initialState);
            setRate(''); 
            setSelectedAssignmentId(null);

            if (provider.billingType === 'hourly') {
                setActivityType('hourly');
                setRate(provider.hourlyRate || '');
            } else if (provider.billingType === 'per_visit') {
                setActivityType('per_visit');
                setRate(provider.perVisitRate || '');
            } else { 
                setActivityType('hourly'); 
                setRate(provider.hourlyRate || '');
            }
        }
    }, [isOpen, provider]);

    useEffect(() => {
        if (!provider) return;
        let newRate: number | '' = '';
        const isVisit = activityType === 'per_visit';

        if (isVisit && selectedAssignmentId) {
             const selectedProperty = properties.find(p => p.id === selectedAssignmentId);
             const specificRate = selectedProperty?.visitRates?.[provider.id];
             newRate = specificRate ?? (provider.perVisitRate || '');
        } else if (isVisit) {
             newRate = provider.perVisitRate || '';
        } else { 
            newRate = provider.hourlyRate || '';
        }

        setRate(newRate);
        
    }, [activityType, selectedAssignmentId, properties, provider]);


    const showActivityTypeSelect = provider?.billingType === 'hourly_or_visit';
    const quantityLabel = activityType === 'hourly' ? t('liquidations.add_activity_dialog.hours_label') : t('liquidations.add_activity_dialog.visits_label');
    const quantityPlaceholder = activityType === 'hourly' ? "Ej: 2.5" : "Ej: 1";
    const rateLabel = activityType === 'hourly' ? t('liquidations.add_activity_dialog.rate_hour_label') : t('liquidations.add_activity_dialog.rate_visit_label');

    const getDialogDescription = () => {
        if (!provider) return '';
        if (provider.billingType === 'hourly_or_visit') return t('liquidations.add_activity_dialog.description_mixed');
        if (provider.billingType === 'hourly') return t('liquidations.add_activity_dialog.description_hourly');
        if (provider.billingType === 'per_visit') return t('liquidations.add_activity_dialog.description_visit');
        return t('liquidations.add_activity_dialog.description_other');
    };

    if (!provider) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent 
              className="sm:max-w-[500px] p-0 overflow-hidden rounded-3xl flex flex-col max-h-[90vh]"
              onPointerDownOutside={(e) => e.preventDefault()}
              onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader className="p-6 bg-background border-b shrink-0">
                    <DialogTitle>{t('liquidations.add_activity_dialog.title').replace('{{name}}', provider.name)}</DialogTitle>
                    <DialogDescription>{getDialogDescription()}</DialogDescription>
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
                            <Select name="assignment" onValueChange={(val) => setSelectedAssignmentId(val.split('-')[1])} required>
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
                                <Input id="quantity" name="quantity" type="number" step="0.5" placeholder={quantityPlaceholder} required className="h-11 bg-background shadow-sm" />
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

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('common.description')}</Label>
                            <Textarea id="description" name="description" placeholder="..." className="bg-background shadow-inner min-h-[100px]" />
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-background border-t shrink-0 flex flex-row items-center justify-end gap-2">
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
