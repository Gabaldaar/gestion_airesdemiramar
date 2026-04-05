
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
import { updateManualAdjustment } from '@/lib/actions';
import { Provider, Property, TaskScope, ManualAdjustment } from '@/lib/data';
import { useToast } from './ui/use-toast';
import { parseDateSafely } from '@/lib/utils';

const initialState = { success: false, message: '' };

export function ManualAdjustmentEditForm({ provider, properties, scopes, adjustment, isOpen, onOpenChange, onActionComplete }: {
    provider: Provider;
    properties: Property[];
    scopes: TaskScope[];
    adjustment: ManualAdjustment;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onActionComplete: () => void;
}) {
    const [state, setState] = useState(initialState);
    const [isPending, startTransition] = useTransition();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const formRef = useRef<HTMLFormElement>(null);
    const { toast } = useToast();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            const result = await updateManualAdjustment(initialState, formData);
            setState(result);
        });
    };

    useEffect(() => {
        if (state.message) {
            toast({
                title: state.success ? 'Éxito' : 'Error',
                description: state.message,
                variant: state.success ? 'default' : 'destructive',
                duration: 3000,
            });
            if (state.success) {
                onActionComplete();
                onOpenChange(false);
            }
        }
    }, [state, onActionComplete, onOpenChange, toast]);
    
    useEffect(() => {
        if (isOpen) {
            setDate(parseDateSafely(adjustment.date));
            setState(initialState);
        }
    }, [isOpen, adjustment]);

    const defaultAssignmentValue = `${adjustment.assignment.type}-${adjustment.assignment.id}`;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Ajuste Manual para {provider.name}</DialogTitle>
                    <DialogDescription>Modifica los datos del ajuste.</DialogDescription>
                </DialogHeader>
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                    <input type="hidden" name="id" value={adjustment.id} />
                    <input type="hidden" name="providerId" value={provider.id} />
                    <input type="hidden" name="date" value={date?.toISOString() || ''} />
                    
                    <div className="space-y-2">
                        <Label>Fecha</Label>
                        <DatePicker date={date} onDateSelect={setDate} />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea id="description" name="description" defaultValue={adjustment.description} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Monto</Label>
                            <Input id="amount" name="amount" type="number" step="0.01" defaultValue={adjustment.amount} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="currency">Moneda</Label>
                             <Select name="currency" defaultValue={adjustment.currency} required>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ARS">ARS</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="assignment">Imputar a</Label>
                        <Select name="assignment" defaultValue={defaultAssignmentValue} required>
                            <SelectTrigger><SelectValue placeholder="Selecciona Propiedad o Ámbito..."/></SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <Label>Propiedades</Label>
                                    {properties.map(p => <SelectItem key={p.id} value={`property-${p.id}`}>{p.name}</SelectItem>)}
                                </SelectGroup>
                                <SelectGroup>
                                    <Label>Ámbitos</Label>
                                    {scopes.map(s => <SelectItem key={s.id} value={`scope-${s.id}`}>{s.name}</SelectItem>)}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
