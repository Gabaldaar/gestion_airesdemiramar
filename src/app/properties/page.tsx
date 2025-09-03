
import { getProperties } from "@/lib/data";
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
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function PropertiesPage() {
  const properties = await getProperties();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Propiedades</CardTitle>
            <CardDescription>
                Administra tus propiedades y revisa su estado.
            </CardDescription>
        </div>
        <Button asChild>
          <Link href="/properties/new">Añadir Propiedad</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Precio/Noche</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.map((prop) => (
              <TableRow key={prop.id}>
                <TableCell className="font-medium">
                    <Link href={`/properties/${prop.id}`} className="hover:underline">
                        {prop.name}
                    </Link>
                </TableCell>
                <TableCell className="capitalize">{prop.type}</TableCell>
                <TableCell>
                  <Badge variant={prop.status === 'available' ? 'default' : 'secondary'}>
                    {prop.status === 'available' ? 'Disponible' : 'Alquilado'}
                  </Badge>
                </TableCell>
                <TableCell>${prop.pricePerNight}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
