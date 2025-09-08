'use client';

import { useActionState, useState, useEffect, useRef, ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { deleteBooking } from '@/lib/actions';
import { Trash2, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';

const initialState = {
  message: '',
  success: false,
};

function DeleteButton({ isDisabled }: { isDisabled: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" variant="destructive" disabled={isDisabled || pending}>
            {pending ? (
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
    propertyId: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: ReactNode;
}

export function BookingDeleteForm({ bookingId, propertyId, open, onOpenChange, children }: BookingDeleteFormProps) {
  const [state, formAction] = useActionState(deleteBooking, initialState);
  const [confirmationInput, setConfirmationInput] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const isControlled = open !== undefined && onOpenChange !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isControlled ? open : internalOpen;
  
  const setIsOpen = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };
  
  const isButtonDisabled = confirmationInput !== 'Eliminar';

  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
    }
  }, [state.success, setIsOpen]);

  useEffect(() => {
    if (!isOpen) {
      setConfirmationInput('');
    }
  }, [isOpen]);

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form action={formAction} ref={formRef}>
            <input type="hidden" name="id" value={bookingId} />
            <input type="hidden" name="propertyId" value={propertyId} />
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
                 {state.message && !state.success && (
                    <p className="text-red-500 text-sm mt-2">{state.message}</p>
                )}
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <DeleteButton isDisabled={isButtonDisabled} />
            </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
