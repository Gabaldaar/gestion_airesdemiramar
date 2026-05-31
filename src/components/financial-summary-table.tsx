
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FinancialSummary } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useMemo } from 'react';
import useWindowSize from "@/hooks/use-window-size";
import { useTranslation } from "@/i18n/useTranslation";


const formatCurrency = (amount: number, currency: string) => {
    try {
        return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        }).format(amount);
    } catch (e) {
        return `${currency} ${amount.toFixed(2)}`;
    }
};

const SummaryCard = ({ item, currency }: { item: FinancialSummary, currency: string }) => {
    const { t } = useTranslation();
    const isUsd = currency.toUpperCase() === 'USD';
    const isArs = currency.toUpperCase() === 'ARS';
    
    return (
        <Card className={cn(
            "overflow-hidden border shadow-sm",
            isUsd && "border-green-200",
            isArs && "border-blue-200",
            (!isUsd && !isArs) && "border-primary/10"
        )}>
            <CardHeader className={cn(
                "p-4 pb-2 py-3 px-4",
                isUsd && "bg-green-500/10",
                isArs && "bg-blue-500/10",
                (!isUsd && !isArs) && "bg-primary/5"
            )}>
                <CardTitle className={cn(
                    "text-lg",
                    isUsd && "text-green-700",
                    isArs && "text-blue-700"
                )}>
                    {item.propertyName}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-3 space-y-2 text-sm">
                <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-muted-foreground">{t('reports.income')}</span>
                    <span className="font-medium text-green-600">{formatCurrency(item.totalIncome, currency)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t('reports.payments')}</span>
                    <span className="font-medium text-blue-600">{formatCurrency(item.totalPayments, currency)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t('reports.balance')}</span>
                    <span className={cn("font-bold", item.balance <= 0 ? 'text-green-700' : 'text-orange-600')}>{formatCurrency(item.balance, currency)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t('reports.expenses')}</span>
                    <span className="font-medium text-red-600">{formatCurrency(item.totalExpenses, currency)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t mt-2">
                    <span className="text-muted-foreground font-bold">{t('reports.net')}</span>
                    <span className={cn("font-bold text-lg", item.netResult >= 0 ? 'text-green-700' : 'text-red-700')}>{formatCurrency(item.netResult, currency)}</span>
                </div>
            </CardContent>
        </Card>
    );
};

interface FinancialSummaryTableProps {
  summary: FinancialSummary[];
  currency: string;
}

export default function FinancialSummaryTable({ summary, currency }: FinancialSummaryTableProps) {
  const { t } = useTranslation();
  const { width } = useWindowSize();
  const isMobile = width !== undefined && width < 768;


  const filteredSummary = useMemo(() => summary.filter(item => 
      item.totalIncome !== 0 ||
      item.totalPayments !== 0 ||
      item.balance !== 0 ||
      item.totalExpenses !== 0 ||
      item.netResult !== 0
  ), [summary]);

  const totals = useMemo(() => {
    return filteredSummary.reduce((acc, item) => {
        acc.totalIncome += item.totalIncome;
        acc.totalPayments += item.totalPayments;
        acc.balance += item.balance;
        acc.totalExpenses += item.totalExpenses;
        acc.netResult += item.netResult;
        return acc;
    }, {
        totalIncome: 0,
        totalPayments: 0,
        balance: 0,
        totalExpenses: 0,
        netResult: 0,
    });
  }, [filteredSummary]);


  if (filteredSummary.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">{t('reports.no_financial_data')}</p>;
  }

  if (width === undefined) {
    return <div className="space-y-4">
        {filteredSummary.map((item) => (
            <Card key={item.propertyId}>
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg bg-muted h-6 w-3/4 rounded-md animate-pulse"></CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                    <div className="h-4 bg-muted rounded-md animate-pulse"></div>
                    <div className="h-4 bg-muted rounded-md animate-pulse"></div>
                    <div className="h-4 bg-muted rounded-md animate-pulse"></div>
                </CardContent>
            </Card>
        ))}
    </div>;
  }

  if (isMobile) {
      return (
        <div className="space-y-4">
            {filteredSummary.map((item) => (
                <SummaryCard key={item.propertyId} item={item} currency={currency} />
            ))}
        </div>
      );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('reports.property')}</TableHead>
          <TableHead className="text-right">{t('reports.income')}</TableHead>
          <TableHead className="text-right">{t('reports.payments')}</TableHead>
          <TableHead className="text-right">{t('reports.balance')}</TableHead>
          <TableHead className="text-right">{t('reports.expenses')}</TableHead>
          <TableHead className="text-right">{t('reports.net')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredSummary.map((item) => (
          <TableRow key={item.propertyId}>
            <TableCell className="font-medium">{item.propertyName}</TableCell>
            <TableCell className="text-right text-green-600">{formatCurrency(item.totalIncome, currency)}</TableCell>
            <TableCell className="text-right text-blue-600">{formatCurrency(item.totalPayments, currency)}</TableCell>
            <TableCell className={cn("text-right font-bold", item.balance <= 0 ? 'text-green-700' : 'text-orange-600')}>{formatCurrency(item.balance, currency)}</TableCell>
            <TableCell className="text-right text-red-600">{formatCurrency(item.totalExpenses, currency)}</TableCell>
            <TableCell className={cn("text-right font-bold", item.netResult >= 0 ? 'text-green-700' : 'text-red-700')}>{formatCurrency(item.netResult, currency)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
          <TableRow className="bg-muted/50 font-bold">
              <TableCell>{t('reports.totals')}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.totalIncome, currency)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.totalPayments, currency)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.balance, currency)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.totalExpenses, currency)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.netResult, currency)}</TableCell>
          </TableRow>
      </TableFooter>
    </Table>
  );
}
