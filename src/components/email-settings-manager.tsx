
'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { EmailSettings } from '@/lib/data';
import { updateEmailSettings } from '@/lib/actions';
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

export function EmailSettingsManager({ initialSettings }: { initialSettings: EmailSettings | null }) {
    const [state, formAction] = useActionState(updateEmailSettings, initialState);
    const [replyToEmail, setReplyToEmail] = useState(initialSettings?.replyToEmail || '');
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
        <form action={formAction} className="space-y-4 max-w-md">
            <div className="space-y-2">
                <Label htmlFor="replyToEmail">Email de Respuesta</Label>
                <p className="text-sm text-muted-foreground">
                    Cuando envíes un correo desde la aplicación, las respuestas de los inquilinos llegarán a esta dirección.
                </p>
                <Input 
                    id="replyToEmail" 
                    name="replyToEmail" 
                    type="email"
                    value={replyToEmail}
                    onChange={(e) => setReplyToEmail(e.target.value)}
                    placeholder="tu@email.com" 
                />
            </div>
            <SubmitButton />
        </form>
    );
}
