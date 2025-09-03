
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getFinancialSummaryByProperty } from "@/lib/data";
import FinancialSummaryTable from "@/components/financial-summary-table";
import FinancialSummaryChart from "@/components/financial-summary-chart";

export default async function ReportsPage() {
  const summary = await getFinancialSummaryByProperty();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Resultado Neto por Propiedad</CardTitle>
          <CardDescription>
            Comparación del resultado neto entre las propiedades.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FinancialSummaryChart summary={summary} />
        </CardContent>
      </Card>
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
    </div>
  );
}
