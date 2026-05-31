'use client';

import { 
    FinancialSummaryByCurrency, 
    TenantsByOriginSummary, 
    ExpensesByCategorySummary, 
    ExpensesByPropertySummary, 
    BookingsByOriginSummary, 
    BookingStatusSummary,
    Property, Tenant, Booking, Origin, ExpenseCategory, ExpenseWithDetails, PaymentWithDetails, Contrato, PeriodoPago, Expense, Payment,
    getProperties, getTenants, getBookings, getOrigins, getExpenseCategories, getTasks, getContratos, getPeriodosPago, getExpenses, getPayments,
    getAllOrganizationsStats, OrganizationStats
} from "@/lib/data";
import { 
    calculateFinancialSummaryByProperty,
    calculateTenantsByOriginSummary,
    calculateExpensesByCategorySummary,
    calculateExpensesByPropertySummary,
    calculateBookingsByOriginSummary,
    calculateBookingStatusSummary
} from "@/lib/reports";
import { Suspense, useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Loader2, ShieldAlert, BarChart3, Activity } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { MonitorClient } from "@/components/monitor-client";

const MASTER_ADMIN_UID = 'ymBtFDZUWKR7VCxWNTHWflXc5mx1';

interface InformesData {
    financialSummary: FinancialSummaryByCurrency;
    tenantsByOrigin: TenantsByOriginSummary[];
    expensesByCategory: ExpensesByCategorySummary[];
    expensesByProperty: ExpensesByPropertySummary[];
    bookingsByOrigin: BookingsByOriginSummary[];
    bookingStatus: BookingStatusSummary[];
    monitorStats?: OrganizationStats[];
}

