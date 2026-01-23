
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
import { BookingWithDetails, Property, Tenant, ContractStatus, GuaranteeStatus, Origin, ExpenseCategory, getExpenseCategories } from "@/lib/data";
import { format, differenceInDays, isWithinInterval, isPast, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn, parseDateSafely } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import Link from "next/link";
import { Button } from "./ui/button";
import { BookingPaymentsManager } from './booking-payments-manager';
import { BookingExpensesManager } from './booking-expenses-manager';
import { BookingEditForm } from './booking-edit-form';
import { BookingDeleteForm } from './booking-delete-form';
import { NotesViewer } from './notes-viewer';
import { GuaranteeManager } from './guarantee-manager';
import { Landmark, Wallet, Pencil, Trash2, FileText, Calculator, Mail } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { EmailSender } from "./email-sender";
import useWindowSize from '@/hooks/use-window-size';
import { PaymentAddForm, PaymentPreloadData } from "./payment-add-form";
import { BookingExpenseAddForm } from "./booking-expense-add-form";
import PaymentCalculator from "./payment-calculator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";


interface BookingsListProps {
  bookings: BookingWithDetails[];
  properties: Property[];
  tenants: Tenant[];
  origins?: Origin[];
  showProperty?: boolean;
  onDataChanged: () => void;
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

function BookingActions({ booking, onEdit, onAddPayment, onAddExpense, onCalculatorOpen, onEmailOpen }: { booking: BookingWithDetails, onEdit: (booking: BookingWithDetails) => void, onAddPayment: (bookingId: string) => void, onAddExpense: (bookingId: string) => void, onCalculatorOpen: (booking: BookingWithDetails) => void, onEmailOpen: (booking: BookingWithDetails) => void }) {
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
              
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onCalculatorOpen(booking)} disabled={isInactive}>
                            <Calculator className="h-4 w-4" />
                            <span className="sr-only">Calcular Pago</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Calcular Pago</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <BookingPaymentsManager 
                bookingId={booking.id} 
                isOpen={isPaymentsOpen} 
                onOpenChange={setIsPaymentsOpen}
                onAddPaymentClick={() => onAddPayment(booking.id)}
            >
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
            
            <BookingExpensesManager 
                bookingId={booking.id} 
                isOpen={isExpensesOpen} 
                onOpenChange={setIsExpensesOpen}
                onAddExpenseClick={() => onAddExpense(booking.id)}
            >
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
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEmailOpen(booking)} disabled={isInactive || !booking.tenant?.email}>
                            <Mail className="h-4 w-4" />
                            <span className="sr-only">Enviar Email</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Enviar Email</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>

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

