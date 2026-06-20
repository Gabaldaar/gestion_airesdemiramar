
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { 
    ExpenseWithDetails, Property, ExpenseCategory, Provider, TaskScope, CurrencySettings, Expense,
    getExpenses, getProperties, getExpenseCategories, getProviders, getTaskScopes, getCurrencySettings
} from "@/lib/data";
import ExpensesClient from "@/components/expenses-client";
import { useAuth } from "@/components/auth-provider";
import { useEffect, useState, useCallback } from "react";
import { Loader2, PlusCircle } from 'lucide-react';
import { ExpenseAddForm } from "@/components/expense-add-form";
import { useTranslation } from "@/i18n/useTranslation";
import { parseAssignment } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ExpensesData {
    allExpenses: ExpenseWithDetails[];
    properties: Property[];
    categories: ExpenseCategory[];
    providers: Provider[];
    scopes: TaskScope[];
    currencySettings: CurrencySettings | null;
}

export default function ExpensesPage() {
    const { user, appUser, orgId } = useAuth();
    const { t } = useTranslation();
    const [data, setData] = useState<ExpensesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    
    const isPersonalFlavor = appUser?.appFlavor !== 'commercial';

    const fetchData = useCallback(async () => {
        if (!user || !orgId) return;
        setLoading(true);
        try {
            const currentOrgId = orgId || 'global';
            
            const [
                expRaw, 
                properties, 
                categories, 
                providers, 
                scopes, 
                currencySettings
            ] = await Promise.all([
                getExpenses(currentOrgId),
                getProperties(currentOrgId),
                getExpenseCategories(currentOrgId),
                getProviders(currentOrgId),
                getTaskScopes(currentOrgId),
                getCurrencySettings(currentOrgId)
            ]);

            const propsMap = new Map(properties.map((p: any) => [p.id, p.name]));
            const scopesMap = new Map(scopes.map((s: any) => [s.id, s.name]));
            const catsMap = new Map(categories.map((c: any) => [c.id, c.name]));
            const provsMap = new Map(providers.map((p: any) => [p.id, p.name]));

            const allExpenses: ExpenseWithDetails[] = expRaw.map((e: any) => {
                const parsed = parseAssignment(e.assignment);
                return {
                    ...e,
                    assignmentName: parsed.type === 'property' 
                        ? (propsMap.get(parsed.id) || 'N/A') 
                        : (scopesMap.get(parsed.id) || (parsed.id === 'administracion' ? 'Administración' : 'N/A')),
                    categoryName: e.categoryId ? catsMap.get(e.categoryId) : undefined,
                    providerName: e.providerId ? provsMap.get(e.providerId) : undefined,
                    type: parsed.type === 'property' ? 'Propiedad' : 'Ámbito',
                    amountUSD: e.originalUsdAmount || (e.currency === 'USD' ? e.amount : 0),
                    amountARS: e.currency === 'ARS' ? e.amount : (e.exchangeRate ? e.amount * e.exchangeRate : e.amount)
                } as ExpenseWithDetails;
            });

            setData({ 
                allExpenses, 
                properties: properties as Property[], 
                categories: categories as ExpenseCategory[], 
                providers: providers as Provider[], 
                scopes: scopes as TaskScope[], 
                currencySettings 
            });
        } catch (error) {
            console.error("Failed to fetch expenses data:", error);
        } finally {
            setLoading(false);
        }
    }, [user, orgId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading || !data) {
        return (
            <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                {t('common.loading')}
            </div>
        );
    }

  return (
    <div className="flex-1 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-primary">{t('expenses.title')}</h2>
                <p className="text-muted-foreground">{t('expenses.description')}</p>
            </div>
            <div className="flex-shrink-0">
                <ExpenseAddForm 
                    assignment={{ type: 'scope', id: 'otros' }} 
                    categories={data.categories} 
                    providers={data.providers} 
                    properties={data.properties}
                    scopes={data.scopes}
                    isOpen={isAddOpen} 
                    onOpenChange={setIsAddOpen} 
                    onExpenseAdded={fetchData} 
                    currencySettings={data.currencySettings} 
                >
                    <Button onClick={() => setIsAddOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nuevo Gasto
                    </Button>
                </ExpenseAddForm>
            </div>
        </div>
        <Card>
            <CardContent className="pt-6">
                <ExpensesClient 
                    initialExpenses={data.allExpenses} 
                    properties={data.properties} 
                    categories={data.categories}
                    providers={data.providers}
                    scopes={data.scopes}
                    onDataChanged={fetchData}
                    isPersonalFlavor={isPersonalFlavor}
                />
            </CardContent>
        </Card>
    </div>
  );
}
