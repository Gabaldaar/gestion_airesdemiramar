
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
import { BookingWithDetails, Property, Tenant, ContractStatus, GuaranteeStatus, Origin } from "@/lib/data";
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
import { useState, useEffect } from 'react';
import { EmailSender } from "./email-sender";


interface BookingsListProps {
  bookings: BookingWithDetails[];
  properties: Property[];
  tenants: Tenant[];
  origins?: Origin[];
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

function BookingRow({ booking, properties, tenants, showProperty, origin, onEdit }: { booking: BookingWithDetails, properties: Property[], tenants: Tenant[], showProperty: boolean, origin?: Origin, onEdit: (booking: BookingWithDetails) => void }) {
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isGuaranteeOpen, setIsGuaranteeOpen] = useState(false);
  const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
  const [isExpensesOpen, setIsExpensesOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  const isCancelled = booking.status === 'cancelled';
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
    if (booking.status === 'cancelled') return "text-destructive line-through";

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
        return "text-muted-foreground"; // Cerrada
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

  const getBalanceColorClass = () => {
    if (isCancelled) return 'bg-gray-500 hover:bg-gray-600';
    if (booking.balance <= 0) return 'bg-green-600 hover:bg-green-700';
    if (booking.balance >= booking.amount) return 'bg-red-600 hover:bg-red-700';
    return 'bg-orange-500 hover:bg-orange-600';
  };
  
  
  return (
    <TableRow key={booking.id} className={cn("block md:table-row border-b md:border-b-0 last:border-b-0", isCancelled && "bg-red-500/10")}>
        {showProperty && <TableCell data-label="Propiedad" className={cn("font-bold", getBookingColorClass(booking))}>
            {isCancelled && <Badge variant="destructive" className="mr-2">CANCELADA</Badge>}
            {booking.property?.name || 'N/A'}
        </TableCell>}
        <TableCell data-label="Inquilino" className={cn(isCancelled && "text-muted-foreground")}>
            <div className='flex items-center h-full'>
            <EmailSender 
                    booking={booking} 
                    isOpen={isEmailOpen} 
                    onOpenChange={setIsEmailOpen}>
                    <button
                        onClick={() => setIsEmailOpen(true)}
                        className="text-left hover:underline disabled:no-underline disabled:cursor-not-allowed line-clamp-2 max-w-[150px]"
                        disabled={!booking.tenant?.email || isCancelled}
                    >
                        {booking.tenant?.name || 'N/A'}
                    </button>
                </EmailSender>
            </div>
        </TableCell>
        <TableCell data-label="Estadía" className={cn(isCancelled && "text-muted-foreground")}>
          <div className="flex flex-col md:flex-row md:items-center md:gap-1 whitespace-nowrap">
              <span>{formatDate(booking.startDate)}</span>
              <span className="hidden md:inline">→</span>
              <span>{formatDate(booking.endDate)}</span>
          </div>
          <span className="block text-xs text-muted-foreground">{nights} noches</span>
      </TableCell>
      <TableCell data-label="Origen" className={cn(isCancelled && "text-muted-foreground")}>
        {origin ? (
            <Badge style={{ backgroundColor: origin.color, color: 'white' }}>
                {origin.name}
            </Badge>
        ) : null}
      </TableCell>
      <TableCell data-label="Contrato" className={cn(isCancelled && "text-muted-foreground")}>
        <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                  <Link href={`/contract?id=${booking.id}`} target="_blank" className={cn(isCancelled && "pointer-events-none")}>
                    <Badge className={cn("cursor-pointer", isCancelled ? "bg-gray-500" : contractInfo.className)}>
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
      <TableCell data-label="Garantía" className={cn(isCancelled && "text-muted-foreground")}>
        <GuaranteeManager booking={booking} isOpen={isGuaranteeOpen} onOpenChange={setIsGuaranteeOpen}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                    <Badge 
                        className={cn("cursor-pointer", isCancelled ? "bg-gray-500" : guaranteeInfo.className)}
                        onClick={() => !isCancelled && setIsGuaranteeOpen(true)}
                        role="button"
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
      <TableCell data-label="Monto" className={cn(isCancelled && "text-muted-foreground")}>
          <TooltipProvider>
              <Tooltip>
                  <TooltipTrigger asChild>
                      <Badge variant="secondary" className={cn("cursor-default", isCancelled && "bg-gray-400 text-muted-foreground")}>{formatCurrency(booking.amount, booking.currency)}</Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                      <p>Valor del Alquiler</p>
                  </TooltipContent>
              </Tooltip>
          </TooltipProvider>
      </TableCell>
      <TableCell data-label="Saldo" className={cn(isCancelled && "text-muted-foreground")}>
          <TooltipProvider>
              <Tooltip>
                  <TooltipTrigger asChild>
                      <Badge variant="default" className={cn('cursor-default', getBalanceColorClass())}>
                          {formatCurrency(booking.balance, booking.currency)}
                      </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                      <p>Saldo a pagar</p>
                  </TooltipContent>
              </Tooltip>
          </TooltipProvider>
      </TableCell>
      <TableCell data-label="Acciones" className="text-right">
          <div className="grid grid-cols-2 gap-1 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-x-1 sm:gap-y-1">
                <NotesViewer 
                    notes={booking.notes} 
                    title={`Notas sobre la reserva de ${booking.tenant?.name}`} 
                    isOpen={isNotesOpen} 
                    onOpenChange={setIsNotesOpen}
                >
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
                </NotesViewer>
              
              <BookingPaymentsManager bookingId={booking.id} isOpen={isPaymentsOpen} onOpenChange={setIsPaymentsOpen}>
                  <TooltipProvider>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsPaymentsOpen(true)} disabled={isCancelled}>
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
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsExpensesOpen(true)} disabled={isCancelled}>
                                  <Wallet className="h-4 w-4" />
                                  <span className="sr-only">Gestionar Gastos</span>
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Gestionar Gastos</p></TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
              </BookingExpensesManager>

