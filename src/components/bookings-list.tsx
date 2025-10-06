
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookingWithDetails, Property, Tenant, ContractStatus, GuaranteeStatus, Origin } from "@/lib/data";
import { format, differenceInDays, isWithinInterval } from 'date-fns';
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
import useWindowSize from '@/hooks/use-window-size';


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
    not_applicable: { text: 'N/A', className: 'bg-yellow-500 text-black hover:bg-yellow-700' }
};

function BookingActions({ booking, onEdit }: { booking: BookingWithDetails, onEdit: (booking: BookingWithDetails) => void }) {
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [isGuaranteeOpen, setIsGuaranteeOpen] = useState(false);
    const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
    const [isExpensesOpen, setIsExpensesOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    
    const isInactive = booking.status === 'cancelled' || booking.status === 'pending';

    return (
        <div className="flex flex-nowrap items-center justify-end gap-1">
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
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsPaymentsOpen(true)} disabled={isInactive}>
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
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsExpensesOpen(true)} disabled={isInactive}>
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
    )
}

function BookingRow({ booking, showProperty, origin, onEdit }: { booking: BookingWithDetails, showProperty: boolean, origin?: Origin, onEdit: (booking: BookingWithDetails) => void }) {
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  const isCancelled = booking.status === 'cancelled';
  const isPending = booking.status === 'pending';
  const isInactive = isCancelled || isPending;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  const isCurrent = isWithinInterval(today, { start: startDate, end: endDate });


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
    if (booking.status !== 'active') return "";

    if (isCurrent) {
        return "text-green-600"; // En curso
    }
    
    const daysUntilStart = differenceInDays(startDate, today);

    if (daysUntilStart < 0) {
        return "text-muted-foreground"; // Cerrada
    }
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
    if (isInactive) return 'bg-gray-500 hover:bg-gray-600';
    if (booking.balance <= 0) return 'bg-green-600 hover:bg-green-700';
    if (booking.balance >= booking.amount) return 'bg-red-600 hover:bg-red-700';
    return 'bg-orange-500 hover:bg-orange-600';
  };
  
  
  return (
    <TableRow key={booking.id} className={cn(isCancelled && "bg-red-500/10", isPending && "bg-yellow-500/10", isCurrent && "bg-green-500/10")}>
        {showProperty && <TableCell className={cn("font-bold")}>
            {isCancelled && <Badge variant="destructive" className="mr-2">CANCELADA</Badge>}
            {isPending && <Badge variant="secondary" className="mr-2 bg-yellow-400 text-black">EN ESPERA</Badge>}
            <span className={cn(
                getBookingColorClass(booking),
                isCancelled && "text-red-600 line-through",
                isPending && "text-amber-600",
                isCurrent && "text-green-600"
            )}>
                {booking.property?.name || 'N/A'}
            </span>
        </TableCell>}
        <TableCell className={cn(isInactive && "text-muted-foreground")}>
            <div className='flex items-center h-full'>
            <EmailSender 
                    booking={booking} 
                    isOpen={isEmailOpen} 
                    onOpenChange={setIsEmailOpen}>
                    <button
                        onClick={() => setIsEmailOpen(true)}
                        className="text-left hover:underline disabled:no-underline disabled:cursor-not-allowed line-clamp-2 max-w-[150px]"
                        disabled={!booking.tenant?.email || isInactive}
                    >
                        {booking.tenant?.name || 'N/A'}
                    </button>
                </EmailSender>
            </div>
        </TableCell>
        <TableCell className={cn("whitespace-nowrap", isInactive && "text-muted-foreground")}>
          <div className="flex flex-col">
              <span>{formatDate(booking.startDate)} → {formatDate(booking.endDate)}</span>
              <span className="text-xs text-muted-foreground">{nights} noches</span>
          </div>
      </TableCell>
      <TableCell className={cn("hidden md:table-cell", isInactive && "text-muted-foreground")}>
        {origin ? (
            <Badge style={{ backgroundColor: origin.color, color: 'white' }}>
                {origin.name}
            </Badge>
        ) : null}
      </TableCell>
      <TableCell className={cn(isInactive && "text-muted-foreground")}>
        <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                  <Link href={`/contract?id=${booking.id}`} target="_blank" className={cn(isInactive && "pointer-events-none")}>
                    <Badge className={cn("cursor-pointer", isInactive ? "bg-gray-500" : contractInfo.className)}>
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
      <TableCell className={cn("hidden lg:table-cell", isInactive && "text-muted-foreground")}>
        <GuaranteeManager booking={booking} isOpen={false} onOpenChange={()=>{}}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                    <Badge 
                        className={cn("cursor-pointer", isInactive ? "bg-gray-500" : guaranteeInfo.className)}
                        onClick={() => {}}
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
      <TableCell className={cn(isInactive && "text-muted-foreground")}>
          <TooltipProvider>
              <Tooltip>
                  <TooltipTrigger asChild>
                      <Badge variant="secondary" className={cn("cursor-default", isInactive && "bg-gray-400 text-muted-foreground")}>{formatCurrency(booking.amount, booking.currency)}</Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                      <p>Valor del Alquiler</p>
                  </TooltipContent>
              </Tooltip>
          </TooltipProvider>
      </TableCell>
      <TableCell className={cn(isInactive && "text-muted-foreground")}>
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
      <TableCell className="text-right">
        <BookingActions booking={booking} onEdit={onEdit} />
      </TableCell>
    </TableRow>
  );
}

