

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

interface ExpensesUnifiedListProps {
  expenses: UnifiedExpense[];
  categories: ExpenseCategory[];
}

export default function ExpensesUnifiedList({ expenses, categories }: ExpensesUnifiedListProps) {

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
  
  const totalAmountARS = expenses.reduce((acc, expense) => acc + expense.amountARS, 0);
  const totalAmountUSD = expenses.reduce((acc, expense) => acc + expense.amountUSD, 0);

  if (expenses.length === 0) {
    return <p className="text-sm text-center text-muted-foreground py-8">No hay gastos para mostrar con los filtros seleccionados.</p>;
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
                <div className="flex items-center justify-end gap-2">
                    {expense.type === 'Propiedad' ? (
                        <>
                            <ExpenseEditForm expense={expense as PropertyExpense} categories={categories} />
                            <ExpenseDeleteForm expenseId={expense.id} propertyId={(expense as PropertyExpense).propertyId} />
                        </>
                    ) : (
                        <>
                            <BookingExpenseEditForm expense={expense as BookingExpense} categories={categories} />
                            <BookingExpenseDeleteForm expenseId={expense.id} bookingId={(expense as BookingExpense).bookingId} />
                        </>
                    )}
                </div>
            </TableCell>
          </TableRow>
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
