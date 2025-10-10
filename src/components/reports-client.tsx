

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FinancialSummaryByCurrency, TenantsByOriginSummary, ExpensesByCategorySummary, ExpensesByPropertySummary, BookingsByOriginSummary, BookingStatusSummary } from "@/lib/data";
import FinancialSummaryTable from "@/components/financial-summary-table";
import FinancialSummaryChart from "@/components/financial-summary-chart";
import { DatePicker } from "./ui/date-picker";
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from "./ui/button";
import TenantsByOriginChart from "./tenants-by-origin-chart";
import NetIncomeDistributionChart from "./net-income-distribution-chart";
import ExpensesByCategoryChart from "./expenses-by-category-chart";
import ExpensesByPropertyChart from "./expenses-by-property-chart";
import BookingsByOriginChart from "./bookings-by-origin-chart";
import BookingStatusChart from "./booking-status-chart";

interface ReportsClientProps {
  financialSummary: FinancialSummaryByCurrency;
  tenantsByOrigin: TenantsByOriginSummary[];
  expensesByCategory: ExpensesByCategorySummary[];
  expensesByProperty: ExpensesByPropertySummary[];
  bookingsByOrigin: BookingsByOriginSummary[];
  bookingStatus: BookingStatusSummary[];
}

export default function ReportsClient({ financialSummary, tenantsByOrigin, expensesByCategory, expensesByProperty, bookingsByOrigin, bookingStatus }: ReportsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;

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
        <CardContent className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <DatePicker date={from ? new Date(from.replace(/-/g, '/')) : undefined} onDateSelect={handleFromDateSelect} placeholder="Desde"/>
            <DatePicker date={to ? new Date(to.replace(/-/g, '/')) : undefined} onDateSelect={handleToDateSelect} placeholder="Hasta"/>
            <Button variant="outline" onClick={handleClearFilters}>Limpiar Filtros</Button>
        </CardContent>
      </Card>
      
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
             <Card>
                <CardHeader>
                    <CardTitle>Distribución de Gastos por Categoría</CardTitle>
                    <CardDescription>
                        Visualiza cómo se distribuyen tus gastos totales (en USD).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ExpensesByCategoryChart data={expensesByCategory} />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Distribución de Reservas por Origen</CardTitle>
                    <CardDescription>
                        Visualiza qué canales generan más reservas.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <BookingsByOriginChart data={bookingsByOrigin} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Estado de Reservas</CardTitle>
                    <CardDescription>
                        Proporción de reservas activas vs. canceladas.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <BookingStatusChart data={bookingStatus} />
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Distribución de Gastos por Propiedad</CardTitle>
                <CardDescription>
                    Comparativa de gastos totales por propiedad (en USD).
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ExpensesByPropertyChart data={expensesByProperty} />
            </CardContent>
        </Card>
      
      {hasUsdData && (
         <>
            <Card>
                <CardHeader>
                    <CardTitle>Comparativa de Resultados Netos (USD)</CardTitle>
                    <CardDescription>
                        Compara el resultado neto final entre todas las propiedades en USD.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <FinancialSummaryChart summary={financialSummary.usd} currency="USD" showOnlyNetResult={true} />
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Resultado por Propiedad (USD)</CardTitle>
                  <CardDescription>
                    Comparación del resultado neto entre las propiedades en USD.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {financialSummary.usd.filter(s => s.netResult !== 0 || s.totalIncome !== 0 || s.totalBookingExpenses !== 0 || s.totalPropertyExpenses !==0).map(summaryItem => (
                      <FinancialSummaryChart key={summaryItem.propertyId} summary={[summaryItem]} currency="USD" />
                  ))}
                </CardContent>
              </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Distribución de Ganancias (USD)</CardTitle>
                <CardDescription>
                    Porcentaje del resultado neto positivo total por propiedad.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NetIncomeDistributionChart summary={financialSummary.usd} />
              </CardContent>
            </Card>
          </div>
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

      {hasArsData && (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Comparativa de Resultados Netos (ARS)</CardTitle>
                    <CardDescription>
                        Compara el resultado neto final entre todas las propiedades en ARS.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <FinancialSummaryChart summary={financialSummary.ars} currency="ARS" showOnlyNetResult={true} />
                </CardContent>
            </Card>
          <Card>
            <CardHeader>
              <CardTitle>Resultado por Propiedad (ARS)</CardTitle>
              <CardDescription>
                Comparación del resultado neto entre las propiedades en ARS.
              </CardDescription>
            </CardHeader>
             <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {financialSummary.ars.filter(s => s.netResult !== 0 || s.totalIncome !== 0 || s.totalBookingExpenses !== 0 || s.totalPropertyExpenses !==0).map(summaryItem => (
                  <FinancialSummaryChart key={summaryItem.propertyId} summary={[summaryItem]} currency="ARS" />
                ))}
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
