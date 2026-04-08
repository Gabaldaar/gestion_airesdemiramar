
'use client';

import { useEffect, useRef, useState, useTransition, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';
import { DatePicker } from './ui/date-picker';
import { Textarea } from './ui/textarea';
import { Loader2 } from 'lucide-react';
import { addWorkLog } from '@/lib/actions';
import { Provider, Property, TaskScope } from '@/lib/data';
import { useToast } from './ui/use-toast';

const initialState = { success: false, message: '' };

export function WorkLogAddForm({ provider, properties, scopes, isOpen, onOpenChange, onActionComplete }: {
    provider: Provider;
    properties: Property[];
    scopes: TaskScope[];
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onActionComplete: () => void;
}) {
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
                title: state.success ? 'Éxito' : 'Error',
                description: state.message,
                variant: state.success ? 'default' : 'destructive',
                duration: state.success ? 3000 : 5000,
            });
            if (state.success) {
                onActionComplete();
                onOpenChange(false);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state]);
    
    useEffect(() => {
        if (isOpen) {
            formRef.current?.reset();
            setDate(new Date());
            setState(initialState);
            setRate(''); // Reset rate
            setSelectedAssignmentId(null);

            if (provider.billingType === 'hourly') {
                setActivityType('hourly');
                setRate(provider.hourlyRate || '');
            } else if (provider.billingType === 'per_visit') {
                setActivityType('per_visit');
                setRate(provider.perVisitRate || '');
            } else { // 'hourly_or_visit' or 'other'
                setActivityType('hourly'); // Default to hourly
                setRate(provider.hourlyRate || '');
            }
        }
    }, [isOpen, provider]);

    useEffect(() => {
        let newRate: number | '' = '';
        const isVisit = activityType === 'per_visit';

        if (isVisit && selectedAssignmentId) {
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
    const quantityLabel = activityType === 'hourly' ? "Cantidad de Horas" : "Cantidad de Visitas";
    const quantityPlaceholder = activityType === 'hourly' ? "Ej: 2.5" : "Ej: 1";
    const rateLabel = activityType === 'hourly' ? "Monto por Hora" : "Monto por Visita";

    const dialogDescription =
        provider.billingType === 'hourly_or_visit'
            ? 'Añade las horas trabajadas o las visitas realizadas.'
            : provider.billingType === 'hourly'
            ? 'Añade las horas trabajadas.'
            : provider.billingType === 'per_visit'
            ? 'Añade las visitas realizadas.'
            : 'Registra tu actividad.';

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registrar Actividad para {provider.name}</DialogTitle>
                    <DialogDescription>{dialogDescription}</DialogDescription>
                </DialogHeader>
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                    <input type="hidden" name="providerId" value={provider.id} />
                    <input type="hidden" name="date" value={date?.toISOString() || ''} />
                    
                    <div className="space-y-2">
                        <Label>Fecha</Label>
                        <DatePicker date={date} onDateSelect={setDate} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="assignment">Imputar a</Label>
                        <Select name="assignment" onValueChange={(val) => setSelectedAssignmentId(val.split('-')[1])} required>
                            <SelectTrigger><SelectValue placeholder="Selecciona Propiedad o Ámbito..."/></SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <Label>Propiedades</Label>
                                    {properties.map(p => <SelectItem key={p.id} value={`property-${p.id}`}>{p.name}</SelectItem>)}
                                </SelectGroup>
                                {provider.billingType !== 'per_visit' && (
                                    <SelectGroup>
                                        <Label>Ámbitos</Label>
                                        {scopes.map(s => <SelectItem key={s.id} value={`scope-${s.id}`}>{s.name}</SelectItem>)}
                                    </SelectGroup>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    {showActivityTypeSelect ? (
                        <div className="space-y-2">
                            <Label htmlFor="activityType">Tipo de Actividad</Label>
                            <Select name="activityType" value={activityType} onValueChange={(v) => setActivityType(v as 'hourly' | 'per_visit')} required>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hourly">Horas Trabajadas</SelectItem>
                                    <SelectItem value="per_visit">Visita</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                        <input type="hidden" name="activityType" value={activityType} />
                    )}

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="quantity">{quantityLabel}</Label>
                            <Input id="quantity" name="quantity" type="number" step="0.5" placeholder={quantityPlaceholder} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rate">{rateLabel}</Label>
                            <Input id="rate" name="rate" type="number" step="0.01" value={rate} readOnly className="bg-muted/50" required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea id="description" name="description" placeholder="Ej: Limpieza de salida, check-in familia Pérez" required />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Registrar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
