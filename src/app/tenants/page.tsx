
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function TenantsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inquilinos</CardTitle>
        <CardDescription>
            Administra la información de tus inquilinos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Próximamente: listado de inquilinos.</p>
      </CardContent>
    </Card>
  );
}
