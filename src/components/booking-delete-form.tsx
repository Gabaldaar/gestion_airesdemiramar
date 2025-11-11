
'use client';

import { useEffect, useRef, useState, ReactNode, useTransition } from 'react';
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

function DeleteButton({ isDisabled, isPending }: { isDisabled: boolean, isPending: boolean }) {
    return (
        <Button type="submit" variant="destructive" disabled={isDisabled || isPending}>
            {isPending ? (
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
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const [isChecked, setIsChecked] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
        const result = await deleteBooking(initialState, formData);
        setState(result);
    });
  }

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
    }
  }, [state.success, onOpenChange]);
  
  useEffect(() => {
    if (!isOpen) {
        setIsChecked(false);
        setState(initialState);
    }
  }, [isOpen])


  return (
    <>
      {children}
      <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <form onSubmit={handleSubmit} ref={formRef}>
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
                  <AlertDialogCancel onClick={() => { setIsChecked(false); setState(initialState); }}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <DeleteButton isDisabled={!isChecked} isPending={isPending} />
                  </AlertDialogAction>
              </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
