

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProperties, Property, getExpenseCategories, getEmailSettings, ExpenseCategory, EmailSettings, Origin, getOrigins, getAlertSettings, AlertSettings, getTaskCategories, TaskCategory, getProviderCategories, ProviderCategory, getTaskScopes, TaskScope, getProviders, Provider, AdjustmentCategory, getAdjustmentCategories } from "@/lib/data";
import { PropertyEditForm } from "@/components/property-edit-form";
import { PropertyAddForm } from "@/components/property-add-form";
import ExpenseCategoryManager from "@/components/expense-category-manager";
import { EmailSettingsManager } from "@/components/email-settings-manager";
import { AlertSettingsManager } from "@/components/alert-settings-manager";
import { useAuth } from "@/components/auth-provider";
import { useEffect, useState, useCallback } from "react";
import OriginManager from "@/components/origin-manager";
import TaskCategoryManager from "@/components/task-category-manager";
import ProviderCategoryManager from "@/components/provider-category-manager";
import TaskScopeManager from "@/components/task-scope-manager";
import AdjustmentCategoryManager from "@/components/adjustment-category-manager";

interface SettingsData {
    properties: Property[];
    expenseCategories: ExpenseCategory[];
    taskCategories: TaskCategory[];
    taskScopes: TaskScope[];
    providerCategories: ProviderCategory[];
    adjustmentCategories: AdjustmentCategory[];
    emailSettings: EmailSettings | null;
    alertSettings: AlertSettings | null;
    origins: Origin[];
    providers: Provider[];
}

const isPersonalFlavor = process.env.NEXT_PUBLIC_APP_FLAVOR !== 'commercial';

export default function SettingsPage() {
    const { user } = useAuth();
    const [data, setData] = useState<SettingsData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (user) {
            setLoading(true);
            const [properties, expenseCategories, taskCategories, providerCategories, emailSettings, alertSettings, origins, taskScopes, providers, adjustmentCategories] = await Promise.all([
                getProperties(),
                getExpenseCategories(),
                getTaskCategories(),
                getProviderCategories(),
                getEmailSettings(),
                getAlertSettings(),
                getOrigins(),
                getTaskScopes(),
                getProviders(),
                getAdjustmentCategories(),
            ]);
            setData({ properties, expenseCategories, taskCategories, providerCategories, emailSettings, alertSettings, origins, taskScopes, providers, adjustmentCategories });
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading || !data) {
        return <p>Cargando configuración...</p>
    }
    
    const { properties, expenseCategories, taskCategories, providerCategories, emailSettings, alertSettings, origins, taskScopes, providers, adjustmentCategories } = data;

  return (
    <Tabs defaultValue="properties" className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight text-primary">Configuración</h2>
                <p className="text-muted-foreground">Administra los datos de tu aplicación.</p>
            </div>
            <TabsList className="grid w-full sm:w-auto grid-cols-5 sm:grid-cols-5 lg:grid-cols-9 mb-4 sm:mb-0">
                <TabsTrigger value="properties">Propiedades</TabsTrigger>
                {isPersonalFlavor && <TabsTrigger value="origins">Orígenes</TabsTrigger>}
                <TabsTrigger value="expense-categories">Cat. Gastos</TabsTrigger>
                {isPersonalFlavor && <TabsTrigger value="provider-categories">Cat. Prov.</TabsTrigger>}
                <TabsTrigger value="task-categories">Cat. Tareas</TabsTrigger>
                {isPersonalFlavor && <TabsTrigger value="adjustment-categories">Cat. Ajustes</TabsTrigger>}
                {isPersonalFlavor && <TabsTrigger value="task-scopes">Ámbitos</TabsTrigger>}
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="alerts">Alertas</TabsTrigger>
            </TabsList>
        </div>

        <TabsContent value="properties">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Propiedades</CardTitle>
                        <CardDescription>
                        Administra los datos de tus propiedades.
                        </CardDescription>
                    </div>
                    <PropertyAddForm providers={providers} />
                </CardHeader>
                <CardContent>
                    {properties.length > 0 ? (
                        properties.map((property: Property) => (
                            <div key={property.id} className="border-t">
                                <PropertyEditForm property={property} providers={providers} />
                            </div>
                        ))
                    ) : (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">Aún no has añadido ninguna propiedad.</p>
                        <p className="text-sm text-muted-foreground">¡Crea tu primera propiedad para empezar!</p>
                    </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        {isPersonalFlavor && (
            <TabsContent value="origins">
                <Card>
                    <CardHeader>
                        <CardTitle>Orígenes de Inquilinos</CardTitle>
                        <CardDescription>
                            Crea y gestiona las fuentes de tus inquilinos (ej. Airbnb, Booking.com).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <OriginManager initialOrigins={origins} onOriginsChanged={fetchData} />
                    </CardContent>
                </Card>
            </TabsContent>
        )}
        <TabsContent value="expense-categories">
            <Card>
                <CardHeader>
                    <CardTitle>Categorías de Gastos</CardTitle>
                    <CardDescription>
                        Crea, edita y elimina las categorías para organizar tus gastos.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ExpenseCategoryManager initialCategories={expenseCategories} onCategoriesChanged={fetchData} />
                </CardContent>
            </Card>
        </TabsContent>
        {isPersonalFlavor && (
            <TabsContent value="provider-categories">
                <Card>
                    <CardHeader>
                        <CardTitle>Categorías de Proveedores</CardTitle>
                        <CardDescription>
                            Crea y gestiona las especialidades de tus proveedores (ej. Plomería, Electricidad).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ProviderCategoryManager initialCategories={providerCategories} onCategoriesChanged={fetchData} />
                    </CardContent>
                </Card>
            </TabsContent>
        )}
        <TabsContent value="task-categories">
            <Card>
                <CardHeader>
                    <CardTitle>Categorías de Tareas</CardTitle>
                    <CardDescription>
                        Crea, edita y elimina las categorías para organizar tus tareas de mantenimiento.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <TaskCategoryManager initialCategories={taskCategories} onCategoriesChanged={fetchData} />
                </CardContent>
            </Card>
        </TabsContent>
        {isPersonalFlavor && (
            <TabsContent value="adjustment-categories">
                <Card>
                    <CardHeader>
                        <CardTitle>Categorías de Ajuste</CardTitle>
                        <CardDescription>
                            Define los tipos de ajustes manuales para las liquidaciones (ej: bonos, adelantos).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AdjustmentCategoryManager initialCategories={adjustmentCategories} onCategoriesChanged={fetchData} />
                    </CardContent>
                </Card>
            </TabsContent>
        )}
        {isPersonalFlavor && (
            <TabsContent value="task-scopes">
                <Card>
                    <CardHeader>
                        <CardTitle>Ámbitos de Tareas</CardTitle>
                        <CardDescription>
                            Crea y gestiona los contextos para tareas no asociadas a una propiedad (ej. Contabilidad, Marketing).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TaskScopeManager initialScopes={taskScopes} onScopesChanged={fetchData} />
                    </CardContent>
                </Card>
            </TabsContent>
        )}
        <TabsContent value="email">
            <Card>
                <CardHeader>
                    <CardTitle>Configuración de Email</CardTitle>
                    <CardDescription>
                        Gestiona las opciones de envío de correo electrónico.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <EmailSettingsManager initialSettings={emailSettings} />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="alerts">
            <Card>
                <CardHeader>
                    <CardTitle>Configuración de Alertas</CardTitle>
                    <CardDescription>
                        Define con cuántos días de anticipación quieres ver las alertas en el Dashboard.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertSettingsManager initialSettings={alertSettings} />
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs>
  );
}
