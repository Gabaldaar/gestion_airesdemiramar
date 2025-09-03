
'use client';

import { useEffect, useState } from 'react';
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
    state: { success: boolean; message: string; };
}

export function NotesDialog({ formId, notes, state }: NotesDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (state?.success) {
            setIsOpen(false);
        }
    }, [state]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                    Añade o edita las notas. Los cambios se guardarán al presionar el botón de Guardar.
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
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                    <Button type="submit" form={formId}>Guardar Notas</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
