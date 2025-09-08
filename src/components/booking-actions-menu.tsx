

'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Landmark, Wallet, Pencil, Trash2, FileText, Shield } from 'lucide-react';
import { BookingWithDetails, Property, Tenant } from '@/lib/data';
import { BookingPaymentsManager } from './booking-payments-manager';
import { BookingExpensesManager } from './booking-expenses-manager';
import { BookingEditForm } from './booking-edit-form';
import { BookingDeleteForm } from './booking-delete-form';
import { NotesViewer } from './notes-viewer';
import { GuaranteeManager } from './guarantee-manager';

interface BookingActionsMenuProps {
  booking: BookingWithDetails;
  properties: Property[];
  tenants: Tenant[];
  allBookings: BookingWithDetails[];
}

export function BookingActionsMenu({ booking, properties, tenants, allBookings }: BookingActionsMenuProps) {
  const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
  const [isExpensesOpen, setIsExpensesOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isGuaranteeOpen, setIsGuaranteeOpen] = useState(false);


  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menú de acciones</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
           {booking.notes && (
            <DropdownMenuItem onSelect={() => setIsNotesOpen(true)}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Notas</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => setIsPaymentsOpen(true)}>
            <Landmark className="mr-2 h-4 w-4" />
            <span>Pagos</span>
          </DropdownMenuItem>
           <DropdownMenuItem onSelect={() => setIsGuaranteeOpen(true)}>
            <Shield className="mr-2 h-4 w-4" />
            <span>Garantía</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsExpensesOpen(true)}>
            <Wallet className="mr-2 h-4 w-4" />
            <span>Gastos</span>
          </DropdownMenuItem>
           <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setIsEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            <span>Editar</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsDeleteOpen(true)} className="text-red-600 focus:text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Eliminar</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs controlled by state */}
      <NotesViewer open={isNotesOpen} onOpenChange={setIsNotesOpen} notes={booking.notes} title={`Notas sobre la reserva`} />
      <BookingPaymentsManager open={isPaymentsOpen} onOpenChange={setIsPaymentsOpen} bookingId={booking.id} />
      <GuaranteeManager open={isGuaranteeOpen} onOpenChange={setIsGuaranteeOpen} booking={booking} />
      <BookingExpensesManager open={isExpensesOpen} onOpenChange={setIsExpensesOpen} bookingId={booking.id} />
      <BookingEditForm open={isEditOpen} onOpenChange={setIsEditOpen} booking={booking} tenants={tenants} properties={properties} allBookings={allBookings} />
      <BookingDeleteForm open={isDeleteOpen} onOpenChange={setIsDeleteOpen} bookingId={booking.id} propertyId={booking.propertyId} />
    </>
  );
}
