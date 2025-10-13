
'use client';

import { 
  getFinancialSummaryByProperty, 
  FinancialSummaryByCurrency, 
  getTenantsByOriginSummary, 
  TenantsByOriginSummary, 
  getExpensesByCategorySummary, 
  ExpensesByCategorySummary, 
  getExpensesByPropertySummary, 
  ExpensesByPropertySummary, 
  getBookingsByOriginSummary, 
  BookingsByOriginSummary, 
  getBookingStatusSummary, 
  BookingStatusSummary 
} from "@/lib/data";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import FinancialSummaryTable from "@/components/financial-summary-table";
import FinancialSummaryChart from "@/components/financial-summary-chart";
import TenantsByOriginChart from "@/components/tenants-by-origin-chart";
import ExpensesByCategoryChart from "@/components/expenses-by-category-chart";
import ExpensesByPropertyChart from "@/components/expenses-by-property-chart";
import BookingsByOriginChart from "@/components/bookings-by-origin-chart";
import BookingStatusChart from "@/components/booking-status-chart";

interface InformesData {
    financialSummary: FinancialSummaryByCurrency;
    tenantsByOrigin: TenantsByOriginSummary[];
    expensesByCategory: ExpensesByCategorySummary[];
    expensesByProperty: ExpensesByPropertySummary[];
    bookingsByOrigin: BookingsByOriginSummary[];
    bookingStatus: BookingStatusSummary[];
}

function InformesPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;

  const [data, setData] = useState<InformesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
        setLoading(true);
        Promise.all([
            getFinancialSummaryByProperty({ startDate: from, endDate: to }),
            getTenantsByOriginSummary(),
            getExpensesByCategorySummary({ startDate: from, endDate: to }),
            getExpensesByPropertySummary({ startDate: from, endDate: to }),
            getBookingsByOriginSummary(),
            getBookingStatusSummary(),
        ]).then(([financialSummary, tenantsByOrigin, expensesByCategory, expensesByProperty, bookingsByOrigin, bookingStatus]) => {
            setData({ financialSummary, tenantsByOrigin, expensesByCategory, expensesByProperty, bookingsByOrigin, bookingStatus });
            setLoading(false);
        }).catch(error => {
            console.error("Error fetching report data:", error);
            setLoading(false);
        });
    }
  }, [user, from, to]);

  const handleDateChange = (newFrom?: string, newTo?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newFrom) params.set('from', newFrom);
    else params.delete('from');
    if (newTo) params.set('to', newTo);
    else params.delete('to');
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

  if (loading || !data) {
    return <p>Cargando informes...</p>;
  }

  const { financialSummary, tenantsByOrigin, expensesByCategory, expensesByProperty, bookingsByOrigin, bookingStatus } = data;
  
  const hasArsData = financialSummary.ars.some(s => s.totalIncome !== 0 || s.totalPayments !== 0 || s.totalBookingExpenses !== 0 || s.totalPropertyExpenses !== 0);
  const hasUsdData = financialSummary.usd.some(s => s.totalIncome !== 0 || s.totalPayments !== 0 || s.totalBookingExpenses !== 0 || s.totalPropertyExpenses !== 0);

  return (
    <div className="flex flex-col gap-6">
        <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight text-primary">Informes</h2>
            <p className="text-muted-foreground">Analiza el rendimiento de tu negocio con estos informes detallados.</p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Filtros</CardTitle>
                <CardDescription>
                Selecciona un rango de fechas para filtrar los informes financieros.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <DatePicker date={from ? new Date(from.replace(/-/g, '/')) : undefined} onDateSelect={handleFromDateSelect} placeholder="Desde"/>
                <DatePicker date={to ? new Date(to.replace(/-/g, '/')) : undefined} onDateSelect={handleToDateSelect} placeholder="Hasta"/>
                <Button variant="outline" onClick={handleClearFilters}>Limpiar Filtros</Button>
            </CardContent>
        </Card>

        {/* --- Responsive Grid for Charts --- */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Inquilinos por Origen</CardTitle>
                </CardHeader>
                <CardContent className="min-w-0">
                    <TenantsByOriginChart data={tenantsByOrigin} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Reservas por Origen</CardTitle>
                </CardHeader>
                <CardContent className="min-w-0">
                    <BookingsByOriginChart data={bookingsByOrigin} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Gastos por Categoría</CardTitle>
                    <CardDescription>Distribución de gastos totales en USD.</CardDescription>
                </CardHeader>
                <CardContent className="min-w-0">
                    <ExpensesByCategoryChart data={expensesByCategory} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Gastos por Propiedad</CardTitle>
                    <CardDescription>Comparativa de gastos totales por propiedad en USD.</CardDescription>
                </CardHeader>
                <CardContent className="min-w-0">
                    <ExpensesByPropertyChart data={expensesByProperty} />
                </CardContent>
            </Card>
             <Card>
              <CardHeader>
                  <CardTitle>Estado de Reservas</CardTitle>
              </CardHeader>
              <CardContent className="min-w-0">
                  <BookingStatusChart data={bookingStatus} />
              </CardContent>
          </Card>
        </div>

        {/* --- Financial Reports Sections --- */}
        {!hasArsData && !hasUsdData && (
            <Card>
                <CardContent>
                    <p className="text-center text-muted-foreground py-8">No hay datos financieros para mostrar en el período seleccionado.</p>
                </CardContent>
            </Card>
        )}

        {hasUsdData && (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Resultados por Propiedad (USD)</CardTitle>
                        <CardDescription>Compara los ingresos y gastos entre todas las propiedades en USD.</CardDescription>
                    </CardHeader>
                    <CardContent className="min-w-0">
                        <FinancialSummaryChart summary={financialSummary.usd} currency="USD" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Tabla Financiera (USD)</CardTitle>
                        <CardDescription>Resumen detallado de ingresos, gastos y resultados por propiedad en USD.</CardDescription>
                    </CardHeader>
                    <CardContent className="min-w-0">
                        <FinancialSummaryTable summary={financialSummary.usd} currency="USD" />
                    </CardContent>
                </Card>
            </div>
        )}

        {hasArsData && (
             <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Resultados por Propiedad (ARS)</CardTitle>
                        <CardDescription>Compara los ingresos y gastos entre todas las propiedades en ARS.</CardDescription>
                    </CardHeader>
                    <CardContent className="min-w-0">
                        <FinancialSummaryChart summary={financialSummary.ars} currency="ARS" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Tabla Financiera (ARS)</CardTitle>
                        <CardDescription>Resumen detallado de ingresos, gastos y resultados por propiedad en ARS.</CardDescription>
                    </CardHeader>
                    <CardContent className="min-w-0">
                        <FinancialSummaryTable summary={financialSummary.ars} currency="ARS" />
                    </CardContent>
                </Card>
            </div>
        )}
    </div>
  );
}

export default function InformesPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <InformesPageContent />
        </Suspense>
    )
}