function BookingRow({ booking, showProperty, origin, onEdit, onAddPayment, onAddExpense, onCalculatorOpen, onEmailOpen }: { booking: BookingWithDetails, showProperty: boolean, origin?: Origin, onEdit: (booking: BookingWithDetails) => void, onAddPayment: (bookingId: string) => void, onAddExpense: (bookingId: string) => void, onCalculatorOpen: (booking: BookingWithDetails) => void, onEmailOpen: (booking: BookingWithDetails) => void }) {

  const isCancelled = booking.status === 'cancelled';
  const isPending = booking.status === 'pending';
  
  const today = startOfToday();
  const startDate = parseDateSafely(booking.startDate);
  const endDate = parseDateSafely(booking.endDate);
  
  const isCurrent = startDate && endDate ? isWithinInterval(today, { start: startDate, end: endDate }) : false;
  const isPastBooking = endDate ? isPast(endDate) && !isCurrent : false;
  const isUpcoming = !isPastBooking && !isCurrent;


  const contractInfo = contractStatusMap[booking.contractStatus || 'not_sent'];
  const guaranteeInfo = guaranteeStatusMap[booking.guaranteeStatus || 'not_solicited'];
  const nights = startDate && endDate ? differenceInDays(endDate, startDate) : NaN;
  
  const formatDate = (date: Date | undefined) => {
    if (!date || isNaN(date.getTime())) {
      return "Fecha inv.";
    }
    // Adjust for timezone offset before formatting
    const adjustedDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
    return format(adjustedDate, "dd-LLL-yyyy", { locale: es });
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
  
  const getBookingStatusStyles = (booking: BookingWithDetails): { titleColor: string; bgColor: string } => {
    if (!startDate) return { titleColor: "text-red-600", bgColor: "bg-red-500/10" };
    const daysUntilStart = differenceInDays(startDate, startOfToday());
    
    if (booking.status === 'cancelled') return { titleColor: "text-red-600 line-through", bgColor: "bg-red-500/10" };
    if (booking.status === 'pending') return { titleColor: "text-amber-600", bgColor: "bg-yellow-500/10" };
    if (isCurrent) return { titleColor: "text-green-600", bgColor: "bg-green-500/10" };
    if (isPastBooking) return { titleColor: "text-muted-foreground", bgColor: "bg-gray-500/10 opacity-70" };

    if (isUpcoming && daysUntilStart >= 0) {
      if (daysUntilStart < 7) return { titleColor: "text-red-700", bgColor: "bg-red-500/10" };
      if (daysUntilStart < 15) return { titleColor: "text-orange-700", bgColor: "bg-orange-500/10" };
      if (daysUntilStart < 30) return { titleColor: "text-blue-700", bgColor: "bg-blue-500/10" };
    }
    
    return { titleColor: "", bgColor: "" };
  };

  const {titleColor, bgColor} = getBookingStatusStyles(booking);

  const getBalanceColorClass = () => {
    if (isCancelled || isPending || isPastBooking) return 'bg-gray-500 hover:bg-gray-600';
    if (booking.balance <= 0) return 'bg-green-600 hover:bg-green-700';
    if (booking.balance >= booking.amount) return 'bg-red-600 hover:bg-red-700';
    return 'bg-orange-500 hover:bg-orange-600';
  };
  
  const daysUntilStart = startDate ? differenceInDays(startDate, today) : null;
  const daysUntilEnd = endDate ? differenceInDays(endDate, today) : null;
  
  let daysRemainingText: string | null = null;
  let daysRemainingColor: string = titleColor;

  if (!isCancelled && !isPending) {
    if (isUpcoming && daysUntilStart !== null && daysUntilStart >= 0) {
      daysRemainingText = `Faltan ${daysUntilStart} ${daysUntilStart === 1 ? 'día' : 'días'} para el check-in`;
    } else if (isCurrent && daysUntilEnd !== null && daysUntilEnd >= 0) {
      daysRemainingText = `Faltan ${daysUntilEnd} ${daysUntilEnd === 1 ? 'día' : 'días'} para el check-out`;
      daysRemainingColor = 'text-green-600';
    }
  }

  return (
    <TableRow key={booking.id} className={bgColor}>
        {showProperty && <TableCell>
            {isCancelled && <Badge variant="destructive" className="mr-2">CANCELADA</Badge>}
            {isPending && <Badge variant="secondary" className="mr-2 bg-yellow-400 text-black">EN ESPERA</Badge>}
            {isPastBooking && <Badge variant="secondary" className="mr-2">CUMPLIDA</Badge>}
            <span className={cn("font-bold", titleColor)}>
                {booking.property?.name || 'N/A'}
            </span>
        </TableCell>}
        <TableCell className={cn((isCancelled || isPending || isPastBooking) && "text-muted-foreground")}>
            <div className='flex items-center h-full'>
                <span
                    className="line-clamp-2 max-w-[150px]"
                >
                    {booking.tenant?.name || 'N/A'}
                </span>
            </div>
        </TableCell>
        <TableCell className={cn("whitespace-nowrap", (isCancelled || isPending || isPastBooking) && "text-muted-foreground")}>
          <div className="flex flex-col">
              <span>{formatDate(startDate)} → {formatDate(endDate)}</span>
              <span className="text-xs text-muted-foreground">{isNaN(nights) ? '...' : nights} noches</span>
               {daysRemainingText && (
                  <span className={cn("text-xs font-semibold", daysRemainingColor)}>{daysRemainingText}</span>
               )}
          </div>
      </TableCell>
      <TableCell className={cn("hidden md:table-cell", (isCancelled || isPending || isPastBooking) && "text-muted-foreground")}>
        {origin ? (
            <Badge style={{ backgroundColor: origin.color, color: 'white' }}>
                {origin.name}
            </Badge>
        ) : null}
      </TableCell>
      <TableCell className={cn((isCancelled || isPending || isPastBooking) && "text-muted-foreground")}>
        <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                  <Link href={`/contract?id=${booking.id}`} target="_blank" className={cn((isCancelled || isPending || isPastBooking) && "pointer-events-none")}>
                    <Badge className={cn("cursor-pointer", (isCancelled || isPending || isPastBooking) ? "bg-gray-500" : contractInfo.className)}>
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
      <TableCell className={cn("hidden lg:table-cell", (isCancelled || isPending || isPastBooking) && "text-muted-foreground")}>
        <GuaranteeManager booking={booking} isOpen={false} onOpenChange={()=>{}}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                    <Badge 
                        className={cn("cursor-pointer", (isCancelled || isPending || isPastBooking) ? "bg-gray-500" : guaranteeInfo.className)}
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
      <TableCell className={cn((isCancelled || isPending || isPastBooking) && "text-muted-foreground")}>
          <TooltipProvider>
              <Tooltip>
                  <TooltipTrigger asChild>
                      <Badge variant="secondary" className={cn("cursor-default", (isCancelled || isPending || isPastBooking) && "bg-gray-400 text-muted-foreground")}>{formatCurrency(booking.amount, booking.currency)}</Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                      <p>Valor del Alquiler</p>
                  </TooltipContent>
              </Tooltip>
          </TooltipProvider>
      </TableCell>
      <TableCell className={cn((isCancelled || isPending || isPastBooking) && "text-muted-foreground")}>
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
        <BookingActions booking={booking} onEdit={onEdit} onAddPayment={onAddPayment} onAddExpense={onAddExpense} onCalculatorOpen={onCalculatorOpen} onEmailOpen={onEmailOpen} />
      </TableCell>
    </TableRow>
  );
}

function BookingCard({ booking, showProperty, origin, onEdit, onAddPayment, onAddExpense, onCalculatorOpen, onEmailOpen }: { booking: BookingWithDetails, showProperty: boolean, origin?: Origin, onEdit: (booking: BookingWithDetails) => void, onAddPayment: (bookingId: string) => void, onAddExpense: (bookingId: string) => void, onCalculatorOpen: (booking: BookingWithDetails) => void, onEmailOpen: (booking: BookingWithDetails) => void }) {
    const isCancelled = booking.status === 'cancelled';
    const isPending = booking.status === 'pending';

    const today = startOfToday();
    const startDate = parseDateSafely(booking.startDate);
    const endDate = parseDateSafely(booking.endDate);
    
    const isCurrent = startDate && endDate ? isWithinInterval(today, { start: startDate, end: endDate }) : false;
    const isPastBooking = endDate ? isPast(endDate) && !isCurrent : false;
    const isInactive = isCancelled || isPending || isPastBooking;
    const isUpcoming = !isPastBooking && !isCurrent;
    
    const nights = startDate && endDate ? differenceInDays(endDate, startDate) : NaN;

    const formatDate = (date: Date | undefined) => {
        if (!date || isNaN(date.getTime())) {
            return "Fecha inv.";
        }
        // Adjust for timezone offset before formatting
        const adjustedDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
        return format(adjustedDate, "dd/MM/yy", { locale: es });
    };

    const formatCurrency = (amount: number, currency: 'USD' | 'ARS') => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency, maximumFractionDigits: 0 }).format(amount);
    }

    const getBookingStatusStyles = (booking: BookingWithDetails): { titleColor: string; cardClassName: string } => {
        if (!startDate) return { titleColor: "text-red-600", cardClassName: "bg-red-500/10 border-red-500/20" };
        const daysUntilStart = differenceInDays(startDate, startOfToday());

        if (booking.status === 'cancelled') return { titleColor: "text-red-600 line-through", cardClassName: "bg-red-500/10 border-red-500/20" };
        if (booking.status === 'pending') return { titleColor: "text-amber-600", cardClassName: "bg-yellow-500/10 border-yellow-500/20" };
        if (isCurrent) return { titleColor: "text-green-600", cardClassName: "bg-green-500/10 border-green-500/20" };
        if (isPastBooking) return { titleColor: "text-muted-foreground", cardClassName: "bg-gray-500/10 border-gray-500/20 opacity-70" };

        if (isUpcoming && daysUntilStart >= 0) {
            if (daysUntilStart < 7) return { titleColor: "text-red-700", cardClassName: "bg-red-500/10 border-red-500/20" };
            if (daysUntilStart < 15) return { titleColor: "text-orange-700", cardClassName: "bg-orange-500/10 border-orange-500/20" };
            if (daysUntilStart < 30) return { titleColor: "text-blue-700", cardClassName: "bg-blue-500/10 border-blue-500/20" };
        }
        
        return { titleColor: "text-primary", cardClassName: "" };
    };

    const { titleColor, cardClassName } = getBookingStatusStyles(booking);
    
    const getBalanceColorClass = () => {
        if (isInactive) return 'text-muted-foreground';
        if (booking.balance <= 0) return 'text-green-600';
        if (booking.balance >= booking.amount) return 'text-red-600';
        return 'text-orange-600';
    };

    const daysUntilStart = startDate ? differenceInDays(startDate, today) : null;
    const daysUntilEnd = endDate ? differenceInDays(endDate, today) : null;
    
    let daysRemainingText: string | null = null;
    let daysRemainingColor: string = titleColor;

    if (!isCancelled && !isPending) {
        if (isUpcoming && daysUntilStart !== null && daysUntilStart >= 0) {
            daysRemainingText = `Faltan ${daysUntilStart} ${daysUntilStart === 1 ? 'día' : 'días'} para el check-in`;
        } else if (isCurrent && daysUntilEnd !== null && daysUntilEnd >= 0) {
            daysRemainingText = `Faltan ${daysUntilEnd} ${daysUntilEnd === 1 ? 'día' : 'días'} para el check-out`;
            daysRemainingColor = 'text-green-600';
        }
    }


    return (
        <Card className="w-full">
            <CardHeader className={cn("p-4 rounded-t-lg", cardClassName)}>
                 {isCancelled && <Badge variant="destructive" className="mr-2 w-fit">CANCELADA</Badge>}
                {isPending && <Badge variant="secondary" className="mr-2 w-fit bg-yellow-400 text-black">EN ESPERA</Badge>}
                {isPastBooking && <Badge variant="secondary" className="mr-2 w-fit">CUMPLIDA</Badge>}
                <CardTitle className={cn("text-lg", titleColor)}>
                    {showProperty ? (
                        <span className={cn(titleColor)}>
                            {booking.property?.name || 'N/A'}
                        </span>
                    ) : (booking.tenant?.name || 'N/A')}
                </CardTitle>
                <CardDescription className={cn(cardClassName.includes('bg-') && "text-foreground/80")}>
                    {showProperty ? (booking.tenant?.name || 'N/A') : booking.property?.name}
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="flex justify-between col-span-2">
                    <span className="text-muted-foreground">Estadía</span>
                    <div className="flex flex-col items-end">
                       <span className="font-medium">{formatDate(startDate)} → {formatDate(endDate)} ({isNaN(nights) ? '...' : nights}n)</span>
                       {daysRemainingText && (
                            <span className={cn("text-xs font-semibold", daysRemainingColor)}>{daysRemainingText}</span>
                       )}
                    </div>
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
                <BookingActions booking={booking} onEdit={onEdit} onAddPayment={onAddPayment} onAddExpense={onAddExpense} onCalculatorOpen={onCalculatorOpen} onEmailOpen={onEmailOpen} />
            </CardFooter>
        </Card>
    )
}


