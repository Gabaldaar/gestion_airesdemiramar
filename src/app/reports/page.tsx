
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getFinancialSummaryByProperty } from "@/lib/data";
import FinancialSummaryTable from "@/components/financial-summary-table";

export default async function ReportsPage() {
  const summary = await getFinancialSummaryByProperty();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reporte Financiero por Propiedad</CardTitle>
        <CardDescription>
          Visualiza un resumen de ingresos, gastos y resultados por cada propiedad.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FinancialSummaryTable summary={summary} />
      </CardContent>
    </Card>
  );
}
