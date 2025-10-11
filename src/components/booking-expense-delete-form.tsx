'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
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
    )
}

export function BookingExpenseDeleteForm({ expenseId, bookingId }: { expenseId: string; bookingId: string }) {
  const [state, formAction] = useActionState(deleteBookingExpense, initialState);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
      window.location.reload(); // Simple reload to reflect changes
    }
  }, [state.success]);


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Borrar Gasto</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={formAction}>
            <input type="hidden" name="id" value={expenseId} />
            <input type="hidden" name="bookingId" value={bookingId} />
            <DialogHeader>
                <DialogTitle>¿Estás seguro?</DialogTitle>
                <DialogDescription>
                    Esta acción no se puede deshacer. El gasto será eliminado permanentemente.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className='mt-4'>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <DeleteButton />
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
