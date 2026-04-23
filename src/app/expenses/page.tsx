
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { getProperties, getAllExpensesUnified, getExpenseCategories, ExpenseWithDetails, Property, ExpenseCategory, Provider, getProviders } from "@/lib/data";
import ExpensesClient from "@/components/expenses-client";
import { useAuth } from "@/components/auth-provider";
import { useEffect, useState, useCallback } from "react";

interface ExpensesData {
    allExpenses: ExpenseWithDetails[];
    properties: Property[];
    categories: ExpenseCategory[];
    providers: Provider[];
}

export default function ExpensesPage() {
    const { user } = useAuth();
    const [data, setData] = useState<ExpensesData | null>(null);
    const [loading, setLoading] = useState(true);
    
    const fetchData = useCallback(async () => {
        if (user) {
            setLoading(true);
            try {
                const [allExpenses, properties, categories, providers] = await Promise.all([
                    getAllExpensesUnified(),
                    getProperties(),
                    getExpenseCategories(),
                    getProviders(),
                ]);
                setData({ allExpenses, properties, categories, providers });
            } catch (error) {
                console.error("Failed to fetch expenses data:", error);
            } finally {
                setLoading(false);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
        providers={data.providers}
        onDataChanged={fetchData}
        />
    </CardContent>
    </Card>
  );
}
