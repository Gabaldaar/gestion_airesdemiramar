'use client';

import { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookingWithDetails } from '@/lib/data';

interface NotesViewerProps {
  booking: BookingWithDetails;
  children?: ReactNode;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function NotesViewer({ booking, children, isOpen, onOpenChange }: NotesViewerProps) {
  return (
    <>
      {/* The trigger is now handled outside, this just renders the button */}
      {children} 
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
