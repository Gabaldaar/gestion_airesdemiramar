
'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { deleteProperty } from '@/lib/data';
import { Trash2, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from './ui/use-toast';
import { useRouter } from 'next/navigation';

function DeleteButton({ isDisabled, isPending }: { isDisabled: boolean, isPending: boolean }) {
    return (
        <Button type="button" variant="destructive" disabled={isDisabled || isPending}>
            {isPending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Eliminando...
                </>
            ) : (
                'Entiendo las consecuencias, eliminar esta propiedad'
            )}
        </Button>
    )
}

export function PropertyDeleteForm({ propertyId, propertyName }: { propertyId: string; propertyName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  
  const isButtonDisabled = confirmationInput !== 'Eliminar';

  useEffect(() => {
    if (!isOpen) {
      setConfirmationInput('');
    }
  }, [isOpen]);

  const handleDelete = () => {
    if(isButtonDisabled) return;

    startTransition(async () => {
        try {
            await deleteProperty(propertyId);
            toast({ title: 'Éxito', description: 'Propiedad eliminada.'});
            setIsOpen(false);
            router.push('/settings'); // Redirect to a safe page
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: `No se pudo eliminar la propiedad: ${error.message}`});
        }
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar Propiedad
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta acción es irreversible. Se eliminará permanentemente la propiedad <span className="font-bold">{propertyName}</span> y todos sus datos asociados, incluyendo <span className="font-bold">reservas, pagos y gastos</span>.
                <br/><br/>
                Para confirmar, por favor escribe <strong className='text-foreground'>Eliminar</strong> en el campo de abajo.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-4">
                <Label htmlFor="confirmation" className="sr-only">Confirmación</Label>
                <Input 
                    id="confirmation"
                    name="confirmation"
                    value={confirmationInput}
                    onChange={(e) => setConfirmationInput(e.target.value)}
                    placeholder='Escribe "Eliminar"'
                    autoComplete='off'
                />
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <Button onClick={handleDelete} variant="destructive" disabled={isButtonDisabled || isPending}>
                    {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eliminando...</> : 'Entiendo las consecuencias, eliminar esta propiedad'}
                </Button>
            </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

    