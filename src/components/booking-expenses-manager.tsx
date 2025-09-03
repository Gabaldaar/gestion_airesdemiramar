
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
import { Wallet } from 'lucide-react';
import { getBookingExpensesByBookingId, BookingExpense } from '@/lib/data';
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
import { BookingExpenseAddForm } from './booking-expense-add-form';
import { BookingExpenseEditForm } from './booking-expense-edit-form';
import { BookingExpenseDeleteForm } from './booking-expense-delete-form';

export function BookingExpensesManager({ bookingId }: { bookingId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [expenses, setExpenses] = useState<BookingExpense[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    const fetchedExpenses = await getBookingExpensesByBookingId(bookingId);
    setExpenses(fetchedExpenses);
    setIsLoading(false);
  }, [bookingId]);


  useEffect(() => {
    if (isOpen) {
      fetchExpenses();
    }
  }, [isOpen, fetchExpenses]);

  const handleExpenseAdded = useCallback(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' LLL, yyyy", { locale: es });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const totalAmount = expenses.reduce((acc, expense) => acc + expense.amount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Wallet className="h-4 w-4" />
          <span className="sr-only">Gestionar Gastos de Reserva</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Gastos de la Reserva</DialogTitle>
          <DialogDescription>
            Gestiona los gastos asociados a esta reserva.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
            <BookingExpenseAddForm bookingId={bookingId} onExpenseAdded={handleExpenseAdded}/>
        </div>
        {isLoading ? (
          <p>Cargando gastos...</p>
        ) : expenses.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No hay gastos para mostrar.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{formatDate(expense.date)}</TableCell>
                  <TableCell className="font-medium">{expense.description}</TableCell>
                  <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <BookingExpenseEditForm expense={expense} />
                      <BookingExpenseDeleteForm expenseId={expense.id} bookingId={bookingId} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
             <TableFooter>
                <TableRow>
                    <TableCell colSpan={2} className="font-bold text-right">Total</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(totalAmount)}</TableCell>
                    <TableCell></TableCell>
                </TableRow>
            </TableFooter>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
