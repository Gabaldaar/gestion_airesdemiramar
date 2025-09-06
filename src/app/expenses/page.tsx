
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { getProperties, getAllExpensesUnified, getExpenseCategories } from "@/lib/data";
import ExpensesClient from "@/components/expenses-client";
import MainLayout from "@/components/main-layout";

export default async function ExpensesPage() {
  const [allExpenses, properties, categories] = await Promise.all([
    getAllExpensesUnified(),
    getProperties(),
    getExpenseCategories(),
  ]);

  return (
    <MainLayout>
        <Card>
        <CardHeader>
            <CardTitle>Control de Gastos</CardTitle>
            <CardDescription>Consulta y filtra todos los gastos de tu negocio.</CardDescription>
        </CardHeader>
        <CardContent>
            <ExpensesClient 
            initialExpenses={allExpenses} 
            properties={properties} 
            categories={categories}
            />
        </CardContent>
        </Card>
    </MainLayout>
  );
}
