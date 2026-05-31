'use client';

import { useState, useTransition } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { deleteContrato } from '@/lib/actions';
import { ContratoWithDetails } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { Label } from './ui/label';
import { Input } from './ui/input';

const initialState = { success: false, message: '' };

export function ContratoDeleteForm({ contrato, isOpen, onOpenChange, onActionComplete }: {
    contrato: ContratoWithDetails;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onActionComplete: () => void;
}) {
    const [isPending, startTransition] = useTransition();
    const [state, setState] = useState(initialState);
    const { toast } = useToast();
    const [confirmationText, setConfirmationText] = useState('');
    const CONFIRMATION_WORD = "ELIMINAR";

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        
        startTransition(async () => {
            const result = await deleteContrato(initialState, formData);
            if (result.success) {
                toast({ title: "Éxito", description: "Contrato y datos asociados eliminados." });
                onActionComplete();
                onOpenChange(false);
            } else {
                toast({ title: "Error", description: result.message, variant: 'destructive' });
            }
        });
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción es irreversible. Se eliminará el contrato de <span className="font-semibold">{contrato.tenantName}</span>, junto con todas sus cuotas mensuales y los pagos registrados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    <input type="hidden" name="id" value={contrato.id} />

                    <div className="space-y-2">
                        <Label htmlFor="confirmation" className="font-semibold text-destructive">
                            Para confirmar, escribe "{CONFIRMATION_WORD}" abajo.
                        </Label>
                        <Input
                            id="confirmation"
                            value={confirmationText}
                            onChange={(e) => setConfirmationText(e.target.value)}
                            autoComplete="off"
                        />
                    </div>

                    <AlertDialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancelar</Button>
                        <Button type="submit" variant="destructive" disabled={isPending || confirmationText !== CONFIRMATION_WORD}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Eliminar Contrato
                        </Button>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}
