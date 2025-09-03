
'use client';

import { useActionState } from 'react';
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
import { deletePropertyExpense } from '@/lib/actions';
import { Trash2 } from 'lucide-react';

const initialState = {
  message: '',
  success: false,
};

export function ExpenseDeleteForm({ expenseId, propertyId }: { expenseId: string; propertyId: string }) {
  const [state, formAction] = useActionState(deletePropertyExpense, initialState);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Borrar Gasto</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. El gasto será eliminado permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={formAction}>
            <input type="hidden" name="id" value={expenseId} />
            <input type="hidden" name="propertyId" value={propertyId} />
            <AlertDialogAction asChild>
               <Button type="submit" variant="destructive">Continuar</Button>
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
