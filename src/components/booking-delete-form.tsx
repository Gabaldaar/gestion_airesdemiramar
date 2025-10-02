
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
import { deleteBooking } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from './ui/use-toast';

function DeleteButton({ isDisabled, isPending }: { isDisabled: boolean, isPending: boolean }) {
    return (
        <Button type="button" variant="destructive" disabled={isDisabled || isPending}>
            {isPending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Borrando...
                </>
            ) : (
                'Entiendo, eliminar esta reserva'
            )}
        </Button>
    )
}

interface BookingDeleteFormProps {
    bookingId: string;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function BookingDeleteForm({ bookingId, isOpen, onOpenChange }: BookingDeleteFormProps) {
  const [confirmationInput, setConfirmationInput] = useState('');
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const isButtonDisabled = confirmationInput !== 'Eliminar';

  const handleCancel = () => {
    onOpenChange(false);
    setConfirmationInput('');
  }

  const handleDelete = () => {
    if (isButtonDisabled) return;

    startTransition(async () => {
        try {
            await deleteBooking(bookingId);
            toast({ title: "Éxito", description: "Reserva eliminada correctamente." });
            onOpenChange(false);
            window.location.reload();
        } catch (error: any) {
            console.error("Error deleting booking:", error);
            toast({ variant: "destructive", title: "Error", description: `No se pudo eliminar la reserva: ${error.message}` });
        }
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
        <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
        <AlertDialogDescription>
            Esta acción es irreversible. Se eliminará permanentemente la reserva, junto con sus pagos y gastos asociados.
            <br/><br/>
            Para confirmar, por favor escribe <strong className='text-foreground'>Eliminar</strong> en el campo de abajo.
        </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-4">
            <Label htmlFor="confirmation" className="sr-only">Confirmación</Label>
            <Input 
                id="confirmation"
                name="confirmation"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder='Escribe "Eliminar"'
                autoComplete='off'
            />
        </div>
        <AlertDialogFooter>
            <Button variant="outline" onClick={handleCancel}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isButtonDisabled || isPending}>
                {isPending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Borrando...
                    </>
                ) : (
                    'Entiendo, eliminar esta reserva'
                )}
            </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

    