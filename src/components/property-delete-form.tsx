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

function DeleteButton({ isDisabled }: { isDisabled: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" variant="destructive" disabled={isDisabled || pending}>
            {pending ? (
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

export function PropertyDeleteForm({ propertyId, propertyName, onPropertyDeleted }: { propertyId: string; propertyName: string, onPropertyDeleted: () => void }) {
  const [state, formAction] = useActionState(deleteProperty, initialState);
  const [isOpen, setIsOpen] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  
  const isButtonDisabled = confirmationInput !== 'Eliminar';

  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
      onPropertyDeleted();
    }
  }, [state, onPropertyDeleted]);

  useEffect(() => {
    if (!isOpen) {
      setConfirmationInput('');
    }
  }, [isOpen]);

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
                 {state.message && !state.success && (
                    <p className="text-red-500 text-sm mt-2">{state.message}</p>
                )}
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <DeleteButton isDisabled={isButtonDisabled} />
            </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
