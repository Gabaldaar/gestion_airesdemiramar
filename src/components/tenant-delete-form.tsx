
'use client';

import { useTransition } from 'react';
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
import { deleteTenant } from '@/lib/data';
import { Trash2, Loader2 } from 'lucide-react';
import { useToast } from './ui/use-toast';

function DeleteButton({ isPending }: { isPending: boolean }) {
    return (
        <Button type="button" variant="destructive" disabled={isPending}>
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

export function TenantDeleteForm({ tenantId, onTenantDeleted }: { tenantId: string; onTenantDeleted: () => void; }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleDelete = () => {
    startTransition(async () => {
        try {
            await deleteTenant(tenantId);
            toast({ title: 'Éxito', description: 'Inquilino eliminado.' });
            onTenantDeleted();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: `No se pudo eliminar el inquilino: ${error.message}`});
        }
    });
  }

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
          <AlertDialogAction onClick={handleDelete} asChild>
               <DeleteButton isPending={isPending} />
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

    