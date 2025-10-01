

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FinancialSummaryByCurrency, TenantsByOriginSummary, ExpensesByCategorySummary, ExpensesByPropertySummary, BookingsByOriginSummary } from "@/lib/data";
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
import { addDays } from "date-fns";

interface ReportsClientProps {
  financialSummary: FinancialSummaryByCurrency;
  tenantsByOrigin: TenantsByOriginSummary[];
  expensesByCategory: ExpensesByCategorySummary[];
  expensesByProperty: ExpensesByPropertySummary[];
  bookingsByOrigin: BookingsByOriginSummary[];
}

export default function ReportsClient({ financialSummary, tenantsByOrigin, expensesByCategory, expensesByProperty, bookingsByOrigin }: ReportsClientProps) {
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
  
  // Need to adjust date from search params because they are UTC.
  // The 'T' separator indicates UTC, so splitting by it and taking the first part works,
  // but `new Date()` will interpret that as local time if there's no timezone info.
  // Example: '2024-01-01' from params becomes `new Date('2024-01-01')` which is local midnight.
  // To avoid timezone issues from the server, we can treat them as UTC by adding 'T00:00:00Z'
  // but a simpler fix is to just use the string and know the server handles it.
  // For the client-side DatePicker, creating a new Date from a YYYY-MM-DD string
  // can be off by one day depending on the user's timezone.
  // `new Date('2024-08-01')` becomes `2024-08-01T00:00:00` in the *local* timezone.
  // If the user is in GMT-3, this is `2024-08-01T03:00:00Z` in UTC.
  // A safer way is to construct the date from parts or use a library that handles this better.
  // `new Date(year, monthIndex, day)` is safer.
  const fromDate = from ? new Date(from.replace(/-/g, '/')) : undefined;
  const toDate = to ? new Date(to.replace(/-/g, '/')) : undefined;


  return (
    <div className="space-y-4">
       <Card>
        <CardHeader>
          <CardTitle>Filtros de Reportes Financieros</CardTitle>
          <CardDescription>
            Selecciona un rango de fechas para filtrar los reportes financieros. Las fechas son inclusivas.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <DatePicker date={fromDate} onDateSelect={handleFromDateSelect} placeholder="Desde"/>
            <DatePicker date={toDate} onDateSelect={handleToDateSelect} placeholder="Hasta"/>
            <Button variant="outline" onClick={handleClearFilters}>Limpiar Filtros</Button>
        </CardContent>
      </Card>
      
        <div className="grid gap-4 md:grid-cols-2">
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
          <div className="grid gap-4 md:grid-cols-2">
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
