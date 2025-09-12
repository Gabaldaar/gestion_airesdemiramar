

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PropertyExpense, ExpenseCategory } from "@/lib/data";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ExpenseEditForm } from "./expense-edit-form";
import { ExpenseDeleteForm } from "./expense-delete-form";

interface ExpensesListProps {
  expenses: PropertyExpense[];
  categories: ExpenseCategory[];
  onDataNeedsRefresh: () => void;
}

export default function ExpensesList({ expenses, categories, onDataNeedsRefresh }: ExpensesListProps) {
  if (expenses.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay gastos para mostrar.</p>;
  }

  const categoriesMap = new Map(categories.map(c => [c.id, c.name]));

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
  }

  const totalAmount = expenses.reduce((acc, expense) => acc + expense.amount, 0);

  return (
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
                    <ExpenseEditForm expense={expense} categories={categories} onExpenseUpdated={onDataNeedsRefresh} />
                    <ExpenseDeleteForm expenseId={expense.id} propertyId={expense.propertyId} onExpenseDeleted={onDataNeedsRefresh} />
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
  );
}
