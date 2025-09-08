
'use client';

import { ReactNode, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface NotesViewerProps {
  notes: string | null | undefined;
  title: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export function NotesViewer({ notes, title, open, onOpenChange, children }: NotesViewerProps) {
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isOpen = isControlled ? open : internalOpen;

  const setIsOpen = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  if (!notes) {
    return null;
  }
  
  const trigger = children ?? (
     <Button variant="ghost" size="icon">
        <FileText className="h-4 w-4" />
        <span className="sr-only">Ver Notas</span>
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Contenido de las notas asociadas.
          </DialogDescription>
        </DialogHeader>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <p className='whitespace-pre-wrap'>{notes}</p>
        </div>
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
