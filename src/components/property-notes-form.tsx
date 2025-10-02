
'use client';

import { useEffect, useState, useTransition } from 'react';
import { updateProperty } from '@/lib/data';
import { Property } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { NotebookPen, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from './ui/textarea';
import { useToast } from './ui/use-toast';

function SubmitButton({ isPending }: { isPending: boolean }) {
    return (
        <Button type="submit" disabled={isPending}>
            {isPending ? (
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
  const formId = `property-notes-form-${property.id}`;
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const notes = formData.get('notes') as string;

    startTransition(async () => {
        try {
            await updateProperty({ ...property, notes });
            toast({ title: 'Éxito', description: 'Notas actualizadas.' });
            setIsOpen(false);
            window.location.reload();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: `No se pudieron guardar las notas: ${error.message}` });
        }
    });
  }

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
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            name="notes"
            defaultValue={property.notes}
            className="min-h-[200px]"
            placeholder="Escribe tus notas aquí..."
          />
           <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <SubmitButton isPending={isPending} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    