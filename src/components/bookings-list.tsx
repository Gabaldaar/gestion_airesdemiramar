
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookingWithDetails, Property, Tenant, ContractStatus, GuaranteeStatus } from "@/lib/data";
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import Link from "next/link";
import { Button } from "./ui/button";
import { BookingPaymentsManager } from './booking-payments-manager';
import { BookingExpensesManager } from './booking-expenses-manager';
import { BookingEditForm } from './booking-edit-form';
import { BookingDeleteForm } from './booking-delete-form';
import { NotesViewer } from './notes-viewer';
import { GuaranteeManager } from './guarantee-manager';
import { Landmark, Wallet, Pencil, Trash2, FileText, Mail } from 'lucide-react';
import { useState } from 'react';
import { EmailSender } from "./email-sender";


interface BookingsListProps {
  bookings: BookingWithDetails[];
  properties: Property[];
  tenants: Tenant[];
  showProperty?: boolean;
}

const contractStatusMap: Record<ContractStatus, { text: string, className: string }> = {
    not_sent: { text: 'S/Enviar', className: 'bg-gray-500 hover:bg-gray-600' },
    sent: { text: 'Enviado', className: 'bg-blue-500 hover:bg-blue-600' },
    signed: { text: 'Firmado', className: 'bg-green-600 hover:bg-green-700' },
    not_required: { text: 'N/A', className: 'bg-yellow-600 text-black hover:bg-yellow-700' }
};

const guaranteeStatusMap: Record<GuaranteeStatus, { text: string, className: string }> = {
    not_solicited: { text: 'S/Solicitar', className: 'bg-gray-400 hover:bg-gray-500' },
    solicited: { text: 'Solicitada', className: 'bg-blue-400 hover:bg-blue-500' },
    received: { text: 'Recibida', className: 'bg-green-500 hover:bg-green-600' },
    returned: { text: 'Devuelta', className: 'bg-purple-500 hover:bg-purple-600' },
    not_applicable: { text: 'N/A', className: 'bg-yellow-500 text-black hover:bg-yellow-600' }
};

