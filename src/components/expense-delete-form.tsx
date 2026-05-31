'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { deleteExpense } from '@/lib/actions';
import { Loader2 } from 'lucide-react';
import { useTranslation } from "@/i18n/useTranslation";
import { useToast } from './ui/use-toast';

const initialState = {
  message: '',
  success: false,
};

function DeleteButton({ isPending }: { isPending: boolean }) {
    const { t } = useTranslation();
    return (
        <Button type="submit" variant="destructive" disabled={isPending}>
            {isPending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}
                </>
            ) : (
                t('common.confirm_delete.confirm')
            )}
        </Button>
    )
}

export function ExpenseDeleteForm({ expenseId, isOpen, onOpenChange, onExpenseDeleted }: { expenseId: string; isOpen: boolean; onOpenChange: (open: boolean) => void; onExpenseDeleted: () => void; }) {
  const { t } = useTranslation();
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      startTransition(async () => {
          const result = await deleteExpense(initialState, formData);
          setState(result);
      });
  }

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? t('common.success') : t('common.error'),
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
      if (state.success) {
        onExpenseDeleted();
        onOpenChange(false);
      }
    }
  }, [state, toast, t, onExpenseDeleted, onOpenChange]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
            <input type="hidden" name="id" value={expenseId} />
            <DialogHeader>
                <DialogTitle>{t('common.confirm_delete.title')}</DialogTitle>
                <DialogDescription>
                    {t('expenses.delete_dialog.description')}
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className='mt-4'>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
                <DeleteButton isPending={isPending} />
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
