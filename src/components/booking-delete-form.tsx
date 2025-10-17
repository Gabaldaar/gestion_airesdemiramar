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
import { Input } from './ui/input';
import { Label } from './ui/label';

const initialState = {
  message: '',
  success: false,
};

function DeleteButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" variant="destructive" disabled={pending}>
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
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
    }
  }, [state.success, onOpenChange]);


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
              <div className="my-4">
                  {state.message && !state.success && (
                      <p className="text-red-500 text-sm mt-2">{state.message}</p>
                  )}
              </div>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <DeleteButton />
                  </AlertDialogAction>
              </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
