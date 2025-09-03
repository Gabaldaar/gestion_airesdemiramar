
'use client';

import { useActionState, useEffect } from 'react';
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
import { deletePayment } from '@/lib/actions';
import { Trash2 } from 'lucide-react';

const initialState = {
  message: '',
  success: false,
};

export function PaymentDeleteForm({ paymentId, onPaymentDeleted }: { paymentId: string; onPaymentDeleted: () => void }) {
  const [state, formAction] = useActionState(deletePayment, initialState);

  useEffect(() => {
    if (state.success) {
      onPaymentDeleted();
    }
  }, [state, onPaymentDeleted]);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Borrar Pago</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. El pago será eliminado permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={formAction}>
            <input type="hidden" name="id" value={paymentId} />
            <AlertDialogAction asChild>
               <Button type="submit" variant="destructive">Continuar</Button>
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
