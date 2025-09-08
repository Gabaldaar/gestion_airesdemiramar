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
import { Wallet } from 'lucide-react';
import { getBookingExpensesByBookingId, BookingExpense, getExpenseCategories, ExpenseCategory } from '@/lib/data';
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
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: ReactNode;
}


export function BookingExpensesManager({ bookingId, open, onOpenChange, children }: BookingExpensesManagerProps) {
  const [expenses, setExpenses] = useState<BookingExpense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
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


  const fetchExpensesAndCategories = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    const [fetchedExpenses, fetchedCategories] = await Promise.all([
        getBookingExpensesByBookingId(bookingId),
        getExpenseCategories()
    ]);
    setExpenses(fetchedExpenses);
    setCategories(fetchedCategories);
    setIsLoading(false);
  }, [bookingId, isOpen]);

  const categoriesMap = new Map(categories.map(c => [c.id, c.name]));

  useEffect(() => {
      fetchExpensesAndCategories();
  }, [fetchExpensesAndCategories]);

  const handleExpenseAction = useCallback(() => {
    fetchExpensesAndCategories();
  }, [fetchExpensesAndCategories]);

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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Gastos de la Reserva</DialogTitle>
          <DialogDescription>
            Gestiona los gastos asociados a esta reserva.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
            <BookingExpenseAddForm bookingId={bookingId} onExpenseAdded={handleExpenseAction} categories={categories}/>
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
                      <BookingExpenseEditForm expense={expense} categories={categories} />
                      <BookingExpenseDeleteForm expenseId={expense.id} bookingId={bookingId} />
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
  );
}
