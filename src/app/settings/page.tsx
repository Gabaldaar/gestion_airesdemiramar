
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProperties, Property } from "@/lib/data";
import { PropertyEditForm } from "@/components/property-edit-form";
import { PropertyAddForm } from "@/components/property-add-form";

export default async function SettingsPage() {
  const properties = await getProperties();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Configuración</CardTitle>
            <CardDescription>
            Administra los datos de tus propiedades.
            </CardDescription>
        </div>
        <PropertyAddForm />
      </CardHeader>
      <CardContent>
        {properties.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>ID Calendario Google</TableHead>
                <TableHead>URL Foto</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property: Property) => (
                <PropertyEditForm key={property.id} property={property} />
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Aún no has añadido ninguna propiedad.</p>
            <p className="text-sm text-muted-foreground">¡Crea tu primera propiedad para empezar!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
