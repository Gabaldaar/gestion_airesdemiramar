
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { deleteProvider } from '@/lib/actions';
import { Trash2, Loader2 } from 'lucide-react';
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
                    Borrando...
                </>
            ) : (
                'Continuar'
            )}
        </Button>
    )
}

export function ProviderDeleteForm({ providerId, onProviderDeleted }: { providerId: string; onProviderDeleted: () => void; }) {
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
        const result = await deleteProvider(initialState, formData);
        setState(result);
    });
  }
  
  useEffect(() => {
    if (state.message) {
        toast({
            title: state.success ? "Éxito" : "Error",
            description: state.message,
            variant: state.success ? "default" : "destructive",
        })
    }
    if (state.success) {
      onProviderDeleted();
    }
  }, [state, onProviderDeleted, toast]);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Borrar Proveedor</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. El proveedor será eliminado permanentemente. Esto no eliminará las tareas o gastos asociados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form onSubmit={handleSubmit}>
            <input type="hidden" name="id" value={providerId} />
            <AlertDialogAction asChild>
               <DeleteButton isPending={isPending} />
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
         {state.message && !state.success && (
            <p className="text-red-500 text-sm mt-2">{state.message}</p>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
