
'use client';

import { useEffect, useState, useCallback } from 'react';
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
import { getPaymentsByBookingId, Payment } from '@/lib/data';
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

export function BookingPaymentsManager({ bookingId, bookingCurrency }: { bookingId: string, bookingCurrency: 'ARS' | 'USD' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPayments = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    try {
      const fetchedPayments = await getPaymentsByBookingId(bookingId);
      setPayments(fetchedPayments);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      setPayments([]); // Clear payments on error
    } finally {
      setIsLoading(false);
    }
  }, [bookingId, isOpen]);


  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handlePaymentAction = useCallback(() => {
    fetchPayments();
  }, [fetchPayments]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' LLL, yyyy", { locale: es });
  };

  const formatCurrency = (amount: number, currency: 'ARS' | 'USD') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const totalAmount = payments.reduce((acc, payment) => acc + payment.amount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Landmark className="h-4 w-4" />
          <span className="sr-only">Gestionar Pagos</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Pagos de la Reserva</DialogTitle>
          <DialogDescription>
            Gestiona los pagos recibidos para esta reserva.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
            <PaymentAddForm bookingId={bookingId} onPaymentAdded={handlePaymentAction} defaultCurrency={bookingCurrency} />
        </div>
        {isLoading ? (
          <p>Cargando pagos...</p>
        ) : payments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No hay pagos para mostrar.</p>
        ) : (
          <div className="overflow-y-auto max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.date)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(payment.amount, payment.currency)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <PaymentEditForm payment={payment} onPaymentUpdated={handlePaymentAction} />
                        <PaymentDeleteForm paymentId={payment.id} onPaymentDeleted={handlePaymentAction} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                  <TableRow>
                      <TableCell className="font-bold text-right">Total</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(totalAmount, bookingCurrency)}</TableCell>
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
