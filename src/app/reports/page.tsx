
'use client';

import { getFinancialSummaryByProperty, FinancialSummaryByCurrency } from "@/lib/data";
import ReportsClient from "@/components/reports-client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

function ReportsPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;

  const [summary, setSummary] = useState<FinancialSummaryByCurrency | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
        setLoading(true);
        getFinancialSummaryByProperty({ startDate: from, endDate: to }).then(summaryData => {
            setSummary(summaryData);
            setLoading(false);
        });
    }
  }, [user, from, to]);

  if (!user || loading || !summary) {
      return <p>Cargando reporte...</p>
  }
  
  return <ReportsClient summary={summary} />;
}


export default function ReportsPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
        <ReportsPageContent />
    </Suspense>
    )
}
