
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProperties, Property, getExpenseCategories, getEmailSettings, ExpenseCategory, EmailSettings, Origin, getOrigins } from "@/lib/data";
import { PropertyEditForm } from "@/components/property-edit-form";
import { PropertyAddForm } from "@/components/property-add-form";
import ExpenseCategoryManager from "@/components/expense-category-manager";
import { EmailSettingsManager } from "@/components/email-settings-manager";
import { useAuth } from "@/components/auth-provider";
import { useEffect, useState, useCallback } from "react";
import OriginManager from "@/components/origin-manager";

interface SettingsData {
    properties: Property[];
    expenseCategories: ExpenseCategory[];
    emailSettings: EmailSettings | null;
    origins: Origin[];
}

export default function SettingsPage() {
    const { user } = useAuth();
    const [data, setData] = useState<SettingsData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (user) {
            setLoading(true);
            const [properties, expenseCategories, emailSettings, origins] = await Promise.all([
                getProperties(),
                getExpenseCategories(),
                getEmailSettings(),
                getOrigins(),
            ]);
            setData({ properties, expenseCategories, emailSettings, origins });
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading || !data) {
        return <p>Cargando configuración...</p>
    }
    
    const { properties, expenseCategories, emailSettings, origins } = data;

  return (
    <Tabs defaultValue="properties" className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight text-primary">Configuración</h2>
                <p className="text-muted-foreground">Administra los datos de tu aplicación.</p>
            </div>
            <TabsList className="grid w-full sm:w-auto sm:inline-flex grid-cols-2 sm:grid-cols-4 mb-4 sm:mb-0">
                <TabsTrigger value="properties">Propiedades</TabsTrigger>
                <TabsTrigger value="origins">Orígenes</TabsTrigger>
                <TabsTrigger value="expense-categories">Cat. Gastos</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
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
                    <PropertyAddForm />
                </CardHeader>
                <CardContent>
                    {properties.length > 0 ? (
                        properties.map((property: Property) => (
                            <div key={property.id} className="border-t">
                                <PropertyEditForm property={property} />
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
        <TabsContent value="expense-categories">
            <Card>
                <CardHeader>
                    <CardTitle>Categorías de Gastos</CardTitle>
                    <CardDescription>
                        Crea, edita y elimina las categorías para organizar tus gastos.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ExpenseCategoryManager initialCategories={expenseCategories} />
                </CardContent>
            </Card>
        </TabsContent>
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
    </Tabs>
  );
}
