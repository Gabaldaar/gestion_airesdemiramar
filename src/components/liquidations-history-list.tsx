

'use client';

import React, { useState, useTransition } from 'react';
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
import { Input } from './ui/input';
import { Label } from './ui/label';


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

function RevertLiquidationAction({ liquidation, onReverted }: { liquidation: LiquidationWithProvider, onReverted: () => void }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const [confirmText, setConfirmText] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const hasPayments = liquidation.amountPaid > 0;
    const confirmationString = "REVERTIR";

    const handleRevert = () => {
        if (hasPayments && confirmText !== confirmationString) {
            toast({
                title: "Confirmación incorrecta",
                description: `Debes escribir "${confirmationString}" para confirmar.`,
                variant: "destructive",
            });
            return;
        }

        startTransition(async () => {
            const result = await revertLiquidation({ success: false, message: '' }, liquidation.id);
            if (result.success) {
                toast({ title: "Éxito", description: "La liquidación ha sido revertida." });
                setIsOpen(false);
                onReverted();
            } else {
                toast({ title: "Error", description: result.message, variant: 'destructive' });
            }
        });
    };
    
    const isButtonDisabled = isPending || (hasPayments && confirmText !== confirmationString);

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => {
            if (!open) setConfirmText(""); // Reset on close
            setIsOpen(open);
        }}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">Revertir</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción es irreversible. Se eliminará la liquidación, los gastos asociados y todas las actividades y ajustes volverán al estado "Pendiente".
                        {hasPayments && (
                            <span className="font-bold text-destructive mt-2 block">
                                ¡Atención! Esta liquidación tiene pagos registrados. Revertirla también eliminará los registros de gastos asociados a esos pagos, lo que puede afectar tu contabilidad.
                            </span>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {hasPayments && (
                    <div className="space-y-2 my-4">
                        <Label htmlFor="confirm-revert-text" className="font-semibold">
                            Para confirmar, escribe "{confirmationString}" en el campo de abajo.
                        </Label>
                        <Input
                            id="confirm-revert-text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            autoComplete="off"
                        />
                    </div>
                )}
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRevert} disabled={isButtonDisabled}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {hasPayments ? "Sí, revertir liquidación y pagos" : "Sí, revertir"}
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
                            <TableHead className="text-right">Saldo</TableHead>
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
                                <TableCell className="text-right font-bold text-orange-600">
                                    {liq.balance > 0.01 ? formatCurrency(liq.balance, liq.currency) : '-'}
                                </TableCell>
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
                                        <RevertLiquidationAction liquidation={liq} onReverted={onDataRefreshed} />
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
