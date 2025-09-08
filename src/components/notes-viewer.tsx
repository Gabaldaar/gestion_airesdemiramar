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
import { BookingWithDetails } from '@/lib/data';

interface NotesViewerProps {
  booking: BookingWithDetails;
  children?: ReactNode;
}

export function NotesViewer({ booking, children }: NotesViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!booking.notes) {
    return (
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
            {children}
        </Button>
    )
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Notas sobre la reserva de {booking.tenant?.name}</DialogTitle>
          <DialogDescription>
            Contenido de las notas asociadas a la reserva.
          </DialogDescription>
        </DialogHeader>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <p className='whitespace-pre-wrap'>{booking.notes}</p>
        </div>
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
