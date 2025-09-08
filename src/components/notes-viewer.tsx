

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
import { FileText } from 'lucide-react';
import React from 'react';

interface NotesViewerProps {
  notes: string | null | undefined;
  title: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function NotesViewer({ notes, title, open, onOpenChange, children }: NotesViewerProps) {
  if (!notes) {
    return null;
  }

  const trigger = children ?? (
      <Button variant="ghost" size="icon">
        <FileText className="h-4 w-4" />
        <span className="sr-only">Ver Notas</span>
      </Button>
  );

  const isControlled = open !== undefined && onOpenChange !== undefined;

  return (
    <Dialog open={isControlled ? open : undefined} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children || trigger}
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
