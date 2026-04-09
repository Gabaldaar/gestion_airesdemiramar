

'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { LiquidationWithProvider, WorkLog, ManualAdjustment, getWorkLogsByLiquidationId, getManualAdjustmentsByLiquidationId } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Printer, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseDateSafely } from '@/lib/utils';
import { Button } from './ui/button';
import Link from 'next/link';
import { Card, CardContent } from './ui/card';
import { useToast } from './ui/use-toast';

const formatDate = (dateString: string) => {
    const date = parseDateSafely(dateString);
    if (!date) return 'Fecha Inválida';
    return format(date, "dd-LLL-yy", { locale: es });
};

const formatCurrency = (amount: number, currency: 'ARS' | 'USD') => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
};


function WorkLogDetailCard({ log }: { log: WorkLog & { assignmentName?: string } }) {
    return (
        <Card>
            <CardContent className="p-3 text-sm space-y-1">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <p className="font-semibold">{log.assignmentName}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(log.date)}</p>
                    </div>
                    <p className="font-bold text-primary">{formatCurrency(log.calculatedCost, log.costCurrency)}</p>
                </div>
                <p>{log.description}</p>
                 <p className="text-muted-foreground text-xs">({log.quantity} {log.activityType === 'hourly' ? 'hs' : 'visita(s)'} a {formatCurrency(log.rateApplied, log.costCurrency)})</p>
            </CardContent>
        </Card>
    );
}

function AdjustmentDetailCard({ adj }: { adj: ManualAdjustment & { assignmentName?: string, categoryName?: string, notes?: string } }) {
    return (
        <Card>
            <CardContent className="p-3 text-sm space-y-1">
                <div className="flex justify-between items-start">
                     <div className="flex-1">
                        <p className="font-semibold">{adj.categoryName || 'Ajuste'}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(adj.date)}</p>
                    </div>
                    <p className={`font-bold ${adj.amount < 0 ? 'text-destructive' : 'text-primary'}`}>{formatCurrency(adj.amount, adj.currency)}</p>
                </div>
                 <p className="italic text-muted-foreground">{adj.assignmentName || 'N/A'}</p>
                 {adj.notes && <p>{adj.notes}</p>}
            </CardContent>
        </Card>
    );
}


export function LiquidationDetailsDialog({ liquidation, isOpen, onOpenChange }: {
    liquidation: LiquidationWithProvider;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}) {
    const [details, setDetails] = useState<{ workLogs: WorkLog[], adjustments: ManualAdjustment[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

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

    const handleCopyForWhatsApp = () => {
        if (!details) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Los detalles no se han cargado todavía.",
            });
            return;
        }

        let text = `*Liquidación para ${liquidation.providerName}*\n`;
        text += `*Fecha:* ${formatDate(liquidation.dateGenerated)}\n\n`;

        if (details.workLogs.length > 0) {
            text += "*Actividades:*\n";
            details.workLogs.forEach(log => {
                const logAsAny = log as any;
                text += `- ${logAsAny.assignmentName || 'N/A'}: ${log.description} (${log.quantity} ${log.activityType === 'hourly' ? 'hs' : 'visita(s)'}) - *${formatCurrency(log.calculatedCost, log.costCurrency)}*\n`;
            });
            text += '\n';
        }

        if (details.adjustments.length > 0) {
            text += "*Ajustes:*\n";
            details.adjustments.forEach(adj => {
                const adjAsAny = adj as any;
                const sign = adj.amount > 0 ? '+' : '';
                const notesText = adjAsAny.notes ? ` (${adjAsAny.notes})` : '';
                text += `- ${adjAsAny.categoryName || 'Ajuste'}${notesText} - *${sign}${formatCurrency(adj.amount, adj.currency)}*\n`;
            });
            text += '\n';
        }

        text += `*Total a Pagar:* ${formatCurrency(liquidation.totalAmount, liquidation.currency)}\n`;
        text += `*Pagado:* ${formatCurrency(liquidation.amountPaid, liquidation.currency)}\n`;
        text += `*SALDO:* ${formatCurrency(liquidation.balance, liquidation.currency)}`;

        navigator.clipboard.writeText(text);

        toast({
            title: "Copiado",
            description: "El detalle de la liquidación se ha copiado al portapapeles.",
        });
    };

    const handlePrint = () => {
        window.open(`/liquidations/${liquidation.id}/print`, '_blank');
    };


    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Detalle de Liquidación</DialogTitle>
                    <p className="text-xl font-bold text-primary pt-2">
                        Liquidación para {liquidation.providerName} del {formatDate(liquidation.dateGenerated)}.
                    </p>
                </DialogHeader>
                {isLoading ? (
                    <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : details ? (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {details.workLogs.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-2">Actividades</h4>
                                {/* Mobile View */}
                                <div className="space-y-2 md:hidden">
                                    {details.workLogs.map(log => <WorkLogDetailCard key={log.id} log={log as any} />)}
                                </div>
                                {/* Desktop View */}
                                <div className="hidden md:block">
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
                            </div>
                        )}
                        {details.adjustments.length > 0 && (
                             <div>
                                <h4 className="font-semibold mb-2">Ajustes</h4>
                                {/* Mobile View */}
                                <div className="space-y-2 md:hidden">
                                    {details.adjustments.map(adj => <AdjustmentDetailCard key={adj.id} adj={adj as any} />)}
                                </div>
                                {/* Desktop View */}
                                <div className="hidden md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Fecha</TableHead>
                                                <TableHead>Categoría</TableHead>
                                                <TableHead>Imputado a</TableHead>
                                                <TableHead>Notas</TableHead>
                                                <TableHead className="text-right">Monto</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {details.adjustments.map((adj: any) => (
                                                <TableRow key={adj.id}>
                                                    <TableCell>{formatDate(adj.date)}</TableCell>
                                                    <TableCell>{adj.categoryName || 'Ajuste'}</TableCell>
                                                    <TableCell>{adj.assignmentName || 'N/A'}</TableCell>
                                                    <TableCell>{adj.notes || '-'}</TableCell>
                                                    <TableCell className={`text-right ${adj.amount < 0 ? 'text-destructive' : ''}`}>{formatCurrency(adj.amount, adj.currency)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
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
                 <DialogFooter className="pt-4">
                    <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                        Cerrar
                    </Button>
                     <Button variant="outline" onClick={handleCopyForWhatsApp}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar para WhatsApp
                    </Button>
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir/PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
