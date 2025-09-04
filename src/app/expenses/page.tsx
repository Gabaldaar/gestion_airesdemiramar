
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { getProperties, getAllExpensesUnified } from "@/lib/data";
import ExpensesClient from "@/components/expenses-client";

export default async function ExpensesPage() {
  const [allExpenses, properties] = await Promise.all([
    getAllExpensesUnified(),
    getProperties(),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Control de Gastos</CardTitle>
        <CardDescription>Consulta y filtra todos los gastos de tu negocio.</CardDescription>
      </CardHeader>
      <CardContent>
        <ExpensesClient 
          initialExpenses={allExpenses} 
          properties={properties} 
        />
      </CardContent>
    </Card>
  );
}
