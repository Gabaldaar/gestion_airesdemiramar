

'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { LiquidationWithProvider, WorkLog, ManualAdjustment, getWorkLogsByLiquidationId, getManualAdjustmentsByLiquidationId } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseDateSafely } from '@/lib/utils';

const formatDate = (dateString: string) => {
    const date = parseDateSafely(dateString);
    if (!date) return 'Fecha Inválida';
    return format(date, "dd-LLL-yy", { locale: es });
};

const formatCurrency = (amount: number, currency: 'ARS' | 'USD') => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
};

export function LiquidationDetailsDialog({ liquidation, isOpen, onOpenChange }: {
    liquidation: LiquidationWithProvider;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}) {
    const [details, setDetails] = useState<{ workLogs: WorkLog[], adjustments: ManualAdjustment[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            Promise.all([
                getWorkLogsByLiquidationId(liquidation.id),
                getManualAdjustmentsByLiquidationId(liquidation.id),
            ]).then(([workLogs, adjustments]) => {
                setDetails({ workLogs, adjustments });
                setIsLoading(false);
            }).catch(err => {
                console.error("Failed to fetch liquidation details:", err);
                setIsLoading(false);
            });
        }
    }, [isOpen, liquidation.id]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Detalle de Liquidación</DialogTitle>
                    <DialogDescription>
                        Liquidación para {liquidation.providerName} del {formatDate(liquidation.dateGenerated)}.
                    </DialogDescription>
                </DialogHeader>
                {isLoading ? (
                    <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : details ? (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {details.workLogs.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-2">Actividades</h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Asignación</TableHead>
                                            <TableHead>Descripción</TableHead>
                                            <TableHead className="text-right">Cantidad</TableHead>
                                            <TableHead className="text-right">Tarifa</TableHead>
                                            <TableHead className="text-right">Costo</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {details.workLogs.map(log => (
                                            <TableRow key={log.id}>
                                                <TableCell>{formatDate(log.date)}</TableCell>
                                                <TableCell>{(log as any).assignmentName || 'N/A'}</TableCell>
                                                <TableCell>{log.description}</TableCell>
                                                <TableCell className="text-right">{log.quantity} {log.activityType === 'hourly' ? 'hs' : 'visita(s)'}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(log.rateApplied, log.costCurrency)}</TableCell>
                                                <TableCell className="text-right font-medium">{formatCurrency(log.calculatedCost, log.costCurrency)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                        {details.adjustments.length > 0 && (
                             <div>
                                <h4 className="font-semibold mb-2">Ajustes</h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Asignación</TableHead>
                                            <TableHead>Descripción</TableHead>
                                            <TableHead className="text-right">Monto</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {details.adjustments.map(adj => (
                                            <TableRow key={adj.id}>
                                                <TableCell>{formatDate(adj.date)}</TableCell>
                                                <TableCell>{(adj as any).assignmentName || 'N/A'}</TableCell>
                                                <TableCell>{adj.description}</TableCell>
                                                <TableCell className={`text-right ${adj.amount < 0 ? 'text-destructive' : ''}`}>{formatCurrency(adj.amount, adj.currency)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                        <div className="border-t pt-4 mt-4 space-y-2 text-right">
                             <p className="text-sm text-muted-foreground">Monto Total: <span className="font-semibold text-foreground">{formatCurrency(liquidation.totalAmount, liquidation.currency)}</span></p>
                             <p className="text-sm text-muted-foreground">Monto Pagado: <span className="font-semibold text-green-600">{formatCurrency(liquidation.amountPaid, liquidation.currency)}</span></p>
                            <p className="text-lg font-bold">Saldo: <span className={liquidation.balance > 0 ? 'text-orange-600' : 'text-foreground'}>{formatCurrency(liquidation.balance, liquidation.currency)}</span></p>
                        </div>
                    </div>
                ) : (
                    <p>No se encontraron detalles para esta liquidación.</p>
                )}
            </DialogContent>
        </Dialog>
    );
}
