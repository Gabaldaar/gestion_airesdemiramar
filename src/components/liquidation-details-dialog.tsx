'use client';

import { useEffect, useState, useCallback } from 'react';
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
import { parseDateSafely, cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useToast } from './ui/use-toast';
import { useAuth } from './auth-provider';
import { useTranslation } from '@/i18n/useTranslation';

const formatDate = (dateString: string) => {
    const date = parseDateSafely(dateString);
    if (!date) return 'Fecha Inválida';
    return format(date, "dd-LLL-yy", { locale: es });
};

const formatCurrency = (amount: number, currency: string) => {
    try {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
    } catch(e) {
        return `${currency} ${amount.toFixed(2)}`;
    }
};

function WorkLogDetailCard({ log }: { log: WorkLog & { assignmentName?: string } }) {
    return (
        <Card className="mb-2">
            <CardContent className="p-3 text-sm space-y-1">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <p className="font-semibold">{log.assignmentName}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(log.date)}</p>
                    </div>
                    <p className="font-bold text-primary">{formatCurrency(log.calculatedCost, log.costCurrency)}</p>
                </div>
                <p>{log.description}</p>
                 <p className="text-muted-foreground text-xs">({log.quantity} {log.activityType === 'hourly' ? 'hs' : log.activityType === 'monthly' ? 'mes(es)' : 'visita(s)'} a {formatCurrency(log.rateApplied, log.costCurrency)})</p>
            </CardContent>
        </Card>
    );
}

function AdjustmentDetailCard({ adj }: { adj: ManualAdjustment & { assignmentName?: string, categoryName?: string, notes?: string } }) {
    return (
        <Card className="mb-2">
            <CardContent className="p-3 text-sm space-y-1">
                <div className="flex justify-between items-start">
                     <div className="flex-1">
                        <p className="font-semibold">{adj.categoryName || 'Ajuste'}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(adj.date)}</p>
                    </div>
                    <p className={cn("font-bold", adj.amount < 0 ? 'text-destructive' : 'text-primary')}>{formatCurrency(adj.amount, adj.currency)}</p>
                </div>
                 <p className="italic text-muted-foreground text-xs">{adj.assignmentName || 'N/A'}</p>
                 {adj.notes && <p className="text-xs">{adj.notes}</p>}
            </CardContent>
        </Card>
    );
}

