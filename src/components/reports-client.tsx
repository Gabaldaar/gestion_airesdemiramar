

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FinancialSummaryByCurrency, TenantsByOriginSummary } from "@/lib/data";
import FinancialSummaryTable from "@/components/financial-summary-table";
import FinancialSummaryChart from "@/components/financial-summary-chart";
import { DatePicker } from "./ui/date-picker";
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from "./ui/button";
import TenantsByOriginChart from "./tenants-by-origin-chart";

interface ReportsClientProps {
  financialSummary: FinancialSummaryByCurrency;
  tenantsByOrigin: TenantsByOriginSummary[];
}

export default function ReportsClient({ financialSummary, tenantsByOrigin }: ReportsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;

  // Since we fetch data in the parent, this component is now just for presentation.
  // The date change logic will trigger a re-render in the parent component.
  const handleDateChange = (newFrom?: string, newTo?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newFrom) {
      params.set('from', newFrom);
    } else {
      params.delete('from');
    }
    if (newTo) {
      params.set('to', newTo);
    } else {
      params.delete('to');
    }
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

  const hasArsData = financialSummary.ars.some(s => 
    s.totalIncome !== 0 || s.totalPayments !== 0 || s.balance !== 0 || s.totalPropertyExpenses !== 0 || s.totalBookingExpenses !== 0 || s.netResult !== 0
  );
  const hasUsdData = financialSummary.usd.some(s => 
    s.totalIncome !== 0 || s.totalPayments !== 0 || s.balance !== 0 || s.totalPropertyExpenses !== 0 || s.totalBookingExpenses !== 0 || s.netResult !== 0
  );

  return (
    <div className="space-y-4">
       <Card>
        <CardHeader>
          <CardTitle>Filtros de Reportes Financieros</CardTitle>
          <CardDescription>
            Selecciona un rango de fechas para filtrar los reportes financieros.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <DatePicker date={from ? new Date(from.replace(/-/g, '/')) : undefined} onDateSelect={handleFromDateSelect} placeholder="Desde"/>
            <DatePicker date={to ? new Date(to.replace(/-/g, '/')) : undefined} onDateSelect={handleToDateSelect} placeholder="Hasta"/>
            <Button variant="outline" onClick={handleClearFilters}>Limpiar Filtros</Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Distribución de Inquilinos por Origen</CardTitle>
            <CardDescription>
                Visualiza de dónde provienen tus inquilinos.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <TenantsByOriginChart data={tenantsByOrigin} />
        </CardContent>
      </Card>


      {hasArsData && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Resultado por Propiedad (ARS)</CardTitle>
              <CardDescription>
                Comparación del resultado neto entre las propiedades en ARS.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FinancialSummaryChart summary={financialSummary.ars} currency="ARS" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Reporte Financiero por Propiedad (ARS)</CardTitle>
              <CardDescription>
                Resumen de ingresos, gastos y resultados por propiedad en ARS.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FinancialSummaryTable summary={financialSummary.ars} currency="ARS" />
            </CardContent>
          </Card>
        </>
      )}

      {hasUsdData && (
         <>
          <Card>
            <CardHeader>
              <CardTitle>Resultado por Propiedad (USD)</CardTitle>
              <CardDescription>
                Comparación del resultado neto entre las propiedades en USD.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FinancialSummaryChart summary={financialSummary.usd} currency="USD" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Reporte Financiero por Propiedad (USD)</CardTitle>
              <CardDescription>
                 Resumen de ingresos, gastos y resultados por propiedad en USD.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FinancialSummaryTable summary={financialSummary.usd} currency="USD" />
            </CardContent>
          </Card>
        </>
      )}
      
      {!hasArsData && !hasUsdData && (
        <Card>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">No hay datos financieros para mostrar en el período seleccionado.</p>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
