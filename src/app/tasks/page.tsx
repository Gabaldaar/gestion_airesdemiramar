'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { TaskWithDetails, Property, TaskCategory, Provider, ExpenseCategory, TaskScope, CurrencySettings, ExpenseWithDetails, Task, getTasks, getProperties, getProviders, getTaskCategories, getTaskScopes, getExpenseCategories, getExpenses, getCurrencySettings } from "@/lib/data";
import TasksClient from "@/components/tasks-client";
import { useAuth } from "@/components/auth-provider";
import { useEffect, useState, useCallback } from "react";
import { TaskAddForm } from "@/components/task-add-form";
import { PlusCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";

interface TasksData {
    tasks: TaskWithDetails[];
    properties: Property[];
    providers: Provider[];
    categories: TaskCategory[];
    scopes: TaskScope[];
    expenseCategories: ExpenseCategory[];
    allExpenses: ExpenseWithDetails[];
    currencySettings: CurrencySettings | null;
}

export default function TasksPage() {
    const { user, appUser, orgId } = useAuth();
    const { t } = useTranslation();
    const [data, setData] = useState<TasksData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    
    const isPersonalFlavor = appUser?.appFlavor !== 'commercial';

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const currentOrgId = orgId || 'global';
            const [tasksRaw, properties, providers, categories, scopes, expenseCategories, expensesRaw, currencySettings] = await Promise.all([
                getTasks(currentOrgId),
                getProperties(currentOrgId),
                getProviders(currentOrgId),
                getTaskCategories(currentOrgId),
                getTaskScopes(currentOrgId),
                getExpenseCategories(currentOrgId),
                getExpenses(currentOrgId),
                getCurrencySettings(currentOrgId),
            ]);

            const propsMap = new Map(properties.map(p => [p.id, p.name]));
            const scopesMap = new Map(scopes.map(s => [s.id, s.name]));
            const catsMap = new Map(categories.map(c => [c.id, c.name]));
            const provsMap = new Map(providers.map(p => [p.id, p.name]));

            const tasks: TaskWithDetails[] = tasksRaw.map(tData => {
                return {
                    ...tData,
                    assignmentName: tData.assignment?.type === 'property' ? propsMap.get(tData.assignment.id) : scopesMap.get(tData.assignment.id),
                    categoryName: tData.categoryId ? catsMap.get(tData.categoryId) : undefined,
                    providerName: tData.providerId ? provsMap.get(tData.providerId) : undefined
                } as TaskWithDetails;
            });

            const allExpenses: ExpenseWithDetails[] = expensesRaw.map(e => {
                return {
                    ...e,
                    amountUSD: e.originalUsdAmount || (e.currency === 'USD' ? e.amount : 0),
                    amountARS: e.currency === 'ARS' ? e.amount : (e.exchangeRate ? e.amount * e.exchangeRate : e.amount)
                } as ExpenseWithDetails;
            });

            setData({ tasks, properties, providers, categories, scopes, expenseCategories, allExpenses, currencySettings });
        } catch (err) {
            console.error("Error fetching tasks data:", err);
        } finally {
            setLoading(false);
        }
    }, [user, orgId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading && !data) {
        return <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

  if (!data) return null;

  return (
    <div className="flex-1 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-grow">
                <h2 className="text-3xl font-bold tracking-tight text-primary">{t('tasks.title')}</h2>
                <p className="text-muted-foreground">{t('tasks.description')}</p>
            </div>
            <div className="w-full sm:w-auto flex-shrink-0">
                <TaskAddForm
                    properties={data.properties}
                    providers={data.providers}
                    categories={data.categories}
                    scopes={data.scopes}
                    currencySettings={data.currencySettings}
                    isOpen={isAddOpen}
                    onOpenChange={setIsAddOpen}
                    onTaskAdded={fetchData}
                >
                    <Button onClick={() => setIsAddOpen(true)} className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t('tasks.new_task')}
                    </Button>
                </TaskAddForm>
            </div>
        </div>
        <Card>
            <CardContent className="pt-6">
                <TasksClient 
                    initialTasks={data.tasks} 
                    properties={data.properties} 
                    providers={data.providers}
                    categories={data.categories}
                    scopes={data.scopes}
                    expenseCategories={data.expenseCategories}
                    allExpenses={data.allExpenses}
                    onDataChanged={fetchData}
                    isPersonalFlavor={isPersonalFlavor}
                    currencySettings={data.currencySettings}
                />
            </CardContent>
        </Card>
    </div>
  );
}
