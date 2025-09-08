
'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { NotesViewer } from './notes-viewer';
import { BookingPaymentsManager } from './booking-payments-manager';
import { BookingExpensesManager } from './booking-expenses-manager';
import { BookingEditForm } from './booking-edit-form';
import { BookingDeleteForm } from './booking-delete-form';
import { BookingWithDetails, Tenant, Property } from '@/lib/data';
import { useState } from 'react';

interface BookingActionsMenuProps {
    booking: BookingWithDetails;
    tenants: Tenant[];
    properties: Property[];
    allBookings: BookingWithDetails[];
}

export function BookingActionsMenu({ booking, tenants, properties, allBookings }: BookingActionsMenuProps) {
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
    const [isExpensesOpen, setIsExpensesOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     {booking.notes && (
                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setIsNotesOpen(true)}}>
                            Ver Notas
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setIsPaymentsOpen(true)}}>
                        Gestionar Pagos
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setIsExpensesOpen(true)}}>
                        Gestionar Gastos
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setIsEditOpen(true)}}>
                        Editar Reserva
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setIsDeleteOpen(true)}} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        Eliminar Reserva
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Dialogs that are controlled by the menu items */}
            {booking.notes && <NotesViewer notes={booking.notes} title={`Notas sobre la reserva`} open={isNotesOpen} onOpenChange={setIsNotesOpen} />}
            <BookingPaymentsManager bookingId={booking.id} open={isPaymentsOpen} onOpenChange={setIsPaymentsOpen} />
            <BookingExpensesManager bookingId={booking.id} open={isExpensesOpen} onOpenChange={setIsExpensesOpen} />
            <BookingEditForm booking={booking} tenants={tenants} properties={properties} allBookings={allBookings} open={isEditOpen} onOpenChange={setIsEditOpen} />
            <BookingDeleteForm bookingId={booking.id} propertyId={booking.propertyId} open={isDeleteOpen} onOpenChange={setIsDeleteOpen} />
        </>
    );
}
