'use client';

import { useActionState, useState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { deleteProperty } from '@/lib/actions';
import { Trash2, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';

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
                    Eliminando...
                </>
            ) : (
                'Entiendo, eliminar esta propiedad'
            )}
        </Button>
    )
}

export function PropertyDeleteForm({ propertyId, propertyName }: { propertyId: string; propertyName: string }) {
  const [state, formAction] = useActionState(deleteProperty, initialState);
  const [isOpen, setIsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // If the deletion was successful, close the dialog
    if (state.success) {
      setIsOpen(false);
    }
  }, [state.success]);

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar Propiedad
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form action={formAction} ref={formRef}>
            <input type="hidden" name="id" value={propertyId} />
            <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta acción es irreversible. Se eliminará permanentemente la propiedad <span className="font-bold">{propertyName}</span> y todos sus datos asociados, incluyendo <span className="font-bold">reservas, pagos y gastos</span>.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-4">
                 {state.message && !state.success && (
                    <p className="text-red-500 text-sm mt-2">{state.message}</p>
                )}
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction asChild>
                    <DeleteButton />
                </AlertDialogAction>
            </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
