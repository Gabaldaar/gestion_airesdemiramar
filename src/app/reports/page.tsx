
import { getFinancialSummaryByProperty } from "@/lib/data";
import ReportsClient from "@/components/reports-client";
import { Suspense } from "react";

function ReportsContent({ from, to }: { from?: string; to?: string }) {
  // This is now a temporary wrapper to show how data fetching works.
  // The actual state management and filtering logic will be in ReportsClient.
  return <Suspense fallback={<div>Cargando...</div>}><ReportsPageContent from={from} to={to} /></Suspense>;
}


async function ReportsPageContent({ from, to }: { from?: string; to?: string }) {
  const summary = await getFinancialSummaryByProperty({ startDate: from, endDate: to });
  return <ReportsClient summary={summary} />;
}


export default function ReportsPage({
  searchParams,
}: {
  searchParams?: {
    from?: string;
    to?: string;
  };
}) {
  const from = searchParams?.from;
  const to = searchParams?.to;

  return (
    <ReportsContent from={from} to={to} />
    )
}