export default function BookingsList({ bookings, properties, tenants, origins, showProperty = false, onDataChanged }: BookingsListProps) {
  const [editingBooking, setEditingBooking] = useState<BookingWithDetails | undefined>(undefined);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [addingPaymentForBookingId, setAddingPaymentForBookingId] = useState<string | undefined>(undefined);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [paymentPreloadData, setPaymentPreloadData] = useState<PaymentPreloadData | undefined>(undefined);

  const [addingExpenseForBookingId, setAddingExpenseForBookingId] = useState<string | undefined>(undefined);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [calculatorBooking, setCalculatorBooking] = useState<BookingWithDetails | undefined>(undefined);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [emailBooking, setEmailBooking] = useState<BookingWithDetails | undefined>(undefined);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  const { width } = useWindowSize();
  const useCardView = width < 1280; 

  const sortedBookings = useMemo(() => {
    return bookings; // The parent component `bookings-client` is now responsible for sorting
  }, [bookings]);

  useEffect(() => {
    getExpenseCategories().then(setExpenseCategories);
  }, []);

  if (sortedBookings.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay reservas para mostrar.</p>;
  }

  const originsMap = origins ? new Map(origins.map(o => [o.id, o])) : new Map();

  const handleEditClick = (booking: BookingWithDetails) => {
    setEditingBooking(booking);
    setIsEditOpen(true);
  };

  const handleAddPaymentClick = (bookingId: string) => {
    setAddingPaymentForBookingId(bookingId);
    setPaymentPreloadData(undefined); // Clear any previous preload data
    setIsAddPaymentOpen(true);
  }

  const handleAddExpenseClick = (bookingId: string) => {
    setAddingExpenseForBookingId(bookingId);
    setIsAddExpenseOpen(true);
  }

  const handleCalculatorOpen = (booking: BookingWithDetails) => {
    setCalculatorBooking(booking);
    setIsCalculatorOpen(true);
  };
  
  const handleEmailOpen = (booking: BookingWithDetails) => {
    setEmailBooking(booking);
    setIsEmailOpen(true);
  }

  const handleRegisterPayment = (bookingId: string, data: PaymentPreloadData) => {
    setIsCalculatorOpen(false); // Close calculator
    setAddingPaymentForBookingId(bookingId);
    setPaymentPreloadData(data);
    setIsAddPaymentOpen(true);
  }
  
  const CardView = () => (
    <div className="space-y-4">
        {sortedBookings.map((booking) => (
        <BookingCard
            key={booking.id}
            booking={booking}
            showProperty={showProperty}
            origin={booking.originId ? originsMap.get(booking.originId) : undefined}
            onEdit={handleEditClick}
            onAddPayment={handleAddPaymentClick}
            onAddExpense={handleAddExpenseClick}
            onCalculatorOpen={handleCalculatorOpen}
            onEmailOpen={handleEmailOpen}
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
            {sortedBookings.map((booking) => (
                <BookingRow 
                    key={booking.id}
                    booking={booking} 
                    showProperty={showProperty} 
                    origin={booking.originId ? originsMap.get(booking.originId) : undefined}
                    onEdit={handleEditClick}
                    onAddPayment={handleAddPaymentClick}
                    onAddExpense={handleAddExpenseClick}
                    onCalculatorOpen={handleCalculatorOpen}
                    onEmailOpen={handleEmailOpen}
                />
            ))}
        </TableBody>
    </Table>
  );

  return (
    <div>
        <div className="flex items-center space-x-4 mb-2 text-xs text-muted-foreground">
            <span className="font-semibold">Leyenda:</span>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-700 mr-1"></div>&lt; 30 días</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-orange-500/20 border border-orange-700 mr-1"></div>&lt; 15 días</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-700 mr-1"></div>&lt; 7 días</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-600 mr-1"></div>En Curso</div>
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
                onBookingUpdated={onDataChanged}
            />
        )}
        {addingPaymentForBookingId && (
             <PaymentAddForm
                bookingId={addingPaymentForBookingId}
                onPaymentAdded={onDataChanged}
                isOpen={isAddPaymentOpen}
                onOpenChange={setIsAddPaymentOpen}
                preloadData={paymentPreloadData}
            />
        )}
        {addingExpenseForBookingId && (
             <BookingExpenseAddForm
                bookingId={addingExpenseForBookingId}
                onExpenseAdded={onDataChanged}
                categories={expenseCategories}
                isOpen={isAddExpenseOpen}
                onOpenChange={setIsAddExpenseOpen}
            />
        )}
        {calculatorBooking && (
            <Dialog open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Calculadora de Pago para {calculatorBooking.tenant?.name}</DialogTitle>
                        <DialogDescription>Reserva en {calculatorBooking.property?.name}</DialogDescription>
                    </DialogHeader>
                    <PaymentCalculator 
                        booking={calculatorBooking}
                        onRegisterPayment={(data) => handleRegisterPayment(calculatorBooking.id, data)}
                        showTabs={true}
                    />
                </DialogContent>
            </Dialog>
        )}
        {emailBooking && (
             <EmailSender 
                booking={emailBooking} 
                isOpen={isEmailOpen}
                onOpenChange={setIsEmailOpen}
             />
        )}
    </div>
  );
}
