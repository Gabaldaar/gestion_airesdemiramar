'use client';

import { useEffect, useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from './ui/textarea';
import { Loader2, Pencil } from 'lucide-react';
import { updateProviderAdminNote } from '@/lib/actions';
import { Provider } from '@/lib/data';
import { useToast } from './ui/use-toast';

const initialState = { success: false, message: '' };

export function ProviderAdminNoteEditor({ provider, onActionComplete }: {
    provider: Provider;
    onActionComplete: () => void;
}) {
    const [state, setState] = useState(initialState);
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    const [note, setNote] = useState('');

    useEffect(() => {
        if (isOpen) {
            setNote(provider.adminNote || '');
            setState(initialState);
        }
    }, [isOpen, provider]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            const result = await updateProviderAdminNote(initialState, formData);
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
            onActionComplete();
            setIsOpen(false);
        }
    }, [state, onActionComplete, toast]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar Nota</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Nota para {provider.name}</DialogTitle>
                    <DialogDescription>
                        Esta nota es visible por el colaborador en su panel.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <input type="hidden" name="id" value={provider.id} />
                    <div className="py-4">
                        <Label htmlFor="adminNote">Nota</Label>
                        <Textarea
                            id="adminNote"
                            name="adminNote"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="mt-2 min-h-[120px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Nota
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
