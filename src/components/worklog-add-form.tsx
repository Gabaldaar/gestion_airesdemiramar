'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from './ui/date-picker';
import { Textarea } from './ui/textarea';
import { Loader2 } from 'lucide-react';
import { addWorkLog } from '@/lib/actions';
import { Provider, Property } from '@/lib/data';
import { useToast } from './ui/use-toast';

const initialState = { success: false, message: '' };

export function WorkLogAddForm({ provider, properties, isOpen, onOpenChange, onActionComplete }: {
    provider: Provider;
    properties: Property[];
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
            const result = await addWorkLog(initialState, formData);
            setState(result);
        });
    };

    useEffect(() => {
        if (state.message) {
            toast({
                title: state.success ? 'Éxito' : 'Error',
                description: state.message,
                variant: state.success ? 'default' : 'destructive'
            });
        }
        if (state.success) {
            onOpenChange(false);
            onActionComplete();
        }
    }, [state, onOpenChange, onActionComplete, toast]);
    
    useEffect(() => {
        if (isOpen) {
            formRef.current?.reset();
            setDate(new Date());
            setState(initialState);
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registrar Actividad para {provider.name}</DialogTitle>
                    <DialogDescription>Añade las horas trabajadas o las visitas realizadas.</DialogDescription>
                </DialogHeader>
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                    <input type="hidden" name="providerId" value={provider.id} />
                    <input type="hidden" name="date" value={date?.toISOString() || ''} />
                    
                    <div className="space-y-2">
                        <Label>Fecha</Label>
                        <DatePicker date={date} onDateSelect={setDate} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="propertyId">Propiedad</Label>
                        <Select name="propertyId" required>
                            <SelectTrigger><SelectValue placeholder="Selecciona una propiedad" /></SelectTrigger>
                            <SelectContent>
                                {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="activityType">Tipo de Actividad</Label>
                        <Select name="activityType" defaultValue="hourly" required>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="hourly">Horas Trabajadas</SelectItem>
                                <SelectItem value="per_visit">Visita</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="quantity">Cantidad</Label>
                        <Input id="quantity" name="quantity" type="number" step="0.5" placeholder="Ej: 2.5 (para horas)" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea id="description" name="description" placeholder="Ej: Limpieza de salida" required />
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
