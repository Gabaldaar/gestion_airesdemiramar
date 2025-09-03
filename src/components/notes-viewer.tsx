
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { NotebookPen } from 'lucide-react';

interface NotesViewerProps {
  notes: string | null | undefined;
  title: string;
}

export function NotesViewer({ notes, title }: NotesViewerProps) {
  if (!notes) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <NotebookPen className="h-4 w-4" />
          <span className="sr-only">Ver Notas</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Estas son las notas guardadas.
          </DialogDescription>
        </DialogHeader>
        <div className="prose prose-sm max-h-[60vh] overflow-y-auto rounded-md border p-4">
            <p className='whitespace-pre-wrap'>{notes}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
