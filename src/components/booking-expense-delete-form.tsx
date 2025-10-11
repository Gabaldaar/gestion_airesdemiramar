
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
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
import { deleteBookingExpense } from '@/lib/actions';
import { Trash2, Loader2 } from 'lucide-react';

const initialState = {
  message: '',
  success: false,
};

function DeleteButton() {
    const { pending } = useFormStatus();
    return (
        <AlertDialogAction asChild>
            <Button type="submit" variant="destructive" disabled={pending}>
                {pending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Borrando...
                    </>
                ) : (
                    'Continuar'
                )}
            </Button>
        </AlertDialogAction>
    )
}

export function BookingExpenseDeleteForm({ expenseId, bookingId }: { expenseId: string; bookingId: string }) {
  const [state, formAction] = useActionState(deleteBookingExpense, initialState);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Borrar Gasto</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form action={formAction}>
            <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta acción no se puede deshacer. El gasto será eliminado permanentemente.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <input type="hidden" name="id" value={expenseId} />
            <input type="hidden" name="bookingId" value={bookingId} />
            <AlertDialogFooter className='mt-4'>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <DeleteButton />
            </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
