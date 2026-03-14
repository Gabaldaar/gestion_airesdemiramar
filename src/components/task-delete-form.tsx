

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
                    Eliminando...
                </>
            ) : (
                'Sí, eliminar tarea'
            )}
        </Button>
    )
}

interface TaskDeleteFormProps {
    task: TaskWithDetails;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onTaskDeleted: () => void;
}

export function TaskDeleteForm({ task, isOpen, onOpenChange, onTaskDeleted }: TaskDeleteFormProps) {
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
    if (state.success) {
      onOpenChange(false);
      onTaskDeleted();
      toast({ title: 'Éxito', description: state.message });
    } else if(state.message) {
      toast({ title: 'Error', description: state.message, variant: 'destructive' });
    }
  }, [state, onOpenChange, onTaskDeleted, toast]);
  

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <form onSubmit={handleSubmit}>
            <input type="hidden" name="id" value={task.id} />
            <input type="hidden" name="propertyId" value={task.propertyId} />
            <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta acción es irreversible. Se eliminará permanentemente la tarea: <span className="font-bold">"{task.description}"</span>.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction asChild>
                    <DeleteButton isPending={isPending} />
                </AlertDialogAction>
            </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
