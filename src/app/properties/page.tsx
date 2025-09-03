
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PropertiesPage() {

  return (
    <Card>
      <CardHeader>
        <CardTitle>Propiedades</CardTitle>
        <CardDescription>
            Administra tus propiedades y su información.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Próximamente: listado de propiedades.</p>
      </CardContent>
    </Card>
  );
}
