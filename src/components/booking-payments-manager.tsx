

'use client';

import { useEffect, useState, useCallback, ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Landmark } from 'lucide-react';
import { getPaymentsByBookingId, Payment, getBookingWithDetails, BookingWithDetails } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PaymentAddForm } from './payment-add-form';
import { PaymentEditForm } from './payment-edit-form';
import { PaymentDeleteForm } from './payment-delete-form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { EmailSender } from './email-sender';

interface BookingPaymentsManagerProps {
    bookingId: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: ReactNode;
}

export function BookingPaymentsManager({ bookingId, open, onOpenChange, children }: BookingPaymentsManagerProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isControlled = open !== undefined && onOpenChange !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };


  const fetchData = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    try {
      const [fetchedPayments, fetchedBooking] = await Promise.all([
        getPaymentsByBookingId(bookingId),
        getBookingWithDetails(bookingId)
      ]);
      setPayments(fetchedPayments);
      setBooking(fetchedBooking);
    } catch (error) {
      console.error("Failed to fetch payments or booking:", error);
      setPayments([]);
      setBooking(null);
    } finally {
      setIsLoading(false);
    }
  }, [bookingId, isOpen]);


  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePaymentAction = useCallback(() => {
    fetchData();
  }, [fetchData]);
  
  const trigger = children ?? (
      <Button variant="ghost" size="icon">
          <Landmark className="h-4 w-4" />
          <span className="sr-only">Gestionar Pagos</span>
      </Button>
  );


  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' LLL, yyyy", { locale: es });
  };

  const formatCurrency = (amount: number) => {
    return `USD ${new Intl.NumberFormat('es-AR', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)}`;
  };

  const totalAmount = payments.reduce((acc, payment) => acc + payment.amount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Pagos de la Reserva</DialogTitle>
          <DialogDescription>
            Gestiona los pagos recibidos para esta reserva. Todos los montos se muestran en USD.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
            <PaymentAddForm bookingId={bookingId} onPaymentAdded={handlePaymentAction} />
        </div>
        {isLoading || !booking ? (
          <p>Cargando pagos...</p>
        ) : payments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No hay pagos para mostrar.</p>
        ) : (
          <div className="overflow-y-auto max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Monto (USD)</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.date)}</TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className='block truncate'>{payment.description || '-'}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="whitespace-pre-wrap max-w-xs">{payment.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <EmailSender booking={booking} payment={payment} />
                        <PaymentEditForm payment={payment} onPaymentUpdated={handlePaymentAction} />
                        <PaymentDeleteForm paymentId={payment.id} onPaymentDeleted={handlePaymentAction} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                  <TableRow>
                      <TableCell colSpan={2} className="font-bold text-right">Total (USD)</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(totalAmount)}</TableCell>
                      <TableCell></TableCell>
                  </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
