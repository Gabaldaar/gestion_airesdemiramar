
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
import { Landmark, Mail } from 'lucide-react';
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

interface BookingPaymentsManagerProps {
    bookingId: string;
    children: ReactNode;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}


export function BookingPaymentsManager({ bookingId, children, isOpen, onOpenChange }: BookingPaymentsManagerProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [isEmailSenderOpen, setIsEmailSenderOpen] = useState(false);
  const [selectedPaymentForEmail, setSelectedPaymentForEmail] = useState<Payment | undefined>(undefined);
  
  const fetchPaymentsAndBooking = useCallback(async () => {
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
        console.error("Error fetching payments or booking:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudieron cargar los datos de pagos.",
        });
    } finally {
        setIsLoading(false);
    }
  }, [bookingId, isOpen, toast]);


  useEffect(() => {
      fetchPaymentsAndBooking();
  }, [fetchPaymentsAndBooking]);

  const handlePaymentAction = useCallback(() => {
    fetchPaymentsAndBooking(); // Re-fetch payments after an action
  }, [fetchPaymentsAndBooking]);

  const openEmailSender = (payment: Payment) => {
    setSelectedPaymentForEmail(payment);
    setIsEmailSenderOpen(true);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' LLL, yyyy", { locale: es });
  };

  const formatCurrency = (amount: number, currency: 'USD' | 'ARS') => {
    if (!currency) return '...'; // Safeguard for initial render
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Pagos de la Reserva</DialogTitle>
            <DialogDescription>
              Gestiona los pagos recibidos para esta reserva.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
              <PaymentAddForm bookingId={bookingId} onPaymentAdded={handlePaymentAction} />
          </div>
          {isLoading ? (
            <p>Cargando pagos...</p>
          ) : payments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No hay pagos para mostrar.</p>
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
                {payments.map((payment) => (
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
                ))}
              </TableBody>
              <TableFooter>
                  <TableRow>
                      <TableCell colSpan={2} className="font-bold text-right">Total Pagado</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(totalAmount, 'USD')}</TableCell>
                      <TableCell></TableCell>
                  </TableRow>
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