              <TooltipProvider>
                  <Tooltip>
                      <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(booking)}>
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar Reserva</span>
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Editar Reserva</p></TooltipContent>
                  </Tooltip>
              </TooltipProvider>
              
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


export default function BookingsList({ bookings, properties, tenants, origins, showProperty = false }: BookingsListProps) {
  const [editingBooking, setEditingBooking] = useState<BookingWithDetails | undefined>(undefined);
  const [isEditOpen, setIsEditOpen] = useState(false);

  if (bookings.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay reservas para mostrar.</p>;
  }

  const originsMap = origins ? new Map(origins.map(o => [o.id, o])) : new Map();

  const handleEditClick = (booking: BookingWithDetails) => {
    setEditingBooking(booking);
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    // A simple page refresh is enough when server actions handle revalidation
    window.location.reload();
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
        <Table className="block md:table">
          <TableHeader className="hidden md:table-header-group">
            <TableRow className="hidden md:table-row">
              {showProperty && <TableHead>Propiedad</TableHead>}
              <TableHead>Inquilino</TableHead>
              <TableHead>Estadía</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Contrato</TableHead>
              <TableHead>Garantía</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="block md:table-row-group">
            {bookings.map((booking) => (
                <BookingRow 
                    key={booking.id}
                    booking={booking} 
                    properties={properties} 
                    tenants={tenants} 
                    showProperty={showProperty} 
                    origin={booking.originId ? originsMap.get(booking.originId) : undefined}
                    onEdit={handleEditClick}
                />
            ))}
          </TableBody>
        </Table>

        {editingBooking && (
            <BookingEditForm
                booking={editingBooking}
                tenants={tenants}
                properties={properties}
                allBookings={bookings}
                isOpen={isEditOpen}
                onOpenChange={setIsEditOpen}
                onBookingUpdated={handleUpdate}
            />
        )}

        <style jsx>{`
            @media (max-width: 767px) {
                .block.md\\:table > .block.md\\:table-row-group > .block.md\\:table-row {
                    display: block;
                    padding: 1rem 0.5rem;
                    position: relative;
                }
                .block.md\\:table > .block.md\\:table-row-group > .block.md\\:table-row > [data-label] {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.5rem 0.5rem;
                    border-bottom: 1px solid hsl(var(--border));
                }
                .block.md\\:table > .block.md\\:table-row-group > .block.md\\:table-row > [data-label]::before {
                    content: attr(data-label);
                    font-weight: bold;
                    margin-right: 1rem;
                }
                .block.md\\:table > .block.md\\:table-row-group > .block.md\\table-row > [data-label="Acciones"] {
                    justify-content: flex-end;
                }
                 .block.md\\:table > .block.md\\:table-row-group > .block.md\\table-row > [data-label="Acciones"]::before {
                    display: none;
                }
                 .block.md\\:table > .block.md\\:table-row-group > .block.md\\:table-row:first-child {
                    border-top: 1px solid hsl(var(--border));
                }
            }
        `}</style>
    </div>
  );
}
