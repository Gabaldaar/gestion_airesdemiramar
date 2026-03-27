
'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { deleteDateBlock } from '@/lib/actions';
import { Trash2, Loader2 } from 'lucide-react';
import { useToast } from './ui/use-toast';

const initialState = { message: '', success: false };

function DeleteButton({ isPending }: { isPending: boolean }) {
    return (
        <Button type="submit" variant="destructive" disabled={isPending}>
            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eliminando...</> : 'Sí, eliminar'}
        </Button>
    )
}

interface DateBlockDeleteFormProps {
    blockId: string;
    propertyId: string;
    onBlockDeleted: () => void;
}

export function DateBlockDeleteForm({ blockId, propertyId, onBlockDeleted }: DateBlockDeleteFormProps) {
    const [state, setState] = useState(initialState);
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            const result = await deleteDateBlock(initialState, formData);
            setState(result);
        });
    }

    useEffect(() => {
        if (state.message) {
            toast({
                title: state.success ? "Éxito" : "Error",
                description: state.message,
                variant: state.success ? "default" : "destructive",
            });
        }
        if (state.success) {
            setIsOpen(false);
            onBlockDeleted();
        }
    }, [state, onBlockDeleted, toast]);

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <form onSubmit={handleSubmit}>
                    <input type="hidden" name="id" value={blockId} />
                    <input type="hidden" name="propertyId" value={propertyId} />
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción es irreversible. Se eliminará permanentemente este bloqueo de fechas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <DeleteButton isPending={isPending} />
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}
