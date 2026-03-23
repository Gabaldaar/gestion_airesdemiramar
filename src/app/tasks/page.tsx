

'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { getProperties, getTasks, TaskWithDetails, Property, getTaskCategories, TaskCategory, getProviders, Provider, getExpenseCategories, ExpenseCategory } from "@/lib/data";
import TasksClient from "@/components/tasks-client";
import { useAuth } from "@/components/auth-provider";
import { useEffect, useState, useCallback } from "react";
import { TaskAddForm } from "@/components/task-add-form";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TasksData {
    tasks: TaskWithDetails[];
    properties: Property[];
    providers: Provider[];
    categories: TaskCategory[];
    expenseCategories: ExpenseCategory[];
}

export default function TasksPage() {
    const { user } = useAuth();
    const [data, setData] = useState<TasksData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    
    const fetchData = useCallback(async () => {
        if (user) {
            setLoading(true);
            Promise.all([
                getTasks(),
                getProperties(),
                getProviders(),
                getTaskCategories(),
                getExpenseCategories(),
            ]).then(([tasks, properties, providers, categories, expenseCategories]) => {
                setData({ tasks, properties, providers, categories, expenseCategories });
                setLoading(false);
            });
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading || !data) {
        return <p>Cargando tareas...</p>;
    }

  return (
    <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-grow">
                <CardTitle>Gestión de Tareas</CardTitle>
                <CardDescription>Consulta y filtra las tareas.</CardDescription>
            </div>
            <div className="w-full sm:w-auto flex-shrink-0">
                <TaskAddForm
                    properties={data.properties}
                    providers={data.providers}
                    categories={data.categories}
                    isOpen={isAddOpen}
                    onOpenChange={setIsAddOpen}
                    onTaskAdded={fetchData}
                >
                    <Button onClick={() => setIsAddOpen(true)} className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nueva Tarea
                    </Button>
                </TaskAddForm>
            </div>
        </CardHeader>
        <CardContent>
            <TasksClient 
                initialTasks={data.tasks} 
                properties={data.properties} 
                providers={data.providers}
                categories={data.categories}
                expenseCategories={data.expenseCategories}
                onDataChanged={fetchData}
            />
        </CardContent>
    </Card>
  );
}