function BookingCard({ booking, showProperty, origin, onEdit }: { booking: BookingWithDetails, showProperty: boolean, origin?: Origin, onEdit: (booking: BookingWithDetails) => void }) {
    const isCancelled = booking.status === 'cancelled';
    const isPending = booking.status === 'pending';
    const isInactive = isCancelled || isPending;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    const isCurrent = isWithinInterval(today, { start: startDate, end: endDate });
    
    const nights = differenceInDays(new Date(booking.endDate), new Date(booking.startDate));

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), "dd/MM/yy", { locale: es });
    };

    const formatCurrency = (amount: number, currency: 'USD' | 'ARS') => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency, maximumFractionDigits: 0 }).format(amount);
    }
    
    const getBalanceColorClass = () => {
        if (isInactive) return 'text-muted-foreground';
        if (booking.balance <= 0) return 'text-green-600';
        if (booking.balance >= booking.amount) return 'text-red-600';
        return 'text-orange-600';
    };

    return (
        <Card className={cn("w-full", isCancelled && "bg-red-500/10 border-red-500/20", isPending && "bg-yellow-500/10 border-yellow-500/20", isCurrent && "bg-green-500/10 border-green-500/20")}>
            <CardHeader className="p-4">
                 {isCancelled && <Badge variant="destructive" className="mr-2 w-fit">CANCELADA</Badge>}
                {isPending && <Badge variant="secondary" className="mr-2 w-fit bg-yellow-400 text-black">EN ESPERA</Badge>}
                <CardTitle className={cn("text-lg", isCurrent && "text-green-600")}>
                    {showProperty ? (
                        <span className={cn(
                            isCurrent && "text-green-600",
                            isCancelled && "text-red-600 line-through",
                            isPending && "text-amber-600"
                        )}>
                            {booking.property?.name || 'N/A'}
                        </span>
                    ) : (booking.tenant?.name || 'N/A')}
                </CardTitle>
                <CardDescription>
                    {showProperty ? (booking.tenant?.name || 'N/A') : booking.property?.name}
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="flex justify-between col-span-2">
                    <span className="text-muted-foreground">Estadía</span>
                    <span className="font-medium">{formatDate(booking.startDate)} → {formatDate(booking.endDate)} ({nights}n)</span>
                </div>
                {origin && (
                    <div className="flex justify-between col-span-2">
                        <span className="text-muted-foreground">Origen</span>
                        <Badge style={{ backgroundColor: origin.color, color: 'white' }}>{origin.name}</Badge>
                    </div>
                )}
                <div className="flex justify-between col-span-2">
                    <span className="text-muted-foreground">Monto</span>
                    <span className="font-medium">{formatCurrency(booking.amount, booking.currency)}</span>
                </div>
                <div className="flex justify-between col-span-2">
                    <span className="text-muted-foreground">Saldo</span>
                    <span className={cn("font-bold", getBalanceColorClass())}>{formatCurrency(booking.balance, booking.currency)}</span>
                </div>
                 <div className="flex justify-between col-span-2">
                    <span className="text-muted-foreground">Contrato</span>
                    <Link href={`/contract?id=${booking.id}`} target="_blank" className={cn(isInactive && "pointer-events-none")}>
                        <Badge className={cn("cursor-pointer", isInactive ? "bg-gray-500" : contractStatusMap[booking.contractStatus || 'not_sent'].className)}>
                            {contractStatusMap[booking.contractStatus || 'not_sent'].text}
                        </Badge>
                    </Link>
                </div>
            </CardContent>
            <CardFooter className="p-2 justify-end">
                <BookingActions booking={booking} onEdit={onEdit} />
            </CardFooter>
        </Card>
    )
}


export default function BookingsList({ bookings, properties, tenants, origins, showProperty = false }: BookingsListProps) {
  const [editingBooking, setEditingBooking] = useState<BookingWithDetails | undefined>(undefined);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { width } = useWindowSize();
  const useCardView = width < 1280; 

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
  
  const CardView = () => (
    <div className="space-y-4">
        {bookings.map((booking) => (
        <BookingCard
            key={booking.id}
            booking={booking}
            showProperty={showProperty}
            origin={booking.originId ? originsMap.get(booking.originId) : undefined}
            onEdit={handleEditClick}
        />
        ))}
    </div>
  );

  const TableView = () => (
    <Table>
        <TableHeader>
            <TableRow>
            {showProperty && <TableHead>Propiedad</TableHead>}
            <TableHead>Inquilino</TableHead>
            <TableHead>Estadía</TableHead>
            <TableHead className="hidden md:table-cell">Origen</TableHead>
            <TableHead>Contrato</TableHead>
            <TableHead className="hidden lg:table-cell">Garantía</TableHead>
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
                    showProperty={showProperty} 
                    origin={booking.originId ? originsMap.get(booking.originId) : undefined}
                    onEdit={handleEditClick}
                />
            ))}
        </TableBody>
    </Table>
  );

  return (
    <div>
        <div className="flex items-center space-x-4 mb-2 text-xs text-muted-foreground">
            <span className="font-semibold">Leyenda:</span>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-blue-600 mr-1"></div>&lt; 30 días</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-orange-600 mr-1"></div>&lt; 15 días</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-600 mr-1"></div>&lt; 7 días</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-green-600 mr-1"></div>En Curso</div>
        </div>
        
        {useCardView ? <CardView /> : <TableView />}

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
    </div>
  );
}
