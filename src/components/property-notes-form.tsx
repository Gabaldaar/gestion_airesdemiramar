
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { updateProperty } from '@/lib/actions';
import { Property } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { NotebookPen, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from './ui/textarea';

const initialState = {
  message: '',
  success: false,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                </>
            ) : (
                'Guardar Notas'
            )}
        </Button>
    )
}

export function PropertyNotesForm({ property }: { property: Property }) {
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const formId = `property-notes-form-${property.id}`;
  const [isOpen, setIsOpen] = useState(false);

  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await updateProperty(initialState, formData);
        setState(result);
    });
  };

  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <NotebookPen className="mr-2 h-4 w-4" />
          Notas
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notas de la Propiedad</DialogTitle>
          <DialogDescription>
            Añade o edita las notas. Los cambios se guardarán al presionar el botón de Guardar.
          </DialogDescription>
        </DialogHeader>
        <form id={formId} action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={property.id} />
          {/* Pass all existing property data to avoid accidental deletion */}
          <input type="hidden" name="name" defaultValue={property.name} />
          <input type="hidden" name="address" defaultValue={property.address} />
          <input type="hidden" name="imageUrl" defaultValue={property.imageUrl} />
          <Textarea
            name="notes"
            defaultValue={property.notes}
            className="min-h-[200px]"
            placeholder="Escribe tus notas aquí..."
          />
           <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <SubmitButton />
          </DialogFooter>
           {state.message && !state.success && (
              <p className="text-red-500 text-sm mt-2">{state.message}</p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
