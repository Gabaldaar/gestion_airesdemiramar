'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, Suspense, useCallback } from 'react';
import { 
    Liquidation, 
    Provider, 
    WorkLogWithDetails,
    ManualAdjustmentWithDetails,
    BrandingSettings
} from '@/lib/data';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseDateSafely } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { APP_CONFIG } from '@/lib/app-config';
import { useTranslation } from '@/i18n/useTranslation';

const formatDate = (dateString: string) => {
    const date = parseDateSafely(dateString);
    if (!date) return 'Fecha Inválida';
    return format(date, "dd 'de' LLLL 'de' yyyy", { locale: es });
};

const formatCurrency = (amount: number, currency: string) => {
    try {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
    } catch(e) {
        return `${currency} ${amount.toFixed(2)}`;
    }
};

interface PrintPageData {
    liquidation: Liquidation;
    workLogs: WorkLogWithDetails[];
    adjustments: ManualAdjustmentWithDetails[];
    provider: Provider;
    branding: BrandingSettings | null;
}

function PrintPageLoader() {
    const params = useParams();
    const id = params.id as string;
    const [data, setData] = useState<PrintPageData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!id) {
            setError("ID de liquidación no proporcionado.");
            setIsLoading(false);
            return;
        }

        try {
            const liqDoc = await getDoc(doc(db, 'liquidations', id));
            if (!liqDoc.exists()) throw new Error("Liquidación no encontrada.");
            const liquidation = { id: liqDoc.id, ...liqDoc.data() } as Liquidation;
            const orgId = liquidation.orgId || 'global';

            const [provDoc, logsSnap, adjsSnap, propsSnap, scopesSnap, adjCatsSnap, brandingSnap] = await Promise.all([
                getDoc(doc(db, 'providers', liquidation.providerId)),
                getDocs(query(collection(db, 'workLogs'), where('liquidationId', '==', id))),
                getDocs(query(collection(db, 'manualAdjustments'), where('liquidationId', '==', id))),
                getDocs(collection(db, 'properties')),
                getDocs(collection(db, 'task_scopes')),
                getDocs(collection(db, 'adjustment_categories')),
                getDoc(doc(db, 'settings', `branding_${orgId}`))
            ]);

            if (!provDoc.exists()) throw new Error("Proveedor no encontrado.");
            const provider = { id: provDoc.id, ...provDoc.data() } as Provider;

            const propsMap = new Map(propsSnap.docs.map(d => [d.id, (d.data() as any).name]));
            const scopesMap = new Map(scopesSnap.docs.map(d => [d.id, (d.data() as any).name]));
            const adjCatsMap = new Map(adjCatsSnap.docs.map(d => [d.id, (d.data() as any).name]));

            const workLogs = logsSnap.docs.map(d => {
                const log = { id: d.id, ...d.data() } as any;
                return {
                    ...log,
                    assignmentName: log.assignment?.type === 'property' ? propsMap.get(log.assignment.id) : scopesMap.get(log.assignment.id)
                };
            });

            const adjustments = adjsSnap.docs.map(d => {
                const adj = { id: d.id, ...d.data() } as any;
                return {
                    ...adj,
                    categoryName: adjCatsMap.get(adj.categoryId),
                    assignmentName: adj.assignment?.type === 'property' ? propsMap.get(adj.assignment.id) : scopesMap.get(adj.assignment.id)
                };
            });

            setData({ 
                liquidation, 
                workLogs, 
                adjustments, 
                provider, 
                branding: brandingSnap.exists() ? brandingSnap.data() as BrandingSettings : null 
            });
        } catch (err: any) {
            setError(err.message || 'Error al cargar los datos de la liquidación.');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen text-center"><Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" /> Cargando comprobante...</div>;
    }

    if (error) {
        return <div className="p-8 text-red-500 text-center">{error}</div>;
    }

    if (!data) return null;

    return <PrintPageComponent data={data} />;
}

