
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
import { deleteTenant } from '@/lib/actions';
import { Trash2 } from 'lucide-react';

const initialState = {
  message: '',
  success: false,
};

export function TenantDeleteForm({ tenantId }: { tenantId: number }) {
  const [state, formAction] = useActionState(deleteTenant, initialState);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Borrar Inquilino</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. El inquilino será eliminado permanentemente. Esto no eliminará sus reservas asociadas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={formAction}>
            <input type="hidden" name="id" value={tenantId} />
            <AlertDialogAction asChild>
               <Button type="submit" variant="destructive">Continuar</Button>
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
