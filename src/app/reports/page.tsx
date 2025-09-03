import { getFinancialSummaryByProperty } from "@/lib/data";
import ReportsClient from "@/components/reports-client";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: {
    from?: string;
    to?: string;
  };
}) {
  const from = searchParams?.from;
  const to = searchParams?.to;

  const summary = await getFinancialSummaryByProperty({ startDate: from, endDate: to });

  return <ReportsClient summary={summary} from={from} to={to} />;
}
