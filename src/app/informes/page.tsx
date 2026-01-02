

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
  BookingStatusSummary,
  FinancialSummary
} from "@/lib/data";
import { Suspense, useEffect, useState, useMemo } from "react";
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
import NetIncomeDistributionChart from "@/components/net-income-distribution-chart";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import PaymentCalculator from "@/components/payment-calculator";

interface InformesData {
    financialSummary: FinancialSummaryByCurrency;
    tenantsByOrigin: TenantsByOriginSummary[];
    expensesByCategory: ExpensesByCategorySummary[];
    expensesByProperty: ExpensesByPropertySummary[];
    bookingsByOrigin: BookingsByOriginSummary[];
    bookingStatus: BookingStatusSummary[];
}

interface ReportVisibility {
    tenantsByOrigin: boolean;
    bookingsByOrigin: boolean;
    bookingStatus: boolean;
    expensesByCategory: boolean;
    expensesByProperty: boolean;
    netIncomeDistribution: boolean;
    financialCharts: boolean;
    financialTables: boolean;
    showARS: boolean;
    showUSD: boolean;
}

const reportLabels: Record<keyof ReportVisibility, string> = {
    tenantsByOrigin: 'Inquilinos por Origen',
    bookingsByOrigin: 'Reservas por Origen',
    bookingStatus: 'Estado de Reservas',
    expensesByCategory: 'Gastos por Categoría',
    expensesByProperty: 'Gastos por Propiedad',
    netIncomeDistribution: 'Distribución Ingresos Netos',
    financialCharts: 'Gráficos Financieros',
    financialTables: 'Tablas Financieras',
    showARS: 'Mostrar ARS',
    showUSD: 'Mostrar USD',
};


function InformesPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;

  const [data, setData] = useState<InformesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportVisibility, setReportVisibility] = useState<ReportVisibility>({
      tenantsByOrigin: true,
      bookingsByOrigin: true,
      bookingStatus: true,
      expensesByCategory: true,
      expensesByProperty: true,
      netIncomeDistribution: true,
      financialCharts: true,
      financialTables: true,
      showARS: true,
      showUSD: true,
  });

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

  const handleVisibilityChange = (report: keyof ReportVisibility, checked: boolean) => {
      setReportVisibility(prev => ({ ...prev, [report]: checked }));
  };

  const totalsSummary = useMemo(() => {
    if (!data) return { ars: null, usd: null };
    
    const calculateTotals = (summary: FinancialSummary[]): FinancialSummary => {
        return summary.reduce((acc, item) => ({
            propertyId: 'totals',
            propertyName: 'Totales',
            totalIncome: acc.totalIncome + item.totalIncome,
            totalPayments: acc.totalPayments + item.totalPayments,
            balance: acc.balance + item.balance,
            totalPropertyExpenses: acc.totalPropertyExpenses + item.totalPropertyExpenses,
            totalBookingExpenses: acc.totalBookingExpenses + item.totalBookingExpenses,
            netResult: acc.netResult + item.netResult,
        }), {
            propertyId: 'totals',
            propertyName: 'Totales',
            totalIncome: 0,
            totalPayments: 0,
            balance: 0,
            totalPropertyExpenses: 0,
            totalBookingExpenses: 0,
            netResult: 0,
        });
    };

    return {
      ars: calculateTotals(data.financialSummary.ars),
      usd: calculateTotals(data.financialSummary.usd),
    };
  }, [data]);

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

        <PaymentCalculator showTabs={true} />

        <Card>
             <CardHeader>
                <CardTitle>Visualización de Informes</CardTitle>
                <CardDescription>
                Activa o desactiva los informes para encontrar problemas de visualización o filtrar por moneda.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(Object.keys(reportVisibility) as Array<keyof ReportVisibility>).map(key => (
                    <div key={key} className="flex items-center space-x-2">
                        <Switch 
                            id={key}
                            checked={reportVisibility[key]}
                            onCheckedChange={(checked) => handleVisibilityChange(key, checked)}
                        />
                        <Label htmlFor={key}>{reportLabels[key]}</Label>
                    </div>
                ))}
            </CardContent>
        </Card>

        {/* --- Responsive Grid for General Charts --- */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {reportVisibility.tenantsByOrigin && (
                <Card>
                    <CardHeader>
                        <CardTitle>Inquilinos por Origen</CardTitle>
                    </CardHeader>
                    <CardContent className="min-w-0">
                        <TenantsByOriginChart data={tenantsByOrigin} />
                    </CardContent>
                </Card>
            )}
            {reportVisibility.bookingsByOrigin && (
                <Card>
                    <CardHeader>
                        <CardTitle>Reservas por Origen</CardTitle>
                    </CardHeader>
                    <CardContent className="min-w-0">
                        <BookingsByOriginChart data={bookingsByOrigin} />
                    </CardContent>
                </Card>
            )}
            {reportVisibility.expensesByCategory && (
                <Card>
                    <CardHeader>
                        <CardTitle>Gastos por Categoría</CardTitle>
                        <CardDescription>Distribución de gastos totales en USD.</CardDescription>
                    </CardHeader>
                    <CardContent className="min-w-0">
                        <ExpensesByCategoryChart data={expensesByCategory} />
                    </CardContent>
                </Card>
            )}
            {reportVisibility.expensesByProperty && (
                <Card>
                    <CardHeader>
                        <CardTitle>Gastos por Propiedad</CardTitle>
                        <CardDescription>Comparativa de gastos totales por propiedad en USD.</CardDescription>
                    </CardHeader>
                    <CardContent className="min-w-0">
                        <ExpensesByPropertyChart data={expensesByProperty} />
                    </CardContent>
                </Card>
            )}
             {reportVisibility.bookingStatus && (
                <Card>
                <CardHeader>
                    <CardTitle>Estado de Reservas</CardTitle>
                </CardHeader>
                <CardContent className="min-w-0">
                    <BookingStatusChart data={bookingStatus} />
                </CardContent>
            </Card>
             )}
             {reportVisibility.netIncomeDistribution && hasUsdData && reportVisibility.showUSD && (
                <Card>
                    <CardHeader>
                        <CardTitle>Distribución de Ingresos Netos (USD)</CardTitle>
                    </CardHeader>
                    <CardContent className="min-w-0">
                        <NetIncomeDistributionChart summary={financialSummary.usd} />
                    </CardContent>
                </Card>
            )}
        </div>

        {/* --- Financial Reports Sections --- */}
        {!hasArsData && !hasUsdData && !loading &&(
            <Card>
                <CardContent>
                    <p className="text-center text-muted-foreground py-8">No hay datos financieros para mostrar en el período seleccionado.</p>
                </CardContent>
            </Card>
        )}

        {/* Total Summary Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {totalsSummary.usd && hasUsdData && reportVisibility.showUSD && (
                <Card>
                    <CardHeader>
                        <CardTitle>Resumen Total (USD)</CardTitle>
                        <CardDescription>Resultado financiero general en USD.</CardDescription>
                    </CardHeader>
                    <CardContent className="min-w-0">
                        <FinancialSummaryChart summaryItem={totalsSummary.usd} currency="USD" />
                    </CardContent>
                </Card>
            )}
            {totalsSummary.ars && hasArsData && reportVisibility.showARS && (
                <Card>
                    <CardHeader>
                        <CardTitle>Resumen Total (ARS)</CardTitle>
                        <CardDescription>Resultado financiero general en ARS.</CardDescription>
                    </CardHeader>
                    <CardContent className="min-w-0">
                        <FinancialSummaryChart summaryItem={totalsSummary.ars} currency="ARS" />
                    </CardContent>
                </Card>
            )}
        </div>

        {/* Individual Property Charts */}
        {reportVisibility.financialCharts && (
            <>
                {hasUsdData && reportVisibility.showUSD && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {financialSummary.usd.filter(s => s.totalIncome !== 0 || s.totalBookingExpenses !== 0 || s.totalPropertyExpenses !== 0).map(item => (
                            <Card key={`${item.propertyId}-usd-chart`}>
                                <CardHeader>
                                    <CardTitle className="text-lg">{item.propertyName}</CardTitle>
                                    <CardDescription>Resumen Financiero (USD)</CardDescription>
                                </CardHeader>
                                <CardContent className="min-w-0">
                                    <FinancialSummaryChart summaryItem={item} currency="USD" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
                {hasArsData && reportVisibility.showARS && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
                        {financialSummary.ars.filter(s => s.totalIncome !== 0 || s.totalBookingExpenses !== 0 || s.totalPropertyExpenses !== 0).map(item => (
                            <Card key={`${item.propertyId}-ars-chart`}>
                                <CardHeader>
                                    <CardTitle className="text-lg">{item.propertyName}</CardTitle>
                                    <CardDescription>Resumen Financiero (ARS)</CardDescription>
                                </CardHeader>
                                <CardContent className="min-w-0">
                                    <FinancialSummaryChart summaryItem={item} currency="ARS" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </>
        )}

        {/* --- Financial Tables --- */}
        {reportVisibility.financialTables && (
            <>
                {hasUsdData && reportVisibility.showUSD && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Tabla Financiera (USD)</CardTitle>
                            <CardDescription>Resumen detallado de ingresos, gastos y resultados por propiedad en USD.</CardDescription>
                        </CardHeader>
                        <CardContent className="min-w-0">
                            <FinancialSummaryTable summary={financialSummary.usd} currency="USD" />
                        </CardContent>
                    </Card>
                )}
                
                {hasArsData && reportVisibility.showARS && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Tabla Financiera (ARS)</CardTitle>
                            <CardDescription>Resumen detallado de ingresos, gastos y resultados por propiedad en ARS.</CardDescription>
                        </CardHeader>
                        <CardContent className="min-w-0">
                            <FinancialSummaryTable summary={financialSummary.ars} currency="ARS" />
                        </CardContent>
                    </Card>
                )}
            </>
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

    

    