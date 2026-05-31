'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { deleteTask } from '@/lib/actions';
import { TaskWithDetails } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { useTranslation } from '@/i18n/useTranslation';

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

export function TaskDeleteForm({ task, isOpen, onOpenChange, onTaskDeleted }: { task: TaskWithDetails; isOpen: boolean; onOpenChange: (open: boolean) => void; onTaskDeleted: () => void; }) {
  const { t } = useTranslation();
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
        const result = await deleteTask(initialState, formData);
        setState(result);
    });
  }

  useEffect(() => {
    if (state.message) {
        toast({
            title: state.success ? t('common.success') : t('common.error'),
            description: state.message,
            variant: state.success ? "default" : "destructive",
        });
        if (state.success) {
            onTaskDeleted();
            onOpenChange(false);
        }
    }
  }, [state, onTaskDeleted, onOpenChange, toast, t]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <form onSubmit={handleSubmit}>
            <input type="hidden" name="id" value={task.id} />
            <input type="hidden" name="propertyId" value={task.assignment?.type === 'property' ? task.assignment.id : ''} />
            <AlertDialogHeader>
                <AlertDialogTitle>{t('common.confirm_delete.title')}</AlertDialogTitle>
                <AlertDialogDescription>
                    {t('tasks.delete_dialog.description').replace('{{description}}', task.description)}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
                <AlertDialogCancel type="button" onClick={() => onOpenChange(false)}>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction asChild>
                    <DeleteButton isPending={isPending} />
                </AlertDialogAction>
            </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
