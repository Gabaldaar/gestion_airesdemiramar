
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { cn } from "@/lib/utils";

interface FinancialSummaryTableProps {
  summary: FinancialSummary[];
  currency: 'ARS' | 'USD';
}

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


function SummaryCard({ item, currency }: { item: FinancialSummary, currency: 'ARS' | 'USD'}) {
    return (
        <Card>
            <CardHeader className="p-4">
                 <CardTitle className="text-lg">{item.propertyName}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid gap-2 text-sm">
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Ingresos</span><span className="font-medium text-green-600">{formatCurrency(item.totalIncome, currency)}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Pagos Recibidos</span><span className="font-medium text-blue-600">{formatCurrency(item.totalPayments, currency)}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Saldo</span><span className={cn("font-bold", item.balance <= 0 ? 'text-green-700' : 'text-orange-600')}>{formatCurrency(item.balance, currency)}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Gastos (Prop.)</span><span className="font-medium text-red-600">{formatCurrency(item.totalPropertyExpenses, currency)}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Gastos (Reservas)</span><span className="font-medium text-red-600">{formatCurrency(item.totalBookingExpenses, currency)}</span></div>
                <div className="flex justify-between items-center pt-2 border-t mt-2"><span className="text-muted-foreground font-bold">Resultado Neto</span><span className={cn("font-bold", item.netResult >= 0 ? 'text-green-700' : 'text-red-700')}>{formatCurrency(item.netResult, currency)}</span></div>
            </CardContent>
        </Card>
    );
}

export default function FinancialSummaryTable({ summary, currency }: FinancialSummaryTableProps) {
  if (summary.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay datos para mostrar en el reporte.</p>;
  }

  const totalIncome = summary.reduce((acc, item) => acc + item.totalIncome, 0);
  const totalPayments = summary.reduce((acc, item) => acc + item.totalPayments, 0);
  const totalBalance = summary.reduce((acc, item) => acc + item.balance, 0);
  const totalPropertyExpenses = summary.reduce((acc, item) => acc + item.totalPropertyExpenses, 0);
  const totalBookingExpenses = summary.reduce((acc, item) => acc + item.totalBookingExpenses, 0);
  const totalNetResult = summary.reduce((acc, item) => acc + item.netResult, 0);
  
  // Filter out rows that have all zero values
  const filteredSummary = summary.filter(item => 
      item.totalIncome !== 0 ||
      item.totalPayments !== 0 ||
      item.balance !== 0 ||
      item.totalPropertyExpenses !== 0 ||
      item.totalBookingExpenses !== 0 ||
      item.netResult !== 0
  );

  if (filteredSummary.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">No hay datos en {currency} para el período seleccionado.</p>;
  }

  return (
        <div className="space-y-4">
             <Card className="bg-muted max-w-md mx-auto">
                <CardHeader className="p-4">
                    <CardTitle className="text-lg text-center">Total General ({currency})</CardTitle>
                </CardHeader>
                <CardContent className="p-4 grid gap-2 text-sm">
                    <div className="flex justify-between items-center"><span className="text-muted-foreground">Ingresos</span><span className="font-medium text-green-600">{formatCurrency(totalIncome, currency)}</span></div>
                    <div className="flex justify-between items-center"><span className="text-muted-foreground">Pagos Recibidos</span><span className="font-medium text-blue-600">{formatCurrency(totalPayments, currency)}</span></div>
                    <div className="flex justify-between items-center"><span className="text-muted-foreground">Saldo</span><span className={cn("font-bold", totalBalance <= 0 ? 'text-green-700' : 'text-orange-600')}>{formatCurrency(totalBalance, currency)}</span></div>
                    <div className="flex justify-between items-center"><span className="text-muted-foreground">Gastos (Prop.)</span><span className="font-medium text-red-600">{formatCurrency(totalPropertyExpenses, currency)}</span></div>
                    <div className="flex justify-between items-center"><span className="text-muted-foreground">Gastos (Reservas)</span><span className="font-medium text-red-600">{formatCurrency(totalBookingExpenses, currency)}</span></div>
                    <div className="flex justify-between items-center pt-2 border-t mt-2"><span className="text-muted-foreground font-bold">Resultado Neto</span><span className={cn("font-bold", totalNetResult >= 0 ? 'text-green-700' : 'text-red-700')}>{formatCurrency(totalNetResult, currency)}</span></div>
                </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSummary.map((item) => (
                  <SummaryCard key={item.propertyId} item={item} currency={currency} />
              ))}
            </div>
        </div>
    )
}
