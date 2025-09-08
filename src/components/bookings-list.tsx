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
import { Landmark, Wallet, Pencil, Trash2, FileText } from 'lucide-react';
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

function BookingRow({ booking, properties, tenants, showProperty }: { booking: BookingWithDetails, properties: Property[], tenants: Tenant[], showProperty: boolean }) {
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isGuaranteeOpen, setIsGuaranteeOpen] = useState(false);
  const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
  const [isExpensesOpen, setIsExpensesOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);


  const contractInfo = contractStatusMap[booking.contractStatus || 'not_sent'];
  const guaranteeInfo = guaranteeStatusMap[booking.guaranteeStatus || 'not_solicited'];
  const nights = differenceInDays(new Date(booking.endDate), new Date(booking.startDate));
  
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
    <TableRow key={booking.id}>
      {showProperty && <TableCell className={cn("font-bold align-middle", getBookingColorClass(booking))}>{booking.property?.name || 'N/A'}</TableCell>}
      <TableCell className="align-middle">
        <div className='flex items-center h-full'>
           <EmailSender booking={booking} isOpen={isEmailOpen} onOpenChange={setIsEmailOpen}>
            <button 
              onClick={() => setIsEmailOpen(true)}
              className="text-left hover:underline disabled:no-underline disabled:cursor-not-allowed line-clamp-2 max-w-[150px]"
              disabled={!booking.tenant?.email}
            >
              {booking.tenant?.name || 'N/A'}
            </button>
          </EmailSender>
        </div>
      </TableCell>
      <TableCell className="align-middle">
          <div className="flex flex-col md:flex-row md:items-center md:gap-1 whitespace-nowrap">
              <span>{formatDate(booking.startDate)}</span>
              <span className="hidden md:inline">→</span>
              <span>{formatDate(booking.endDate)}</span>
          </div>
          <span className="block text-xs text-muted-foreground">{nights} noches</span>
      </TableCell>
      <TableCell className="align-middle">
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
      <TableCell className="align-middle">
        <GuaranteeManager booking={booking} isOpen={isGuaranteeOpen} onOpenChange={setIsGuaranteeOpen}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="unstyled"
                    className={cn("cursor-pointer h-auto p-0", guaranteeInfo.className)}
                    onClick={() => setIsGuaranteeOpen(true)}
                  >
                    <Badge className={cn("cursor-pointer", guaranteeInfo.className)}>
                      {guaranteeInfo.text}
                    </Badge>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Gestionar Garantía</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
        </GuaranteeManager>
      </TableCell>
      <TableCell className="align-middle">
          <TooltipProvider>
              <Tooltip>
                  <TooltipTrigger asChild>
                      <Badge variant="secondary" className="cursor-default">{formatCurrency(booking.amount, booking.currency)}</Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                      <p>Valor del Alquiler</p>
                  </TooltipContent>
              </Tooltip>
          </TooltipProvider>
      </TableCell>
      <TableCell className="align-middle">
          <TooltipProvider>
              <Tooltip>
                  <TooltipTrigger asChild>
                      <Badge variant={booking.balance > 0 ? "destructive" : "default"} className={cn('cursor-default', booking.balance <= 0 && 'bg-green-600 hover:bg-green-700')}>
                          {formatCurrency(booking.balance, booking.currency)}
                      </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                      <p>Saldo a pagar</p>
                  </TooltipContent>
              </Tooltip>
          </TooltipProvider>
      </TableCell>
      <TableCell className="align-middle text-right">
          <div className="grid grid-cols-2 gap-1 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-x-1 sm:gap-y-1">
                <NotesViewer 
                    notes={booking.notes} 
                    title={`Notas sobre la reserva de ${booking.tenant?.name}`} 
                    isOpen={isNotesOpen} 
                    onOpenChange={setIsNotesOpen}
                />
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsNotesOpen(true)} disabled={!booking.notes}>
                                <FileText className="h-4 w-4" />
                                <span className="sr-only">Ver Notas</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Ver Notas</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
              
              <BookingPaymentsManager bookingId={booking.id} isOpen={isPaymentsOpen} onOpenChange={setIsPaymentsOpen}>
                  <TooltipProvider>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsPaymentsOpen(true)}>
                                  <Landmark className="h-4 w-4" />
                                  <span className="sr-only">Gestionar Pagos</span>
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Gestionar Pagos</p></TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
              </BookingPaymentsManager>
              
              <BookingExpensesManager bookingId={booking.id} isOpen={isExpensesOpen} onOpenChange={setIsExpensesOpen}>
                  <TooltipProvider>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsExpensesOpen(true)}>
                                  <Wallet className="h-4 w-4" />
                                  <span className="sr-only">Gestionar Gastos</span>
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Gestionar Gastos</p></TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
              </BookingExpensesManager>

              <BookingEditForm booking={booking} tenants={tenants} properties={properties} allBookings={[]} isOpen={isEditOpen} onOpenChange={setIsEditOpen}>
                  <TooltipProvider>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditOpen(true)}>
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">Editar Reserva</span>
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Editar Reserva</p></TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
              </BookingEditForm>
              
              <BookingDeleteForm bookingId={booking.id} propertyId={booking.propertyId} isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                  <TooltipProvider>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsDeleteOpen(true)}>
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Eliminar Reserva</span>
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Eliminar Reserva</p></TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
              </BookingDeleteForm>
          </div>
      </TableCell>
    </TableRow>
  );
}


export default function BookingsList({ bookings, properties, tenants, showProperty = false }: BookingsListProps) {

  if (bookings.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay reservas para mostrar.</p>;
  }

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
            {bookings.map((booking) => (
                <BookingRow 
                    key={booking.id}
                    booking={booking} 
                    properties={properties} 
                    tenants={tenants} 
                    showProperty={showProperty} 
                />
            ))}
          </TableBody>
        </Table>
    </div>
  );
}
