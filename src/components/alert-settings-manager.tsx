
'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { AlertSettings } from '@/lib/data';
import { updateAlertSettings } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from './ui/use-toast';

const initialState = {
  message: '',
  success: false,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                </>
            ) : (
                'Guardar Cambios'
            )}
        </Button>
    )
}

export function AlertSettingsManager({ initialSettings }: { initialSettings: AlertSettings | null }) {
    const [state, formAction] = useActionState(updateAlertSettings, initialState);
    const [checkInDays, setCheckInDays] = useState(initialSettings?.checkInDays ?? 7);
    const [checkOutDays, setCheckOutDays] = useState(initialSettings?.checkOutDays ?? 3);
    const { toast } = useToast();

    useEffect(() => {
        if (state.message) {
            toast({
                title: state.success ? 'Éxito' : 'Error',
                description: state.message,
                variant: state.success ? 'default' : 'destructive',
            });
        }
    }, [state, toast]);

    return (
        <form action={formAction} className="space-y-6 max-w-md">
            <div className="space-y-2">
                <Label htmlFor="checkInDays">Días de aviso para Check-in</Label>
                <p className="text-sm text-muted-foreground">
                    Mostrar una alerta en el dashboard cuando un check-in esté a esta cantidad de días (o menos).
                </p>
                <Input 
                    id="checkInDays" 
                    name="checkInDays" 
                    type="number"
                    value={checkInDays}
                    onChange={(e) => setCheckInDays(Number(e.target.value))}
                    placeholder="Ej: 7" 
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="checkOutDays">Días de aviso para Check-out</Label>
                 <p className="text-sm text-muted-foreground">
                    Mostrar una alerta cuando un check-out esté a esta cantidad de días (o menos).
                </p>
                <Input 
                    id="checkOutDays" 
                    name="checkOutDays" 
                    type="number"
                    value={checkOutDays}
                    onChange={(e) => setCheckOutDays(Number(e.target.value))}
                    placeholder="Ej: 3" 
                />
            </div>
            <SubmitButton />
        </form>
    );
}
