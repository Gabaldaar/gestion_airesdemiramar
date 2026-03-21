
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { getProperties, getTasks, TaskWithDetails, Property, getTaskCategories, TaskCategory, getProviders, Provider } from "@/lib/data";
import TasksClient from "@/components/tasks-client";
import { useAuth } from "@/components/auth-provider";
import { useEffect, useState, useCallback } from "react";
import { TaskAddForm } from "@/components/task-add-form";
import { PlusCircle } from "lucide-react";

interface TasksData {
    tasks: TaskWithDetails[];
    properties: Property[];
    providers: Provider[];
    categories: TaskCategory[];
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
            ]).then(([tasks, properties, providers, categories]) => {
                setData({ tasks, properties, providers, categories });
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
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Gestión de Tareas</CardTitle>
                <CardDescription>Consulta y filtra todas las tareas de mantenimiento y mejoras.</CardDescription>
            </div>
            <TaskAddForm
                properties={data.properties}
                providers={data.providers}
                categories={data.categories}
                isOpen={isAddOpen}
                onOpenChange={setIsAddOpen}
                onTaskAdded={fetchData}
            >
                <button className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2" onClick={() => setIsAddOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nueva Tarea
                </button>
            </TaskAddForm>
        </CardHeader>
        <CardContent>
            <TasksClient 
                initialTasks={data.tasks} 
                properties={data.properties} 
                providers={data.providers}
                categories={data.categories}
                onDataChanged={fetchData}
            />
        </CardContent>
    </Card>
  );
}
