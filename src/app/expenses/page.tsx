
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { getProperties, getAllExpensesUnified, getExpenseCategories, UnifiedExpense, Property, ExpenseCategory } from "@/lib/data";
import ExpensesClient from "@/components/expenses-client";
import { useAuth } from "@/components/auth-provider";
import { useEffect, useState } from "react";

interface ExpensesData {
    allExpenses: UnifiedExpense[];
    properties: Property[];
    categories: ExpenseCategory[];
}

export default function ExpensesPage() {
    const { user } = useAuth();
    const [data, setData] = useState<ExpensesData | null>(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        if (user) {
            setLoading(true);
            Promise.all([
                getAllExpensesUnified(),
                getProperties(),
                getExpenseCategories(),
            ]).then(([allExpenses, properties, categories]) => {
                setData({ allExpenses, properties, categories });
                setLoading(false);
            });
        }
    }, [user]);

    if (loading || !data) {
        return <p>Cargando gastos...</p>;
    }

  return (
    <Card>
    <CardHeader>
        <CardTitle>Control de Gastos</CardTitle>
        <CardDescription>Consulta y filtra todos los gastos de tu negocio.</CardDescription>
    </CardHeader>
    <CardContent>
        <ExpensesClient 
        initialExpenses={data.allExpenses} 
        properties={data.properties} 
        categories={data.categories}
        />
    </CardContent>
    </Card>
  );
}
