
'use client';

import { useState } from 'react';
import { LiquidationWithProvider, Property, TaskScope } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { LiquidationDetailsDialog } from './liquidation-details-dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseDateSafely } from '@/lib/utils';
import { LiquidationPaymentForm } from './liquidation-payment-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { revertLiquidation } from '@/lib/actions';
import { useToast } from './ui/use-toast';
import { Loader2 } from 'lucide-react';


const formatDate = (dateString: string) => {
    const date = parseDateSafely(dateString);
    if (!date) return 'Fecha Inválida';
    return format(date, "dd-LLL-yy", { locale: es });
};
const formatCurrency = (amount: number, currency: 'ARS' | 'USD') => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
};

const getStatusBadge = (status: Liquidation['status']) => {
    switch (status) {
        case 'paid':
            return <Badge variant="default" className="bg-green-600">Pagada</Badge>;
        case 'partially_paid':
            return <Badge variant="secondary" className="bg-yellow-500 text-black">Pago Parcial</Badge>;
        case 'pending_payment':
            return <Badge variant="outline">Pendiente de Pago</Badge>;
        default:
            return <Badge variant="destructive">Desconocido</Badge>;
    }
};

function RevertLiquidationAction({ liquidationId, onReverted }: { liquidationId: string, onReverted: () => void }) {
    const [isPending, startTransition] = React.useTransition();
    const { toast } = useToast();

    const handleRevert = async () => {
        startTransition(async () => {
            const result = await revertLiquidation({ success: false, message: '' }, liquidationId);
            if (result.success) {
                toast({ title: "Éxito", description: "La liquidación ha sido revertida." });
                onReverted();
            } else {
                toast({ title: "Error", description: result.message, variant: 'destructive' });
            }
        });
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">Revertir</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción es irreversible. Se eliminará la liquidación, se borrarán los gastos generados y todas las actividades y ajustes volverán al estado "Pendiente de Liquidación".
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRevert} disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sí, revertir
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export function LiquidationsHistoryList({ liquidations, onDataRefreshed }: {
    liquidations: LiquidationWithProvider[];
    properties: Property[];
    scopes: TaskScope[];
    onDataRefreshed: () => void;
}) {
    const [selectedLiquidation, setSelectedLiquidation] = useState<LiquidationWithProvider | null>(null);
    const [paymentLiquidation, setPaymentLiquidation] = useState<LiquidationWithProvider | null>(null);

    if (liquidations.length === 0) {
        return <p className="text-center text-muted-foreground p-8">No hay liquidaciones en el historial.</p>;
    }

    return (
        <>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Colaborador</TableHead>
                            <TableHead className="text-right">Monto Total</TableHead>
                            <TableHead className="text-right">Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {liquidations.map(liq => (
                            <TableRow key={liq.id}>
                                <TableCell>{formatDate(liq.dateGenerated)}</TableCell>
                                <TableCell>{liq.providerName}</TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency(liq.totalAmount, liq.currency)}</TableCell>
                                <TableCell className="text-right">{getStatusBadge(liq.status)}</TableCell>
                                <TableCell className="text-right">
                                     <div className="flex gap-2 justify-end">
                                        <Button variant="outline" size="sm" onClick={() => setSelectedLiquidation(liq)}>
                                            Ver Detalles
                                        </Button>
                                        {liq.status !== 'paid' && (
                                            <Button size="sm" onClick={() => setPaymentLiquidation(liq)}>
                                                Pagar
                                            </Button>
                                        )}
                                        <RevertLiquidationAction liquidationId={liq.id} onReverted={onDataRefreshed} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {selectedLiquidation && (
                <LiquidationDetailsDialog
                    liquidation={selectedLiquidation}
                    isOpen={!!selectedLiquidation}
                    onOpenChange={(isOpen) => {
                        if (!isOpen) setSelectedLiquidation(null);
                    }}
                />
            )}
             {paymentLiquidation && (
                <LiquidationPaymentForm
                    liquidation={paymentLiquidation}
                    isOpen={!!paymentLiquidation}
                    onOpenChange={(isOpen) => {
                        if (!isOpen) setPaymentLiquidation(null);
                    }}
                    onActionComplete={onDataRefreshed}
                />
            )}
        </>
    );
}
