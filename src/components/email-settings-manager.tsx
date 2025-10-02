
'use client';

import { useEffect, useState, useTransition } from 'react';
import { EmailSettings } from '@/lib/data';
import { updateEmailSettings } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from './ui/use-toast';

function SubmitButton({ isPending }: { isPending: boolean }) {
    return (
        <Button type="submit" disabled={isPending}>
            {isPending ? (
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
    const [replyToEmail, setReplyToEmail] = useState(initialSettings?.replyToEmail || '');
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const settings: Omit<EmailSettings, 'id'> = {
            replyToEmail: formData.get('replyToEmail') as string
        };

        startTransition(async () => {
            try {
                await updateEmailSettings(settings);
                toast({
                    title: 'Éxito',
                    description: 'Configuración de email guardada.',
                });
            } catch (error: any) {
                toast({
                    title: 'Error',
                    description: `No se pudo guardar la configuración: ${error.message}`,
                    variant: 'destructive',
                });
            }
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
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
            <SubmitButton isPending={isPending} />
        </form>
    );
}

    