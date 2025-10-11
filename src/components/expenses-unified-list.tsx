

'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UnifiedExpense, ExpenseCategory, PropertyExpense, BookingExpense } from "@/lib/data";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ExpenseEditForm } from "./expense-edit-form";
import { BookingExpenseEditForm } from "./booking-expense-edit-form";
import { ExpenseDeleteForm } from "./expense-delete-form";
import { BookingExpenseDeleteForm } from "./booking-expense-delete-form";
import useWindowSize from '@/hooks/use-window-size';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

interface ExpensesUnifiedListProps {
  expenses: UnifiedExpense[];
  categories: ExpenseCategory[];
}

const handleAction = () => {
    window.location.reload();
};

const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' LLL, yyyy", { locale: es });
};

const formatCurrency = (amount: number, currency: 'USD' | 'ARS') => {
    const options: Intl.NumberFormatOptions = {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    };
    if (currency === 'ARS') {
      return new Intl.NumberFormat('es-AR', { ...options, style: 'currency', currency: 'ARS'}).format(amount);
    }
    return `USD ${new Intl.NumberFormat('es-AR', options).format(amount)}`;
}

function ExpenseActions({ expense, categories }: { expense: UnifiedExpense; categories: ExpenseCategory[] }) {
    return (
        <div className="flex items-center justify-end gap-2">
            {expense.type === 'Propiedad' ? (
                <>
                    <ExpenseEditForm expense={expense as PropertyExpense} categories={categories} />
                    <ExpenseDeleteForm expenseId={expense.id} onExpenseDeleted={handleAction} />
                </>
            ) : (
                <>
                    <BookingExpenseEditForm expense={expense as BookingExpense} categories={categories} />
                    <BookingExpenseDeleteForm expenseId={expense.id} onExpenseDeleted={handleAction} />
                </>
            )}
        </div>
    );
}

function ExpenseRow({ expense, categories }: { expense: UnifiedExpense; categories: ExpenseCategory[] }) {
    return (
        <TableRow key={expense.id}>
            <TableCell>{formatDate(expense.date)}</TableCell>
            <TableCell>{expense.propertyName}</TableCell>
            <TableCell>
                <Badge variant={expense.type === 'Propiedad' ? 'secondary' : 'outline'}>
                    {expense.type}
                </Badge>
            </TableCell>
            <TableCell>{expense.categoryName || 'N/A'}</TableCell>
            <TableCell className="font-medium max-w-xs truncate">{expense.description}</TableCell>
            <TableCell>{expense.tenantName || 'N/A'}</TableCell>
            <TableCell className="text-right">{formatCurrency(expense.amountARS, 'ARS')}</TableCell>
            <TableCell className="text-right">{formatCurrency(expense.amountUSD, 'USD')}</TableCell>
            <TableCell className="text-right">
                <ExpenseActions expense={expense} categories={categories} />
            </TableCell>
        </TableRow>
    );
}

function ExpenseCard({ expense, categories }: { expense: UnifiedExpense; categories: ExpenseCategory[] }) {
    return (
        <Card>
            <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">{expense.propertyName || 'N/A'}</CardTitle>
                        <CardDescription>{formatDate(expense.date)}</CardDescription>
                    </div>
                    <Badge variant={expense.type === 'Propiedad' ? 'secondary' : 'outline'}>
                        {expense.type}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 grid gap-2 text-sm">
                <div className="flex justify-between col-span-2">
                    <span className="font-bold text-lg text-primary">{formatCurrency(expense.amountUSD, 'USD')}</span>
                    <span className="text-muted-foreground">{formatCurrency(expense.amountARS, 'ARS')}</span>
                </div>

                {expense.categoryName && <div className="flex justify-between"><span className="text-muted-foreground">Categoría</span><span className="font-medium">{expense.categoryName}</span></div>}
                {expense.tenantName && <div className="flex justify-between"><span className="text-muted-foreground">Inquilino</span><span className="font-medium">{expense.tenantName}</span></div>}
                
                {expense.description && (
                    <div className="flex flex-col space-y-1 pt-2">
                        <span className="text-muted-foreground">Descripción</span>
                        <p className="font-medium text-sm p-2 bg-muted/50 rounded-md whitespace-pre-wrap">{expense.description}</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-2 justify-end">
                <ExpenseActions expense={expense} categories={categories} />
            </CardFooter>
        </Card>
    );
}


export default function ExpensesUnifiedList({ expenses, categories }: ExpensesUnifiedListProps) {
  const { width } = useWindowSize();
  const isMobile = width < 768;

  if (expenses.length === 0) {
    return <p className="text-sm text-center text-muted-foreground py-8">No hay gastos para mostrar con los filtros seleccionados.</p>;
  }
  
  const totalAmountARS = expenses.reduce((acc, expense) => acc + expense.amountARS, 0);
  const totalAmountUSD = expenses.reduce((acc, expense) => acc + expense.amountUSD, 0);

  if (isMobile) {
      return (
        <div className="space-y-4">
            <Card className="bg-muted">
                <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Total Gastado</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(totalAmountUSD, 'USD')}</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(totalAmountARS, 'ARS')}</p>
                </CardContent>
            </Card>
            {expenses.map(expense => (
                <ExpenseCard key={expense.id} expense={expense} categories={categories} />
            ))}
        </div>
      )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Propiedad</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead>Inquilino</TableHead>
          <TableHead className="text-right">Monto (ARS)</TableHead>
          <TableHead className="text-right">Monto (USD)</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((expense) => (
          <ExpenseRow key={expense.id} expense={expense} categories={categories} />
        ))}
      </TableBody>
      <TableFooter>
        <TableRow className="font-bold bg-muted">
          <TableCell colSpan={6} className="text-right">Total</TableCell>
          <TableCell className="text-right">{formatCurrency(totalAmountARS, 'ARS')}</TableCell>
          <TableCell className="text-right">{formatCurrency(totalAmountUSD, 'USD')}</TableCell>
          <TableCell></TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
