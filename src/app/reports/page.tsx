

'use client';

import { getFinancialSummaryByProperty, FinancialSummaryByCurrency, getTenantsByOriginSummary, TenantsByOriginSummary, getExpensesByCategorySummary, ExpensesByCategorySummary, getExpensesByPropertySummary, ExpensesByPropertySummary, getBookingsByOriginSummary, BookingsByOriginSummary } from "@/lib/data";
import ReportsClient from "@/components/reports-client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

interface ReportsData {
    financialSummary: FinancialSummaryByCurrency;
    tenantsByOrigin: TenantsByOriginSummary[];
    expensesByCategory: ExpensesByCategorySummary[];
    expensesByProperty: ExpensesByPropertySummary[];
    bookingsByOrigin: BookingsByOriginSummary[];
}

function ReportsPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;

  const [data, setData] = useState<ReportsData | null>(null);
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
        ]).then(([financialSummary, tenantsByOrigin, expensesByCategory, expensesByProperty, bookingsByOrigin]) => {
            setData({ financialSummary, tenantsByOrigin, expensesByCategory, expensesByProperty, bookingsByOrigin });
            setLoading(false);
        });
    }
  }, [user, from, to]);

  // Pass loading state to the client
  if (loading || !data) {
      return <p>Cargando reporte...</p>
  }
  
  return <ReportsClient 
    financialSummary={data.financialSummary} 
    tenantsByOrigin={data.tenantsByOrigin}
    expensesByCategory={data.expensesByCategory}
    expensesByProperty={data.expensesByProperty}
    bookingsByOrigin={data.bookingsByOrigin}
     />;
}


export default function ReportsPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
        <ReportsPageContent />
    </Suspense>
    )
}

