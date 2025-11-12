
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


const formatCurrency = (amount: number, currency: 'ARS' | 'USD') => {
    if (currency === 'USD') {
        return `USD ${new Intl.NumberFormat('es-AR', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount)}`;
    }
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
};

// Componente para una tarjeta individual
const SummaryCard = ({ item, currency }: { item: FinancialSummary, currency: 'ARS' | 'USD' }) => (
    <Card>
        <CardHeader className="p-4 pb-2">
            <CardTitle className="text-lg">{item.propertyName}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-2 text-sm">
            <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Ingresos</span>
                <span className="font-medium text-green-600">{formatCurrency(item.totalIncome, currency)}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pagos Recibidos</span>
                <span className="font-medium text-blue-600">{formatCurrency(item.totalPayments, currency)}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Saldo</span>
                <span className={cn("font-bold", item.balance <= 0 ? 'text-green-700' : 'text-orange-600')}>{formatCurrency(item.balance, currency)}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Gastos (Prop.)</span>
                <span className="font-medium text-red-600">{formatCurrency(item.totalPropertyExpenses, currency)}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Gastos (Reservas)</span>
                <span className="font-medium text-red-600">{formatCurrency(item.totalBookingExpenses, currency)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t mt-2">
                <span className="text-muted-foreground font-bold">Resultado Neto</span>
                <span className={cn("font-bold text-lg", item.netResult >= 0 ? 'text-green-700' : 'text-red-700')}>{formatCurrency(item.netResult, currency)}</span>
            </div>
        </CardContent>
    </Card>
);

interface FinancialSummaryTableProps {
  summary: FinancialSummary[];
  currency: 'ARS' | 'USD';
}

export default function FinancialSummaryTable({ summary, currency }: FinancialSummaryTableProps) {
  const { width } = useWindowSize();
  const isMobile = width !== undefined && width < 768;


  const filteredSummary = useMemo(() => summary.filter(item => 
      item.totalIncome !== 0 ||
      item.totalPayments !== 0 ||
      item.balance !== 0 ||
      item.totalPropertyExpenses !== 0 ||
      item.totalBookingExpenses !== 0 ||
      item.netResult !== 0
  ), [summary]);

  const totals = useMemo(() => {
    return filteredSummary.reduce((acc, item) => {
        acc.totalIncome += item.totalIncome;
        acc.totalPayments += item.totalPayments;
        acc.balance += item.balance;
        acc.totalPropertyExpenses += item.totalPropertyExpenses;
        acc.totalBookingExpenses += item.totalBookingExpenses;
        acc.netResult += item.netResult;
        return acc;
    }, {
        totalIncome: 0,
        totalPayments: 0,
        balance: 0,
        totalPropertyExpenses: 0,
        totalBookingExpenses: 0,
        netResult: 0,
    });
  }, [filteredSummary]);


  if (filteredSummary.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">No hay datos en {currency} para el período seleccionado.</p>;
  }

  // While determining the screen size, we can show a placeholder or nothing
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
          <TableHead>Propiedad</TableHead>
          <TableHead className="text-right">Ingresos</TableHead>
          <TableHead className="text-right">Pagos Recibidos</TableHead>
          <TableHead className="text-right">Saldo</TableHead>
          <TableHead className="text-right">Gastos (Prop.)</TableHead>
          <TableHead className="text-right">Gastos (Reservas)</TableHead>
          <TableHead className="text-right">Resultado Neto</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredSummary.map((item) => (
          <TableRow key={item.propertyId}>
            <TableCell className="font-medium">{item.propertyName}</TableCell>
            <TableCell className="text-right text-green-600">{formatCurrency(item.totalIncome, currency)}</TableCell>
            <TableCell className="text-right text-blue-600">{formatCurrency(item.totalPayments, currency)}</TableCell>
            <TableCell className={cn("text-right font-bold", item.balance <= 0 ? 'text-green-700' : 'text-orange-600')}>{formatCurrency(item.balance, currency)}</TableCell>
            <TableCell className="text-right text-red-600">{formatCurrency(item.totalPropertyExpenses, currency)}</TableCell>
            <TableCell className="text-right text-red-600">{formatCurrency(item.totalBookingExpenses, currency)}</TableCell>
            <TableCell className={cn("text-right font-bold", item.netResult >= 0 ? 'text-green-700' : 'text-red-700')}>{formatCurrency(item.netResult, currency)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
          <TableRow className="bg-muted/50 font-bold">
              <TableCell>Totales</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.totalIncome, currency)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.totalPayments, currency)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.balance, currency)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.totalPropertyExpenses, currency)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.totalBookingExpenses, currency)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.netResult, currency)}</TableCell>
          </TableRow>
      </TableFooter>
    </Table>
  );
}
