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
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { deleteBooking } from '@/lib/actions';
import { Trash2, Loader2 } from 'lucide-react';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';


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
                    Eliminando...
                </>
            ) : (
                'Sí, eliminar esta reserva'
            )}
        </Button>
    )
}

interface BookingDeleteFormProps {
    bookingId: string;
    propertyId: string;
    children?: ReactNode;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function BookingDeleteForm({ bookingId, propertyId, children, isOpen, onOpenChange }: BookingDeleteFormProps) {
  const [state, formAction] = useActionState(deleteBooking, initialState);
  const [isChecked, setIsChecked] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
    }
  }, [state.success, onOpenChange]);
  
  useEffect(() => {
    if (!isOpen) {
        setIsChecked(false);
    }
  }, [isOpen])


  return (
    <>
      {children}
      <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <form action={formAction} ref={formRef}>
              <input type="hidden" name="id" value={bookingId} />
              <input type="hidden" name="propertyId" value={propertyId} />
              <AlertDialogHeader>
              <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                  Esta acción es irreversible. Se eliminará permanentemente la reserva, junto con sus pagos y gastos asociados.
              </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="my-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="confirm-delete" onCheckedChange={(checked) => setIsChecked(!!checked)} checked={isChecked} />
                    <Label htmlFor="confirm-delete" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Sí, entiendo que esta acción es irreversible.
                    </Label>
                  </div>
                  {state.message && !state.success && (
                      <p className="text-red-500 text-sm mt-2">{state.message}</p>
                  )}
              </div>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setIsChecked(false)}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <DeleteButton isDisabled={!isChecked} />
                  </AlertDialogAction>
              </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