function BookingActions({ booking, properties, tenants }: { booking: BookingWithDetails, properties: Property[], tenants: Tenant[]}) {
    const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
    const [isExpensesOpen, setIsExpensesOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    
    return (
        <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 max-w-[120px]">
            {booking.notes && (
                <NotesViewer open={isNotesOpen} onOpenChange={setIsNotesOpen} notes={booking.notes} title={`Notas sobre la reserva`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <FileText className="h-4 w-4" />
                        <span className="sr-only">Ver Notas</span>
                    </Button>
                </NotesViewer>
            )}

            <BookingPaymentsManager open={isPaymentsOpen} onOpenChange={setIsPaymentsOpen} bookingId={booking.id}>
                 <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Landmark className="h-4 w-4" />
                    <span className="sr-only">Gestionar Pagos</span>
                </Button>
            </BookingPaymentsManager>
            
            <BookingExpensesManager open={isExpensesOpen} onOpenChange={setIsExpensesOpen} bookingId={booking.id}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Wallet className="h-4 w-4" />
                    <span className="sr-only">Gestionar Gastos</span>
                </Button>
            </BookingExpensesManager>

            <BookingEditForm open={isEditOpen} onOpenChange={setIsEditOpen} booking={booking} tenants={tenants} properties={properties} allBookings={[]}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar Reserva</span>
                </Button>
            </BookingEditForm>

            <BookingDeleteForm open={isDeleteOpen} onOpenChange={setIsDeleteOpen} bookingId={booking.id} propertyId={booking.propertyId}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Eliminar Reserva</span>
                </Button>
            </BookingDeleteForm>
        </div>
    )
}

export default function BookingsList({ bookings, properties, tenants, showProperty = false }: BookingsListProps) {
  const [isGuaranteeOpen, setIsGuaranteeOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);

  if (bookings.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay reservas para mostrar.</p>;
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd-LLL-yyyy", { locale: es });
  };

  const formatCurrency = (amount: number, currency: 'USD' | 'ARS') => {
        if (currency === 'USD') {
             return `USD ${new Intl.NumberFormat('es-AR', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(amount)}`;
        }
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    }
  
  const getBookingColorClass = (booking: BookingWithDetails): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(booking.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(booking.endDate);
    endDate.setHours(0, 0, 0, 0);

    if (today >= startDate && today <= endDate) {
      return "text-green-600"; // En curso
    }

    if (startDate < today) {
        return ""; // Cerrada, sin color
    }
    
    const daysUntilStart = differenceInDays(startDate, today);

    if (daysUntilStart < 7) {
      return "text-red-600";
    }
    if (daysUntilStart < 15) {
      return "text-orange-600";
    }
    if (daysUntilStart < 30) {
      return "text-blue-600";
    }
    return "";
  };


  return (
    <div>
        <div className="flex items-center space-x-4 mb-2 text-xs text-muted-foreground">
            <span className="font-semibold">Leyenda:</span>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-blue-600 mr-1"></div>&lt; 30 días</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-orange-600 mr-1"></div>&lt; 15 días</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-600 mr-1"></div>&lt; 7 días</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-green-600 mr-1"></div>En Curso</div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {showProperty && <TableHead>Propiedad</TableHead>}
              <TableHead>Inquilino</TableHead>
              <TableHead>Estadía</TableHead>
              <TableHead>Contrato</TableHead>
              <TableHead>Garantía</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => {
              const contractInfo = contractStatusMap[booking.contractStatus || 'not_sent'];
              const guaranteeInfo = guaranteeStatusMap[booking.guaranteeStatus || 'not_solicited'];
              const nights = differenceInDays(new Date(booking.endDate), new Date(booking.startDate));
              return (
              <TableRow key={booking.id}>
                {showProperty && <TableCell className={cn("font-bold", getBookingColorClass(booking))}>{booking.property?.name || 'N/A'}</TableCell>}
                <TableCell className="font-medium max-w-[200px]">
                   <EmailSender 
                      booking={booking} 
                      open={isEmailOpen && selectedBooking?.id === booking.id} 
                      onOpenChange={(isOpen) => {
                        if (!isOpen) setSelectedBooking(null);
                        setIsEmailOpen(isOpen);
                      }}
                      asChild>
                      <button 
                        className="text-left hover:underline disabled:no-underline disabled:cursor-not-allowed"
                        onClick={() => {
                            setSelectedBooking(booking);
                            setIsEmailOpen(true);
                        }}
                        disabled={!booking.tenant?.email}
                      >
                        {booking.tenant?.name || 'N/A'}
                      </button>
                    </EmailSender>
                </TableCell>
                <TableCell>
                    <div className="flex flex-col md:flex-row md:items-center md:gap-1 whitespace-nowrap">
                        <span>{formatDate(booking.startDate)}</span>
                        <span className="hidden md:inline">→</span>
                        <span>{formatDate(booking.endDate)}</span>
                    </div>
                    <span className="block text-xs text-muted-foreground">{nights} noches</span>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                     <Tooltip>
                        <TooltipTrigger asChild>
                           <Link href={`/contract?id=${booking.id}`} target="_blank">
                              <Badge className={cn("cursor-pointer", contractInfo.className)}>
                                  {contractInfo.text}
                              </Badge>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                           <p>Ver Contrato</p>
                        </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <GuaranteeManager
                      booking={booking}
                      open={isGuaranteeOpen && selectedBooking?.id === booking.id}
                      onOpenChange={(isOpen) => {
                        if (!isOpen) setSelectedBooking(null);
                        setIsGuaranteeOpen(isOpen);
                      }}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge 
                            className={cn("cursor-pointer", guaranteeInfo.className)}
                            onClick={() => {
                                setSelectedBooking(booking);
                                setIsGuaranteeOpen(true);
                            }}
                          >
                            {guaranteeInfo.text}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                           <p>Gestionar Garantía</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </GuaranteeManager>
                </TableCell>
                <TableCell>
                    <Badge variant="secondary">{formatCurrency(booking.amount, booking.currency)}</Badge>
                </TableCell>
                <TableCell className={`font-bold ${booking.balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {formatCurrency(booking.balance, booking.currency)}
                </TableCell>
                <TableCell className="text-right">
                    <BookingActions 
                        booking={booking} 
                        properties={properties} 
                        tenants={tenants}
                    />
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
    </div>
  );
}