function InformesPageContent() {
  const { user, appUser, activeRole, orgId } = useAuth();
  const { t } = useTranslation();
  
  const isStaff = activeRole === 'staff';
  const isPersonalFlavor = appUser?.appFlavor !== 'commercial';
  const isMasterAdmin = user?.uid === MASTER_ADMIN_UID;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;

  const [data, setData] = useState<InformesData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const fetchData = useCallback(async () => {
    if (!user || isStaff || !orgId) return;
    setLoading(true);
    try {
        const [
            properties,
            tenants,
            bookings,
            origins,
            expenseCategories,
            tasks,
            contratos,
            periodos,
            expensesRaw,
            payRaw,
            monitorStats
        ] = await Promise.all([
            getProperties(orgId),
            getTenants(orgId),
            getBookings(orgId),
            getOrigins(orgId),
            getExpenseCategories(orgId),
            getTasks(orgId),
            getContratos(orgId),
            getPeriodosPago(orgId),
            getExpenses(orgId),
            getPayments(orgId),
            isMasterAdmin ? getAllOrganizationsStats() : Promise.resolve(undefined)
        ]);

        const bookingsMap = new Map(bookings.map((b: Booking) => [b.id, b]));
        const contratosMap = new Map(contratos.map((c: Contrato) => [c.id, c]));

        const allExpenses: ExpenseWithDetails[] = expensesRaw.map((e: any) => {
            return {
                ...e,
                amountUSD: e.originalUsdAmount || (e.currency?.toUpperCase() === 'USD' ? e.amount : 0),
                amountARS: e.currency?.toUpperCase() === 'ARS' ? e.amount : (e.exchangeRate ? e.amount * e.exchangeRate : e.amount)
            } as any;
        });

        const allPayments: PaymentWithDetails[] = payRaw.map((p: any) => {
            let sourceCurrency = (p.currency || 'USD').toUpperCase();
            let propertyId = p.propertyId;
            
            if (p.bookingId) {
                const b = bookingsMap.get(p.bookingId);
                if (b) {
                    propertyId = b.propertyId;
                    sourceCurrency = (b.currency || 'USD').toUpperCase();
                }
            } else if (p.contratoId) {
                const c = contratosMap.get(p.contratoId);
                if (c) {
                    propertyId = c.propertyId;
                    sourceCurrency = (c.moneda || 'ARS').toUpperCase();
                }
            }

            const realReceivedAmount = p.receivedAmount ?? p.originalArsAmount ?? p.amount ?? 0;
            const realReceivedCurrency = (p.receivedCurrency || (p.originalArsAmount ? 'ARS' : (p.currency || 'USD'))).toUpperCase();

            return {
                ...p,
                propertyId: propertyId,
                sourceCurrency,
                realReceivedAmount,
                realReceivedCurrency,
                amountUSD: sourceCurrency === 'USD' ? (p.amount || 0) : 0,
                amountARS: sourceCurrency === 'ARS' ? (p.amount || 0) : 0
            } as any;
        });

        const financialSummary = calculateFinancialSummaryByProperty(
            properties, 
            bookings, 
            allExpenses, 
            allPayments, 
            contratos, 
            periodos, 
            { startDate: from, endDate: to }
        );
        
        const tenantsByOrigin = calculateTenantsByOriginSummary(tenants, origins);
        const expensesByCategory = calculateExpensesByCategorySummary(allExpenses, expenseCategories, { startDate: from, endDate: to });
        const expensesByProperty = calculateExpensesByPropertySummary(allExpenses, properties, { startDate: from, endDate: to });
        const bookingsByOrigin = calculateBookingsByOriginSummary(bookings, origins);
        const bookingStatus = calculateBookingStatusSummary(bookings);
        
        setData({ financialSummary, tenantsByOrigin, expensesByCategory, expensesByProperty, bookingsByOrigin, bookingStatus, monitorStats });
    } catch (error) {
        console.error("Error fetching report data:", error);
    } finally {
        setLoading(false);
    }
  }, [user, from, to, isStaff, orgId, isMasterAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDateChange = (newFrom?: string, newTo?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newFrom) params.set('from', newFrom);
    else params.delete('from');
    if (newTo) params.set('to', newTo);
    else params.delete('to');
    router.push(`${pathname}?${params.toString()}`);
  };

  const hasAnyFinancialData = useMemo(() => {
    if (!data?.financialSummary) return false;
    return Object.values(data.financialSummary).some(summaryArray => 
        summaryArray.some(item => item.totalIncome !== 0 || item.totalExpenses !== 0 || item.totalPayments !== 0)
    );
  }, [data]);

  if (isStaff) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-muted/20 rounded-3xl border-2 border-dashed">
            <ShieldAlert className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
            <h2 className="text-xl font-bold text-muted-foreground">Acceso Restringido</h2>
            <p className="text-sm text-muted-foreground/60 max-w-xs mt-2">
                Los informes económicos solo están disponibles para el rol de Administrador.
            </p>
        </div>
    );
  }

  if (loading || !data) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
            <span>{t('common.loading')}</span>
        </div>
    );
  }

  const { financialSummary, tenantsByOrigin, expensesByCategory, expensesByProperty, bookingsByOrigin, bookingStatus } = data;

  return (
    <div className="flex flex-col gap-6">
        <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight text-primary">{t('navigation.reports')}</h2>
            <p className="text-muted-foreground">{t('reports.description')}</p>
        </div>

        <Tabs defaultValue="economics" className="w-full">
            <TabsList className="grid w-full sm:w-auto h-auto grid-cols-2 bg-muted/50 p-1 rounded-xl mb-6">
                <TabsTrigger value="economics" className="py-2.5 font-bold gap-2">
                    <BarChart3 className="h-4 w-4" /> Económicos
                </TabsTrigger>
                {isMasterAdmin && (
                    <TabsTrigger value="monitor" className="py-2.5 font-bold gap-2">
                        <Activity className="h-4 w-4" /> Monitor de Plataforma
                    </TabsTrigger>
                )}
            </TabsList>

            <TabsContent value="economics" className="space-y-6 animate-in fade-in duration-300">
                <Card>
                    <CardHeader><CardTitle>{t('common.filters')}</CardTitle></CardHeader>
                    <CardContent className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        <DatePicker date={from ? new Date(from.replace(/-/g, '/')) : undefined} onDateSelect={(d: any) => handleDateChange(d?.toISOString().split('T')[0], to)} placeholder={t('common.from')}/>
                        <DatePicker date={to ? new Date(to.replace(/-/g, '/')) : undefined} onDateSelect={(d: any) => handleDateChange(from, d?.toISOString().split('T')[0])} placeholder={t('common.to')}/>
                        <Button variant="outline" onClick={() => router.push(pathname)}>{t('common.clean')}</Button>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {isPersonalFlavor && tenantsByOrigin.length > 0 && (
                    <Card>
                        <CardHeader><CardTitle>{t('reports.tenant_origin')}</CardTitle></CardHeader>
                        <CardContent><TenantsByOriginChart data={tenantsByOrigin} /></CardContent>
                    </Card>
                    )}
                    {isPersonalFlavor && bookingsByOrigin.length > 0 && (
                    <Card>
                        <CardHeader><CardTitle>{t('reports.booking_origin')}</CardTitle></CardHeader>
                        <CardContent><BookingsByOriginChart data={bookingsByOrigin} /></CardContent>
                    </Card>
                    )}
                    {isPersonalFlavor && expensesByCategory.length > 0 && (
                    <Card>
                        <CardHeader><CardTitle>{t('reports.expense_category')}</CardTitle></CardHeader>
                        <CardContent><ExpensesByCategoryChart data={expensesByCategory} /></CardContent>
                    </Card>
                    )}
                    {isPersonalFlavor && expensesByProperty.length > 0 && (
                    <Card>
                        <CardHeader><CardTitle>{t('reports.expense_property')}</CardTitle></CardHeader>
                        <CardContent><ExpensesByPropertyChart data={expensesByProperty} /></CardContent>
                    </Card>
                    )}
                    {bookingStatus.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle>{t('reports.booking_status')}</CardTitle></CardHeader>
                            <CardContent><BookingStatusChart data={bookingStatus} /></CardContent>
                        </Card>
                    )}
                    {isPersonalFlavor && financialSummary['usd'] && financialSummary['usd'].some(s => s.netResult > 0) && (
                        <Card>
                            <CardHeader><CardTitle>{t('reports.income_distribution')}</CardTitle></CardHeader>
                            <CardContent><NetIncomeDistributionChart summary={financialSummary['usd']} /></CardContent>
                        </Card>
                    )}
                </div>

                {!hasAnyFinancialData && (
                    <div className="flex flex-col items-center justify-center p-12 bg-muted/20 rounded-3xl border-2 border-dashed">
                        <p className="text-center text-muted-foreground font-medium">{t('reports.no_financial_data')}</p>
                    </div>
                )}
                
                {Object.entries(financialSummary).map(([currency, summaryForCurrency]) => {
                    if (!summaryForCurrency || summaryForCurrency.length === 0 || summaryForCurrency.every(i => i.totalIncome === 0 && i.totalExpenses === 0 && i.totalPayments === 0)) return null;
                    return (
                        <div key={currency} className="space-y-6">
                            <h3 className="text-2xl font-black border-b-2 pb-2 uppercase text-primary tracking-tight">{currency}</h3>
                            <Card>
                                <CardHeader><CardTitle>{t('reports.financial_detail')}</CardTitle></CardHeader>
                                <CardContent><FinancialSummaryTable summary={summaryForCurrency} currency={currency} /></CardContent>
                            </Card>
                        </div>
                    );
                })}
            </TabsContent>

            {isMasterAdmin && data.monitorStats && (
                <TabsContent value="monitor" className="animate-in fade-in duration-300">
                    <MonitorClient initialStats={data.monitorStats} onDataChanged={fetchData} />
                </TabsContent>
            )}
        </Tabs>
    </div>
  );
}

export default function InformesPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <InformesPageContent />
        </Suspense>
    )
}
