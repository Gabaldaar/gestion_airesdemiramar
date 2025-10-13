
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

  // Siempre se renderiza como tarjetas
  return (
    <div className="space-y-4">
      {filteredSummary.map((item) => (
         <SummaryCard key={item.propertyId} item={item} currency={currency} />
      ))}
    </div>
  );
}
