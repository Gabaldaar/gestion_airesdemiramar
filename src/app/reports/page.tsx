
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ReportsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reportes</CardTitle>
        <CardDescription>
            Visualiza el rendimiento de tus propiedades.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Próximamente: panel de reportes.</p>
      </CardContent>
    </Card>
  );
}
