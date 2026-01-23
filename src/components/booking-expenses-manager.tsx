'use client';

import { useEffect, useState, useCallback, ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { getBookingExpensesByBookingId, BookingExpense, getExpenseCategories, ExpenseCategory, getBookingWithDetails, BookingWithDetails } from '@/lib/data';
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

interface BookingExpensesManagerProps {
    bookingId: string;
    children?: ReactNode;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onAddExpenseClick: () => void;
}


export function BookingExpensesManager({ bookingId, children, isOpen, onOpenChange, onAddExpenseClick }: BookingExpensesManagerProps) {
  const [expenses, setExpenses] = useState<BookingExpense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);


  const fetchExpensesAndBooking = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    const [fetchedExpenses, fetchedCategories, fetchedBooking] = await Promise.all([
        getBookingExpensesByBookingId(bookingId),
        getExpenseCategories(),
        getBookingWithDetails(bookingId)
    ]);
    setExpenses(fetchedExpenses);
    setCategories(fetchedCategories);
    setBooking(fetchedBooking);
    setIsLoading(false);
  }, [bookingId, isOpen]);

  const categoriesMap = new Map(categories.map(c => [c.id, c.name]));

  useEffect(() => {
      fetchExpensesAndBooking();
  }, [fetchExpensesAndBooking]);

  const handleExpenseAction = useCallback(() => {
    fetchExpensesAndBooking();
  }, [fetchExpensesAndBooking]);

  const handleAddNewExpense = () => {
      onOpenChange(false); // Close this manager dialog
      onAddExpenseClick(); // Trigger the add expense dialog from parent
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' LLL, yyyy", { locale: es });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const totalAmount = expenses.reduce((acc, expense) => acc + expense.amount, 0);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Gastos de la Reserva</DialogTitle>
            {booking && (
              <DialogDescription>
                Gestiona los gastos para la reserva de{' '}
                <span className="font-semibold text-foreground">{booking.tenant?.name || 'N/A'}</span> en{' '}
                <span className="font-semibold text-foreground">{booking.property?.name || 'N/A'}</span>.
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="flex justify-end">
              <Button onClick={handleAddNewExpense}>+ Añadir Gasto</Button>
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
                  <TableHead>Categoría</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{formatDate(expense.date)}</TableCell>
                    <TableCell>{expense.categoryId ? categoriesMap.get(expense.categoryId) : 'N/A'}</TableCell>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <BookingExpenseEditForm
                          expense={expense}
                          categories={categories}
                          onExpenseUpdated={handleExpenseAction}
                          context={booking ? { propertyName: booking.property?.name || 'N/A', tenantName: booking.tenant?.name || 'N/A'} : undefined} />
                        <BookingExpenseDeleteForm expenseId={expense.id} onExpenseDeleted={handleExpenseAction} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                  <TableRow>
                      <TableCell colSpan={3} className="font-bold text-right">Total</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(totalAmount)}</TableCell>
                      <TableCell></TableCell>
                  </TableRow>
              </TableFooter>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
