
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PropertyExpense } from "@/lib/data";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ExpensesListProps {
  expenses: PropertyExpense[];
}

export default function ExpensesList({ expenses }: ExpensesListProps) {
  if (expenses.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay gastos para mostrar.</p>;
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' LLL, yyyy", { locale: es });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead className="text-right">Monto</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((expense) => (
          <TableRow key={expense.id}>
            <TableCell>{formatDate(expense.date)}</TableCell>
            <TableCell className="font-medium">{expense.description}</TableCell>
            <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
