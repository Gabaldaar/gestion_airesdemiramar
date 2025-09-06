

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProperties, Property, getExpenseCategories } from "@/lib/data";
import { PropertyEditForm } from "@/components/property-edit-form";
import { PropertyAddForm } from "@/components/property-add-form";
import ExpenseCategoryManager from "@/components/expense-category-manager";

export default async function SettingsPage() {
  const [properties, expenseCategories] = await Promise.all([
      getProperties(),
      getExpenseCategories()
  ]);

  return (
    <Tabs defaultValue="properties" className="space-y-4">
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight text-primary">Configuración</h2>
                <p className="text-muted-foreground">Administra los datos de tu aplicación.</p>
            </div>
            <TabsList>
                <TabsTrigger value="properties">Propiedades</TabsTrigger>
                <TabsTrigger value="expense-categories">Cat. de Gastos</TabsTrigger>
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

    </Tabs>
  );
}