export function LiquidationDetailsDialog({ liquidation, isOpen, onOpenChange }: {
    liquidation: LiquidationWithProvider;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}) {
    const { orgId } = useAuth();
    const { t } = useTranslation();
    const [details, setDetails] = useState<{ workLogs: WorkLog[], adjustments: ManualAdjustment[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen && liquidation.id) {
            setIsLoading(true);
            const currentOrgId = orgId || 'global';
            Promise.all([
                getWorkLogsByLiquidationId(liquidation.id, currentOrgId),
                getManualAdjustmentsByLiquidationId(liquidation.id, currentOrgId),
            ]).then(([workLogs, adjustments]) => {
                setDetails({ workLogs, adjustments });
                setIsLoading(false);
            }).catch(err => {
                console.error("Failed to fetch liquidation details:", err);
                setIsLoading(false);
            });
        }
    }, [isOpen, liquidation.id, orgId]);

    const handleCopyForWhatsApp = () => {
        if (!details) return;

        let text = `*Liquidación para ${liquidation.providerName}*\n`;
        text += `*Fecha:* ${formatDate(liquidation.dateGenerated)}\n\n`;

        if (details.workLogs.length > 0) {
            text += "*Actividades:*\n";
            details.workLogs.forEach(log => {
                const logAsAny = log as any;
                text += `- ${logAsAny.assignmentName || 'N/A'}: ${log.description} (${log.quantity} ${log.activityType === 'hourly' ? 'hs' : log.activityType === 'monthly' ? 'mes(es)' : 'visita(s)'}) - *${formatCurrency(log.calculatedCost, log.costCurrency)}*\n`;
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
        toast({ title: t('common.success'), description: "El detalle se ha copiado al portapapeles." });
    };

    const handlePrint = () => {
        window.open(`/liquidations/${liquidation.id}/print`, '_blank');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('liquidations.details.title')}</DialogTitle>
                    <div className="text-xl font-bold text-primary pt-2">
                        {liquidation.providerName} — {formatDate(liquidation.dateGenerated)}
                    </div>
                </DialogHeader>
                {isLoading ? (
                    <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : details ? (
                    <div className="space-y-4">
                        {details.workLogs.length > 0 && (
                            <div>
                                <h4 className="font-bold text-sm uppercase tracking-wider text-blue-700 mb-3">Actividades</h4>
                                <div className="md:hidden">
                                    {details.workLogs.map(log => <WorkLogDetailCard key={log.id} log={log as any} />)}
                                </div>
                                <div className="hidden md:block border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
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
                                                    <TableCell className="text-xs">{formatDate(log.date)}</TableCell>
                                                    <TableCell className="text-xs font-medium">{(log as any).assignmentName || 'N/A'}</TableCell>
                                                    <TableCell className="text-xs">{log.description}</TableCell>
                                                     <TableCell className="text-right text-xs">{log.quantity} {log.activityType === 'hourly' ? 'hs' : log.activityType === 'monthly' ? 'mes' : 'vis.'}</TableCell>
                                                    <TableCell className="text-right text-xs">{formatCurrency(log.rateApplied, log.costCurrency)}</TableCell>
                                                    <TableCell className="text-right font-bold">{formatCurrency(log.calculatedCost, log.costCurrency)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                        {details.adjustments.length > 0 && (
                             <div>
                                <h4 className="font-bold text-sm uppercase tracking-wider text-orange-700 mb-3">Ajustes</h4>
                                <div className="md:hidden">
                                    {details.adjustments.map(adj => <AdjustmentDetailCard key={adj.id} adj={adj as any} />)}
                                </div>
                                <div className="hidden md:block border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
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
                                                    <TableCell className="text-xs">{formatDate(adj.date)}</TableCell>
                                                    <TableCell className="text-xs font-medium">{adj.categoryName || 'Ajuste'}</TableCell>
                                                    <TableCell className="text-xs">{adj.assignmentName || 'N/A'}</TableCell>
                                                    <TableCell className="text-xs italic">{adj.notes || '-'}</TableCell>
                                                    <TableCell className={cn("text-right font-bold", adj.amount < 0 ? 'text-destructive' : 'text-primary')}>
                                                        {formatCurrency(adj.amount, adj.currency)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                        <div className="border-t pt-4 mt-4 space-y-2 text-right bg-muted/20 p-4 rounded-xl">
                             <p className="text-xs text-muted-foreground uppercase font-bold">Monto Total: <span className="text-foreground ml-2">{formatCurrency(liquidation.totalAmount, liquidation.currency)}</span></p>
                             <p className="text-xs text-muted-foreground uppercase font-bold">Monto Pagado: <span className="text-green-600 ml-2">{formatCurrency(liquidation.amountPaid, liquidation.currency)}</span></p>
                            <p className="text-xl font-black border-t pt-2 mt-2">SALDO: <span className={cn(liquidation.balance > 0.01 ? 'text-orange-600' : 'text-green-700')}>{formatCurrency(liquidation.balance, liquidation.currency)}</span></p>
                        </div>
                    </div>
                ) : (
                    <p className="text-center py-12 text-muted-foreground italic">No se encontraron detalles para esta liquidación.</p>
                )}
                 <DialogFooter className="pt-6 gap-2 border-t">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cerrar
                    </Button>
                     <Button variant="secondary" onClick={handleCopyForWhatsApp} disabled={!details}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar para WhatsApp
                    </Button>
                    <Button variant="secondary" onClick={handlePrint} disabled={!details}>
                        <Printer className="mr-2 h-4 w-4" />
                        PDF / Imprimir
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}