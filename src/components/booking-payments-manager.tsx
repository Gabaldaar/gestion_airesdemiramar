'use client';

import { useEffect, useState, useCallback, ReactNode, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { getPaymentsByBookingId, Payment, getBookingWithDetails } from '@/lib/data';
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
import { useToast } from '@/components/ui/use-toast';
import { EmailSender } from './email-sender';
import { BookingWithDetails } from '@/lib/data';
import { cn } from '@/lib/utils';

interface BookingPaymentsManagerProps {
    bookingId: string;
    children: ReactNode;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onAddPaymentClick: () => void;
}


export function BookingPaymentsManager({ bookingId, children, isOpen, onOpenChange, onAddPaymentClick }: BookingPaymentsManagerProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [isEmailSenderOpen, setIsEmailSenderOpen] = useState(false);
  const [selectedPaymentForEmail, setSelectedPaymentForEmail] = useState<Payment | undefined>(undefined);
  const [dollarRate, setDollarRate] = useState<number | null>(null);
  
  const fetchPaymentsAndBooking = useCallback(async () => {
    setIsLoading(true);
    try {
        const [fetchedPayments, fetchedBooking] = await Promise.all([
            getPaymentsByBookingId(bookingId),
            getBookingWithDetails(bookingId)
        ]);
        setPayments(fetchedPayments);
        setBooking(fetchedBooking);
    } catch (error) {
        console.error("Error fetching payments or booking:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudieron cargar los datos de pagos.",
        });
    } finally {
        setIsLoading(false);
    }
  }, [bookingId, toast]);

  const fetchDollarRate = useCallback(async () => {
    try {
      const response = await fetch('/api/dollar-rate?type=blue');
      if (response.ok) {
        const data = await response.json();
        setDollarRate(data.venta);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo obtener el valor del dólar.' });
      }
    } catch (error) {
      console.error('Failed to fetch dollar rate', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo conectar para obtener el valor del dólar.' });
    }
  }, [toast]);


  useEffect(() => {
    if (isOpen) {
      fetchPaymentsAndBooking();
      fetchDollarRate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handlePaymentAction = useCallback(() => {
    fetchPaymentsAndBooking(); // Re-fetch payments after an action
  }, [fetchPaymentsAndBooking]);

  const openEmailSender = (payment: Payment) => {
    setSelectedPaymentForEmail(payment);
    setIsEmailSenderOpen(true);
  };
  
  const handleAddNewPayment = () => {
      onOpenChange(false); // Close this manager dialog
      onAddPaymentClick(); // Trigger the add payment dialog from parent
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' LLL, yyyy", { locale: es });
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

  const totalAmount = payments.reduce((acc, payment) => acc + payment.amount, 0);

  const balanceUSD = useMemo(() => {
    if (!booking) return 0;
    if (booking.currency === 'USD') return booking.balance;
    if (!dollarRate) return 0;
    return booking.balance / dollarRate;
  }, [booking, dollarRate]);

  const balanceARS = useMemo(() => {
    if (!booking) return 0;
    if (booking.currency === 'ARS') return booking.balance;
    if (!dollarRate) return 0;
    return booking.balance * dollarRate;
  }, [booking, dollarRate]);


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Pagos de la Reserva</DialogTitle>
            {booking && (
              <DialogDescription>
                Gestiona los pagos recibidos para la reserva de{' '}
                <span className="font-semibold text-foreground">{booking.tenant?.name || 'N/A'}</span> en{' '}
                <span className="font-semibold text-foreground">{booking.property?.name || 'N/A'}</span>.
              </DialogDescription>
            )}
          </DialogHeader>
          
           <div className="flex justify-end">
                <Button onClick={handleAddNewPayment}>+ Añadir Pago</Button>
          </div>

          {isLoading ? (
            <p>Cargando pagos...</p>
          ) : (
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
                {payments.length > 0 ? (
                    payments.map((payment) => (
                    <TableRow key={payment.id}>
                        <TableCell>{formatDate(payment.date)}</TableCell>
                        <TableCell className="font-medium">{payment.description}</TableCell>
                        <TableCell className="text-right">{formatCurrency(payment.amount, 'USD')}</TableCell>
                        <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEmailSender(payment)} disabled={!booking?.tenant?.email}>
                                <Mail className="h-4 w-4" />
                                <span className="sr-only">Enviar confirmación de pago</span>
                            </Button>
                            <PaymentEditForm payment={payment} onPaymentUpdated={handlePaymentAction} />
                            <PaymentDeleteForm paymentId={payment.id} onPaymentDeleted={handlePaymentAction} />
                        </div>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            No hay pagos registrados.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
              <TableFooter>
                  <TableRow>
                      <TableCell colSpan={2} className="font-bold text-right">Total Pagado</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(totalAmount, 'USD')}</TableCell>
                      <TableCell></TableCell>
                  </TableRow>
                  {booking && (
                    <TableRow>
                        <TableCell colSpan={2} className="font-bold text-right">Saldo Pendiente</TableCell>
                        <TableCell className={cn("text-right font-bold", booking.balance > 0 ? 'text-orange-600' : 'text-green-600')}>
                             {dollarRate ? (
                                <>
                                    <div>{formatCurrency(balanceUSD, 'USD')}</div>
                                    <div className="text-xs font-normal text-muted-foreground">{formatCurrency(balanceARS, 'ARS')}</div>
                                    <div className="text-xs font-normal text-muted-foreground">(1 USD = {formatCurrency(dollarRate, 'ARS')})</div>
                                </>
                             ) : (
                                formatCurrency(booking.balance, booking.currency)
                             )}
                        </TableCell>
                        <TableCell></TableCell>
                    </TableRow>
                  )}
              </TableFooter>
            </Table>
          )}
        </DialogContent>
      </Dialog>
      {booking && (
          <EmailSender 
            booking={booking} 
            payment={selectedPaymentForEmail}
            isOpen={isEmailSenderOpen}
            onOpenChange={setIsEmailSenderOpen}
          />
      )}
    </>
  );
}
