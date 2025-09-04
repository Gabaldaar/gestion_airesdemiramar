
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

interface FinancialSummaryTableProps {
  summary: FinancialSummary[];
  currency: 'ARS' | 'USD';
}

export default function FinancialSummaryTable({ summary, currency }: FinancialSummaryTableProps) {
  if (summary.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay datos para mostrar en el reporte.</p>;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Propiedad</TableHead>
          <TableHead className="text-right">Ingresos</TableHead>
          <TableHead className="text-right">Pagos Recibidos</TableHead>
          <TableHead className="text-right">Saldo</TableHead>
          <TableHead className="text-right">Gastos (Propiedad)</TableHead>
          <TableHead className="text-right">Gastos (Reservas)</TableHead>
          <TableHead className="text-right">Resultado Neto</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredSummary.map((item) => (
          <TableRow key={item.propertyId}>
            <TableCell className="font-medium">{item.propertyName}</TableCell>
            <TableCell className="text-right text-green-600">{formatCurrency(item.totalIncome)}</TableCell>
            <TableCell className="text-right text-blue-600">{formatCurrency(item.totalPayments)}</TableCell>
            <TableCell className={`text-right font-bold ${item.balance <= 0 ? 'text-green-700' : 'text-orange-600'}`}>
                {formatCurrency(item.balance)}
            </TableCell>
            <TableCell className="text-right text-red-600">{formatCurrency(item.totalPropertyExpenses)}</TableCell>
            <TableCell className="text-right text-red-600">{formatCurrency(item.totalBookingExpenses)}</TableCell>
            <TableCell className={`text-right font-bold ${item.netResult >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(item.netResult)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow className="font-bold bg-muted/50">
          <TableCell>Total General</TableCell>
          <TableCell className="text-right text-green-600">{formatCurrency(totalIncome)}</TableCell>
          <TableCell className="text-right text-blue-600">{formatCurrency(totalPayments)}</TableCell>
           <TableCell className={`text-right font-bold ${totalBalance <= 0 ? 'text-green-700' : 'text-orange-600'}`}>
                {formatCurrency(totalBalance)}
            </TableCell>
          <TableCell className="text-right text-red-600">{formatCurrency(totalPropertyExpenses)}</TableCell>
          <TableCell className="text-right text-red-600">{formatCurrency(totalBookingExpenses)}</TableCell>
          <TableCell className={`text-right font-bold ${totalNetResult >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {formatCurrency(totalNetResult)}
            </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
