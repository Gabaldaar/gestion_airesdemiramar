
'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
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
import { deletePropertyExpense } from '@/lib/actions';
import { Trash2, Loader2 } from 'lucide-react';

const initialState = {
  message: '',
  success: false,
};

function DeleteButton({ isPending }: { isPending: boolean }) {
    return (
        <Button type="submit" variant="destructive" disabled={isPending}>
            {isPending ? (
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

export function ExpenseDeleteForm({ expenseId, onExpenseDeleted }: { expenseId: string; onExpenseDeleted: () => void; }) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();

  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await deletePropertyExpense(state, formData);
        setState(result);
    });
  }

  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
      onExpenseDeleted();
    }
  }, [state, onExpenseDeleted]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      formAction(formData);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Borrar Gasto</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
            <input type="hidden" name="id" value={expenseId} />
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
                <DeleteButton isPending={isPending} />
            </DialogFooter>
             {state.message && !state.success && (
                <p className="text-red-500 text-sm mt-2">{state.message}</p>
            )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
