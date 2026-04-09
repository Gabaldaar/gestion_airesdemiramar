
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { 
    Liquidation, 
    WorkLog, 
    ManualAdjustment, 
    Provider, 
    getLiquidationById, 
    getWorkLogsByLiquidationId, 
    getManualAdjustmentsByLiquidationId, 
    getProviderById 
} from '@/lib/data';
import Image from 'next/image';
import LogoCont from '@/assets/logocont.png';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseDateSafely } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';

const formatDate = (dateString: string) => {
    const date = parseDateSafely(dateString);
    if (!date) return 'Fecha Inválida';
    return format(date, "dd 'de' LLLL 'de' yyyy", { locale: es });
};

const formatCurrency = (amount: number, currency: 'ARS' | 'USD') => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
};

interface PrintPageData {
    liquidation: Liquidation;
    workLogs: (WorkLog & { assignmentName?: string; })[];
    adjustments: (ManualAdjustment & { categoryName?: string; notes?: string; })[];
    provider: Provider;
}

function PrintPageLoader() {
    const params = useParams();
    const id = params.id as string;
    const [data, setData] = useState<PrintPageData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!id) {
            setError("ID de liquidación no proporcionado.");
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const liquidation = await getLiquidationById(id);
                if (!liquidation) throw new Error("Liquidación no encontrada.");

                const [workLogs, adjustments, provider] = await Promise.all([
                    getWorkLogsByLiquidationId(id),
                    getManualAdjustmentsByLiquidationId(id),
                    getProviderById(liquidation.providerId),
                ]);

                if (!provider) throw new Error("Proveedor no encontrado.");

                setData({ 
                    liquidation, 
                    workLogs: workLogs as (WorkLog & { assignmentName?: string; })[], 
                    adjustments: adjustments as (ManualAdjustment & { categoryName?: string; notes?: string; })[], 
                    provider 
                });
            } catch (err: any) {
                setError(err.message || 'Error al cargar los datos de la liquidación.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen text-center"><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Cargando comprobante...</div>;
    }

    if (error) {
        return <div className="p-8 text-red-500 text-center">{error}</div>;
    }

    if (!data) {
        return <div className="p-8 text-center">No se encontraron datos para esta liquidación.</div>;
    }

    return <PrintPageComponent data={data} />;
}

function PrintPageComponent({ data }: { data: PrintPageData }) {
    const { liquidation, workLogs, adjustments, provider } = data;

    useEffect(() => {
        // Automatically trigger the print dialog when the component mounts
        // A small timeout can help ensure all content is rendered before printing
        const timer = setTimeout(() => {
            window.print();
        }, 500); 
        
        return () => clearTimeout(timer);
    }, []);

    const totalWorkLogs = workLogs.reduce((sum, log) => sum + log.calculatedCost, 0);
    const totalAdjustments = adjustments.reduce((sum, adj) => sum + adj.amount, 0);

    return (
        <div className="bg-white text-black p-4 sm:p-8 md:p-12 print:p-0 print:m-0">
            <div className="max-w-4xl mx-auto bg-white p-8 print:p-0 print:shadow-none print:border-none">
                <header className="flex justify-between items-center pb-8 border-b print:pb-4">
                    <div>
                        <Image src={LogoCont} alt="Logo" width={225} height={60} placeholder="blur" />
                    </div>
                </header>

                <main className="mt-8 print:mt-4">
                    <h1 className="text-2xl font-bold text-center mb-4">Comprobante de Liquidación</h1>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Para:</p>
                            <p className="text-xl font-bold text-primary">{provider.name}</p>
                            {provider.email && <p className="text-sm text-muted-foreground">{provider.email}</p>}
                        </div>
                        <div className="space-y-1 text-right text-sm">
                             <p><span className="font-semibold">Fecha Liquidación:</span> {formatDate(liquidation.dateGenerated)}</p>
                             <p><span className="font-semibold">ID Liquidación:</span> {liquidation.id}</p>
                        </div>
                    </div>

                    {workLogs.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold border-b pb-2 mb-2">Detalle de Actividades</h2>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Descripción</TableHead>
                                        <TableHead className="text-right">Cantidad</TableHead>
                                        <TableHead className="text-right">Tarifa</TableHead>
                                        <TableHead className="text-right">Subtotal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {workLogs.map(log => (
                                        <TableRow key={log.id}>
                                            <TableCell>{formatDate(log.date)}</TableCell>
                                            <TableCell>{log.description}</TableCell>
                                            <TableCell className="text-right">{log.quantity} {log.activityType === 'hourly' ? 'hs' : ''}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(log.rateApplied, log.costCurrency)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(log.calculatedCost, log.costCurrency)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-right font-bold">Total Actividades</TableCell>
                                        <TableCell className="text-right font-bold">{formatCurrency(totalWorkLogs, liquidation.currency)}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                    )}

                    {adjustments.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold border-b pb-2 mb-2">Detalle de Ajustes</h2>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Categoría / Asignación</TableHead>
                                        <TableHead className="text-right">Monto</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {adjustments.map(adj => (
                                        <TableRow key={adj.id}>
                                            <TableCell className="align-top">{formatDate(adj.date)}</TableCell>
                                            <TableCell>
                                                <p className="font-medium">{adj.categoryName || 'Ajuste'}</p>
                                                {adj.assignmentName && <p className="text-xs text-muted-foreground italic">({adj.assignmentName})</p>}
                                                {adj.notes && <p className="text-sm mt-1">{adj.notes}</p>}
                                            </TableCell>
                                            <TableCell className={`text-right align-top ${adj.amount < 0 ? 'text-red-600' : ''}`}>{formatCurrency(adj.amount, adj.currency)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                 <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-right font-bold">Total Ajustes</TableCell>
                                        <TableCell className="text-right font-bold">{formatCurrency(totalAdjustments, liquidation.currency)}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                    )}
                </main>

                <footer className="mt-12 pt-4 border-t-2 border-black text-right print:mt-8 print:break-inside-avoid">
                    <p className="text-sm">Total Actividades: {formatCurrency(totalWorkLogs, liquidation.currency)}</p>
                    <p className="text-sm">Total Ajustes: {formatCurrency(totalAdjustments, liquidation.currency)}</p>
                    <p className="text-2xl font-bold mt-2">TOTAL A PAGAR: {formatCurrency(liquidation.totalAmount, liquidation.currency)}</p>
                </footer>
            </div>
        </div>
    );
}


export default function LiquidationPrintPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Cargando...</div>}>
            <PrintPageLoader />
        </Suspense>
    );
}
