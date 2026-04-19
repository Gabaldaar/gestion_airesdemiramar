

'use client';

import { useEffect, useRef, useState, useTransition, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';
import { DatePicker } from './ui/date-picker';
import { Textarea } from './ui/textarea';
import { Loader2, RefreshCw } from 'lucide-react';
import { addManualAdjustment } from '@/lib/actions';
import { Provider, Property, TaskScope, AdjustmentCategory, getAdjustmentCategories } from '@/lib/data';
import { useToast } from './ui/use-toast';

const initialState = { success: false, message: '' };

export function ManualAdjustmentAddForm({ provider, properties, scopes, isOpen, onOpenChange, onActionComplete }: {
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
    const [categories, setCategories] = useState<AdjustmentCategory[]>([]);
    const formRef = useRef<HTMLFormElement>(null);
    const { toast } = useToast();

    const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
    const [exchangeRate, setExchangeRate] = useState('');
    const [isFetchingRate, setIsFetchingRate] = useState(false);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            const result = await addManualAdjustment(initialState, formData);
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
            toast({
                title: 'Error',
                description: 'No se pudo obtener el valor del dólar.',
                variant: 'destructive',
            });
        } finally {
            setIsFetchingRate(false);
        }
    };

    const handleCurrencyChange = (value: string) => {
        const newCurrency = value as 'ARS' | 'USD';
        setCurrency(newCurrency);
        if (newCurrency === 'ARS') {
            setExchangeRate('');
        }
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
            getAdjustmentCategories().then(setCategories);
            formRef.current?.reset();
            setDate(new Date());
            setState(initialState);
            setCurrency('ARS');
            setExchangeRate('');
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registrar Ajuste Manual para {provider.name}</DialogTitle>
                    <DialogDescription>Añade un bono, reintegro, adelanto u otro concepto.</DialogDescription>
                </DialogHeader>
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                    <input type="hidden" name="providerId" value={provider.id} />
                    <input type="hidden" name="date" value={date?.toISOString() || ''} />
                    
                    <div className="space-y-2">
                        <Label>Fecha</Label>
                        <DatePicker date={date} onDateSelect={setDate} />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="categoryId">Categoría del Ajuste</Label>
                        <Select name="categoryId" required>
                             <SelectTrigger><SelectValue placeholder="Selecciona una categoría..."/></SelectTrigger>
                             <SelectContent>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name} ({cat.type === 'addition' ? 'Suma' : 'Resta'})</SelectItem>
                                ))}
                             </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Monto</Label>
                            <Input id="amount" name="amount" type="number" step="0.01" placeholder="Monto en positivo" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="currency">Moneda</Label>
                             <Select name="currency" value={currency} onValueChange={handleCurrencyChange} required>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ARS">ARS</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                     {currency === 'USD' && (
                        <div className="space-y-2">
                            <Label htmlFor="exchangeRate">Valor USD (para registrar el gasto en ARS)</Label>
                            <div className="flex items-center gap-2">
                                <Input 
                                    id="exchangeRate" 
                                    name="exchangeRate" 
                                    type="number" 
                                    step="0.01" 
                                    placeholder="Valor del USD en ARS" 
                                    required 
                                    value={exchangeRate} 
                                    onChange={(e) => setExchangeRate(e.target.value)} 
                                />
                                <Button type="button" variant="outline" size="icon" onClick={fetchRate} disabled={isFetchingRate}>
                                    {isFetchingRate ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="assignment">Imputar a</Label>
                         <Select name="assignment" required>
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
                    
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas (Opcional)</Label>
                        <Textarea id="notes" name="notes" placeholder="Ej: Detalle de gasto reintegrado, motivo del bono..." />
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
