
'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getTasksByProviderId,
  getPropertyExpensesByProviderId,
  TaskWithDetails,
  PropertyExpense,
} from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProviderHistoryDialogProps {
  providerId: string;
  providerName: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return format(date, "dd-LLL-yy", { locale: es });
};

const formatCurrency = (amount: number | undefined, currency: 'ARS' | 'USD' = 'ARS') => {
    if (typeof amount === 'undefined') return '-';
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency, minimumFractionDigits: 0 }).format(amount);
}


export function ProviderHistoryDialog({ providerId, providerName, isOpen, onOpenChange }: ProviderHistoryDialogProps) {
  const [history, setHistory] = useState<{ tasks: TaskWithDetails[], expenses: PropertyExpense[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && providerId) {
      setIsLoading(true);
      setHistory(null); // Clear previous history
      Promise.all([
        getTasksByProviderId(providerId),
        getPropertyExpensesByProviderId(providerId)
      ]).then(([tasks, expenses]) => {
        setHistory({ tasks, expenses });
        setIsLoading(false);
      }).catch(err => {
        console.error("Error fetching provider history:", err);
        setIsLoading(false);
      });
    }
  }, [isOpen, providerId]);

  const totalPaid = useMemo(() => {
    if (!history) return { ARS: 0, USD: 0 };
    return history.expenses.reduce((acc, expense) => {
        if (expense.originalUsdAmount) {
            acc.USD += expense.originalUsdAmount;
        } else {
            acc.ARS += expense.amount;
        }
        return acc;
    }, { ARS: 0, USD: 0 });
  }, [history]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Historial de Trabajos de {providerName}</DialogTitle>
          <DialogDescription>
            Un resumen de todas las tareas y gastos asociados a este proveedor.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                <span>Cargando historial...</span>
            </div>
        ) : history ? (
          <div className="space-y-6">
            <div className="space-y-2">
                <h3 className="font-semibold text-lg">Pagos Realizados</h3>
                {history.expenses.length > 0 ? (
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead className="text-right">Monto</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {history.expenses.map(expense => (
                                    <TableRow key={expense.id}>
                                        <TableCell>{formatDate(expense.date)}</TableCell>
                                        <TableCell>{expense.description}</TableCell>
                                        <TableCell className="text-right font-medium">
                                            {expense.originalUsdAmount 
                                                ? formatCurrency(expense.originalUsdAmount, 'USD') 
                                                : formatCurrency(expense.amount, 'ARS')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="font-bold bg-muted/50">
                                    <TableCell colSpan={2} className="text-right">Total Pagado (ARS)</TableCell>
                                    <TableCell className="text-right">{formatCurrency(totalPaid.ARS, 'ARS')}</TableCell>
                                </TableRow>
                                 <TableRow className="font-bold bg-muted/50">
                                    <TableCell colSpan={2} className="text-right">Total Pagado (USD)</TableCell>
                                    <TableCell className="text-right">{formatCurrency(totalPaid.USD, 'USD')}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No se han registrado gastos para este proveedor.</p>
                )}
            </div>
             <div className="space-y-2">
                <h3 className="font-semibold text-lg">Tareas Asignadas</h3>
                 {history.tasks.length > 0 ? (
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha Límite</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead>Propiedad</TableHead>
                                    <TableHead className="text-right">Costo Est.</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {history.tasks.map(task => (
                                    <TableRow key={task.id}>
                                        <TableCell>{formatDate(task.dueDate)}</TableCell>
                                        <TableCell>{task.description}</TableCell>
                                        <TableCell>{task.propertyName}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(task.estimatedCost, task.costCurrency)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                 ) : (
                    <p className="text-sm text-muted-foreground">No se han asignado tareas a este proveedor.</p>
                 )}
            </div>
          </div>
        ) : (
            <p>No se encontró historial para este proveedor.</p>
        )}

        <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

