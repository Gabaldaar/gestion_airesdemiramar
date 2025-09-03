
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FinancialSummary } from "@/lib/data";
import FinancialSummaryTable from "@/components/financial-summary-table";
import FinancialSummaryChart from "@/components/financial-summary-chart";
import { DatePicker } from "./ui/date-picker";
import { useRouter, usePathname } from 'next/navigation';
import { Button } from "./ui/button";

interface ReportsClientProps {
  summary: FinancialSummary[];
  from?: string;
  to?: string;
}

export default function ReportsClient({ summary, from, to }: ReportsClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleDateChange = (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleFromDateSelect = (date: Date | undefined) => {
    handleDateChange(date?.toISOString().split('T')[0], to);
  };

  const handleToDateSelect = (date: Date | undefined) => {
    handleDateChange(from, date?.toISOString().split('T')[0]);
  };
  
  const handleClearFilters = () => {
    router.push(pathname);
  };


  return (
    <div className="space-y-4">
       <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Selecciona un rango de fechas para filtrar el reporte.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
            <DatePicker date={from ? new Date(from) : undefined} onDateSelect={handleFromDateSelect} placeholder="Desde"/>
            <DatePicker date={to ? new Date(to) : undefined} onDateSelect={handleToDateSelect} placeholder="Hasta"/>
            <Button variant="outline" onClick={handleClearFilters}>Limpiar Filtros</Button>
        </CardContent>
      </Card>
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
