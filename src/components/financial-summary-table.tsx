
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import useWindowSize from "@/hooks/use-window-size";

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


export default function FinancialSummaryTable({ summary, currency }: FinancialSummaryTableProps) {
  const { width } = useWindowSize();
  const isMobile = width !== undefined && width < 768;
  
  if (summary.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay datos para mostrar en el reporte.</p>;
  }
  
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

  // Mobile view: Renders each row as a card
  if (isMobile) {
    return (
      <div className="space-y-4">
        {filteredSummary.map((item) => (
           <Card key={item.propertyId}>
            <CardHeader className="p-4">
              <CardTitle>{item.propertyName}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2 text-sm">
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Ingresos</span><span className="font-medium text-green-600">{formatCurrency(item.totalIncome, currency)}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Pagos Recibidos</span><span className="font-medium text-blue-600">{formatCurrency(item.totalPayments, currency)}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Saldo</span><span className={cn("font-bold", item.balance <= 0 ? 'text-green-700' : 'text-orange-600')}>{formatCurrency(item.balance, currency)}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Gastos (Prop.)</span><span className="font-medium text-red-600">{formatCurrency(item.totalPropertyExpenses, currency)}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Gastos (Reservas)</span><span className="font-medium text-red-600">{formatCurrency(item.totalBookingExpenses, currency)}</span></div>
                <div className="flex justify-between items-center pt-2 border-t mt-2"><span className="text-muted-foreground font-bold">Resultado Neto</span><span className={cn("font-bold", item.netResult >= 0 ? 'text-green-700' : 'text-red-700')}>{formatCurrency(item.netResult, currency)}</span></div>
            </CardContent>
        </Card>
        ))}
      </div>
    )
  }

  // Desktop View: Renders a standard table
  const totalIncome = summary.reduce((acc, item) => acc + item.totalIncome, 0);
  const totalPayments = summary.reduce((acc, item) => acc + item.totalPayments, 0);
  const totalBalance = summary.reduce((acc, item) => acc + item.balance, 0);
  const totalPropertyExpenses = summary.reduce((acc, item) => acc + item.totalPropertyExpenses, 0);
  const totalBookingExpenses = summary.reduce((acc, item) => acc + item.totalBookingExpenses, 0);
  const totalNetResult = summary.reduce((acc, item) => acc + item.netResult, 0);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Propiedad</TableHead>
          <TableHead className="text-right">Ingresos</TableHead>
          <TableHead className="text-right">Pagos</TableHead>
          <TableHead className="text-right">Saldo</TableHead>
          <TableHead className="text-right">G. Prop.</TableHead>
          <TableHead className="text-right">G. Reservas</TableHead>
          <TableHead className="text-right font-bold">Neto</TableHead>
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
        <TableRow>
          <TableCell className="font-bold">Total General</TableCell>
          <TableCell className="text-right font-bold text-green-600">{formatCurrency(totalIncome, currency)}</TableCell>
          <TableCell className="text-right font-bold text-blue-600">{formatCurrency(totalPayments, currency)}</TableCell>
          <TableCell className={cn("text-right font-extrabold", totalBalance <= 0 ? 'text-green-700' : 'text-orange-600')}>{formatCurrency(totalBalance, currency)}</TableCell>
          <TableCell className="text-right font-bold text-red-600">{formatCurrency(totalPropertyExpenses, currency)}</TableCell>
          <TableCell className="text-right font-bold text-red-600">{formatCurrency(totalBookingExpenses, currency)}</TableCell>
          <TableCell className={cn("text-right font-extrabold", totalNetResult >= 0 ? 'text-green-700' : 'text-red-700')}>{formatCurrency(totalNetResult, currency)}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