function PrintPageComponent({ data }: { data: PrintPageData }) {
    const { liquidation, workLogs, adjustments, provider, branding } = data;
    const { t } = useTranslation();
    const logoSrc = branding?.logoDocUrl || branding?.logoMainUrl || APP_CONFIG.logo.contract;

    useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 800); 
        return () => clearTimeout(timer);
    }, []);

    const totalWorkLogs = workLogs.reduce((sum, log) => sum + log.calculatedCost, 0);
    const totalAdjustments = adjustments.reduce((sum, adj) => sum + adj.amount, 0);
    
    const appName = branding?.appName || APP_CONFIG.name;
    const appSlogan = branding?.appSlogan || APP_CONFIG.slogan;
    const mainLogoSrc = branding?.logoMainUrl || APP_CONFIG.logo.main;

    return (
        <div className="bg-white text-black p-4 sm:p-8 md:p-12 print:p-0 print:m-0">
            <div className="max-w-4xl mx-auto bg-white p-8 print:p-0 print:shadow-none print:border-none">
                <header className="flex justify-between items-center pb-8 border-b print:pb-4">
                    <div className="relative w-[225px] h-[60px]">
                        <Image 
                          src={logoSrc} 
                          alt="Logo" 
                          fill 
                          className="object-contain"
                          data-ai-hint="corporate identity"
                        />
                    </div>
                </header>

                <main className="mt-8 print:mt-4">
                    <h1 className="text-2xl font-bold text-center mb-4">{t('liquidations.details.title')}</h1>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">{t('common.to')}:</p>
                            <p className="text-xl font-bold text-primary">{provider.name}</p>
                            {provider.email && <p className="text-sm text-muted-foreground">{provider.email}</p>}
                        </div>
                        <div className="space-y-1 text-right text-sm">
                             <p><span className="font-semibold">{t('liquidations.history.table.date')}:</span> {formatDate(liquidation.dateGenerated)}</p>
                             <p><span className="font-semibold">ID Liquidación:</span> {liquidation.id}</p>
                        </div>
                    </div>

                    {workLogs.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold border-b pb-2 mb-2">{t('liquidations.details.income')}</h2>
                            <Table>
                                <TableHeader><TableRow><TableHead>{t('common.date')}</TableHead><TableHead>{t('common.description')}</TableHead><TableHead className="text-right">Cant.</TableHead><TableHead className="text-right">Tarifa</TableHead><TableHead className="text-right">Subtotal</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {workLogs.map(log => (
                                        <TableRow key={log.id}><TableCell>{formatDate(log.date)}</TableCell><TableCell className="text-xs">{log.description}</TableCell><TableCell className="text-right text-xs">{log.quantity} {log.activityType === 'hourly' ? 'hs' : ''}</TableCell><TableCell className="text-right text-xs">{formatCurrency(log.rateApplied, log.costCurrency)}</TableCell><TableCell className="text-right font-medium">{formatCurrency(log.calculatedCost, log.costCurrency)}</TableCell></TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter><TableRow><TableCell colSpan={4} className="text-right font-bold">{t('liquidations.summary.subtotal_items')}</TableCell><TableCell className="text-right font-bold">{formatCurrency(totalWorkLogs, liquidation.currency)}</TableCell></TableRow></TableFooter>
                            </Table>
                        </div>
                    )}

                    {adjustments.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold border-b pb-2 mb-2">{t('liquidations.details.expenses')}</h2>
                             <Table>
                                <TableHeader><TableRow><TableHead>{t('common.date')}</TableHead><TableHead>{t('liquidations.pending_items.manual_adjustments')}</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {adjustments.map(adj => (
                                        <TableRow key={adj.id}>
                                            <TableCell className="align-top text-xs">{formatDate(adj.date)}</TableCell>
                                            <TableCell><p className="font-medium text-xs">{adj.categoryName || 'Ajuste'}</p>{adj.assignmentName && <p className="text-[10px] text-muted-foreground italic">({adj.assignmentName})</p>}{adj.notes && <p className="text-[10px] mt-1">{adj.notes}</p>}</TableCell>
                                            <TableCell className={`text-right align-top font-medium ${adj.amount < 0 ? 'text-red-600' : ''}`}>{formatCurrency(adj.amount, adj.currency)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                 <TableFooter><TableRow><TableCell colSpan={2} className="text-right font-bold">Total Ajustes</TableCell><TableCell className="text-right font-bold">{formatCurrency(totalAdjustments, liquidation.currency)}</TableCell></TableRow></TableFooter>
                            </Table>
                        </div>
                    )}
                </main>
                <footer className="mt-12 pt-4 border-t-2 border-black text-right print:mt-8 print:break-inside-avoid">
                    <p className="text-2xl font-bold mt-2 uppercase">{t('liquidations.details.total').toUpperCase()}: {formatCurrency(liquidation.totalAmount, liquidation.currency)}</p>
                    
                    {/* Pie de página de marca para impresión */}
                    <div className="mt-20 pt-8 border-t flex flex-col items-center gap-2 opacity-50">
                        <div className="relative w-32 h-8 grayscale opacity-70">
                            <Image src={mainLogoSrc} alt={appName} fill className="object-contain" />
                        </div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">
                            Gestionado con {appName} — {appSlogan}
                        </p>
                    </div>
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
