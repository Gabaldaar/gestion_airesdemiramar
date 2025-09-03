
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

export default async function SettingsPage() {
  const properties = await getProperties();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración</CardTitle>
        <CardDescription>
          Administra los datos de tus propiedades.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>ID Calendario Google</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.map((property: Property) => (
              <PropertyEditForm key={property.id} property={property} />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
