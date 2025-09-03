
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { NotebookPen } from 'lucide-react';
import { Textarea } from './ui/textarea';

interface NotesDialogProps {
    formId: string;
    notes: string | undefined;
}

export function NotesDialog({ formId, notes }: NotesDialogProps) {
  return (
    <Dialog>
        <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
                <NotebookPen className="h-4 w-4" />
                <span className="sr-only">Ver/Editar Notas</span>
            </Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Notas</DialogTitle>
            <DialogDescription>
                Añade o edita las notas. Se guardarán al presionar el botón de Guardar principal.
            </DialogDescription>
            </DialogHeader>
            <Textarea
                name="notes"
                form={formId}
                defaultValue={notes}
                className="min-h-[200px]"
                placeholder="Escribe tus notas aquí..."
            />
            <DialogFooter>
                <DialogTrigger asChild>
                    <Button>Cerrar</Button>
                </DialogTrigger>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
