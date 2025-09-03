
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PropertyExpense } from "@/lib/data";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Pencil, Trash2 } from "lucide-react";

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
          <TableHead>Monto</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((expense) => (
          <TableRow key={expense.id}>
            <TableCell>{formatDate(expense.date)}</TableCell>
            <TableCell className="font-medium">{expense.description}</TableCell>
            <TableCell>{formatCurrency(expense.amount)}</TableCell>
            <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar Gasto</span>
                    </Button>
                     <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                         <span className="sr-only">Borrar Gasto</span>
                    </Button>
                </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
