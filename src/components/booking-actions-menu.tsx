

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Landmark, Wallet, Pencil, Trash2, FileText } from 'lucide-react';
import { BookingWithDetails, Property, Tenant } from '@/lib/data';
import { BookingPaymentsManager } from './booking-payments-manager';
import { BookingExpensesManager } from './booking-expenses-manager';
import { BookingEditForm } from './booking-edit-form';
import { BookingDeleteForm } from './booking-delete-form';
import { NotesViewer } from './notes-viewer';

interface BookingActionsMenuProps {
  booking: BookingWithDetails;
  properties: Property[];
  tenants: Tenant[];
  allBookings: BookingWithDetails[];
}

export function BookingActionsMenu({ booking, properties, tenants, allBookings }: BookingActionsMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
  const [isExpensesOpen, setIsExpensesOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  const handleActionClick = (action: () => void) => {
    setIsMenuOpen(false); // Close the main menu
    action(); // Open the specific dialog
  };

  return (
    <>
      <Dialog open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menú de acciones</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Acciones</DialogTitle>
            <DialogDescription>Selecciona una acción para la reserva de {booking.tenant?.name}.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-4">
             {booking.notes && (
                <Button variant="outline" className="justify-start" onClick={() => handleActionClick(() => setIsNotesOpen(true))}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Notas</span>
                </Button>
            )}
            <Button variant="outline" className="justify-start" onClick={() => handleActionClick(() => setIsPaymentsOpen(true))}>
              <Landmark className="mr-2 h-4 w-4" />
              <span>Pagos</span>
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => handleActionClick(() => setIsExpensesOpen(true))}>
              <Wallet className="mr-2 h-4 w-4" />
              <span>Gastos</span>
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => handleActionClick(() => setIsEditOpen(true))}>
              <Pencil className="mr-2 h-4 w-4" />
              <span>Editar</span>
            </Button>
            <Button variant="destructive" className="justify-start" onClick={() => handleActionClick(() => setIsDeleteOpen(true))}>
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Eliminar</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogs controlled by state */}
      {booking.notes && <NotesViewer open={isNotesOpen} onOpenChange={setIsNotesOpen} notes={booking.notes} title={`Notas sobre la reserva`} />}
      <BookingPaymentsManager open={isPaymentsOpen} onOpenChange={setIsPaymentsOpen} bookingId={booking.id} />
      <BookingExpensesManager open={isExpensesOpen} onOpenChange={setIsExpensesOpen} bookingId={booking.id} />
      <BookingEditForm open={isEditOpen} onOpenChange={setIsEditOpen} booking={booking} tenants={tenants} properties={properties} allBookings={allBookings} />
      <BookingDeleteForm open={isDeleteOpen} onOpenChange={setIsDeleteOpen} bookingId={booking.id} propertyId={booking.propertyId} />
    </>
  );
}
