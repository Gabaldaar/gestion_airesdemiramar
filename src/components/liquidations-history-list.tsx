
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

const formatDate = (dateString: string) => {
    const date = parseDateSafely(dateString);
    if (!date) return 'Fecha Inválida';
    return format(date, "dd-LLL-yy", { locale: es });
};
const formatCurrency = (amount: number, currency: 'ARS' | 'USD') => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
};

export function LiquidationsHistoryList({ liquidations, properties, scopes }: {
    liquidations: LiquidationWithProvider[];
    properties: Property[];
    scopes: TaskScope[];
}) {
    const [selectedLiquidation, setSelectedLiquidation] = useState<LiquidationWithProvider | null>(null);

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
                                <TableCell className="text-right"><Badge>{liq.status}</Badge></TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" onClick={() => setSelectedLiquidation(liq)}>
                                        Ver Detalles
                                    </Button>
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
        </>
    );
}
