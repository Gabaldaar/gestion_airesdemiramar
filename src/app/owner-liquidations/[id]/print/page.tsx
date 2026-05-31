'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, Suspense, useCallback } from 'react';
import { 
    OwnerLiquidation,
    Property,
    Payment,
    Expense,
    BrandingSettings
} from '@/lib/data';
import Image from 'next/image';
import { Loader2, Printer, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseDateSafely } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { APP_CONFIG } from '@/lib/app-config';
import { useTranslation } from '@/i18n/useTranslation';

const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
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
    liquidation: OwnerLiquidation;
    property: Property;
    payments: Payment[];
    expenses: Expense[];
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
            const liqDoc = await getDoc(doc(db, 'owner_liquidations', id));
            if (!liqDoc.exists()) throw new Error("Rendición no encontrada.");
            const liquidation = { id: liqDoc.id, ...liqDoc.data() } as OwnerLiquidation;
            const orgId = liquidation.orgId || 'global';

            const [propDoc, brandingSnap] = await Promise.all([
                getDoc(doc(db, 'properties', liquidation.propertyId)),
                getDoc(doc(db, 'settings', `branding_${orgId}`))
            ]);

            if (!propDoc.exists()) throw new Error("Propiedad no encontrada.");
            const property = { id: propDoc.id, ...propDoc.data() } as Property;

            const [pSnaps, eSnaps] = await Promise.all([
                getDocs(query(collection(db, 'payments'), where('ownerLiquidationId', '==', id))),
                getDocs(query(collection(db, 'expenses'), where('ownerLiquidationId', '==', id)))
            ]);

            setData({ 
                liquidation, 
                property,
                payments: pSnaps.docs.map(d => ({ id: d.id, ...d.data() } as Payment)),
                expenses: eSnaps.docs.map(d => ({ id: d.id, ...d.data() } as Expense)),
                branding: brandingSnap.exists() ? brandingSnap.data() as BrandingSettings : null
            });
        } catch (err: any) {
            setError(err.message || 'Error al cargar los datos.');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen text-center"><Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" /> Cargando rendición...</div>;
    }

    if (error) {
        return <div className="p-8 text-red-500 text-center">{error}</div>;
    }

    if (!data) return null;

    return <PrintPageComponent data={data} />;
}

function PrintPageComponent({ data }: { data: PrintPageData }) {
    const { liquidation, property, payments, expenses, branding } = data;
    const { t } = useTranslation();

    useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 800); 
        return () => clearTimeout(timer);
    }, []);

    const appName = branding?.appName || APP_CONFIG.name;
    const appSlogan = branding?.appSlogan || APP_CONFIG.slogan;
    const logoSrc = branding?.logoDocUrl || branding?.logoMainUrl || APP_CONFIG.logo.contract;
    const mainLogoSrc = branding?.logoMainUrl || APP_CONFIG.logo.main;

    return (
        <div className="bg-white text-black p-4 sm:p-8 md:p-12 print:p-0 print:m-0">
            <div className="max-w-4xl mx-auto bg-white p-8 print:p-0">
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
                    <div className="text-right space-y-1">
                        <h1 className="text-xl font-bold uppercase tracking-tight">{t('owner_portal.labels.liq_summary')}</h1>
                        <p className="text-sm text-muted-foreground">ID: {liquidation.id}</p>
                    </div>
                </header>

                <main className="mt-8 space-y-8">
                    <div className="grid grid-cols-2 gap-8 text-sm">
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">{t('owner_portal.sections.property_info')}</h4>
                                <p className="text-base font-bold text-primary">{property.name}</p>
                                <p className="text-muted-foreground">{property.address}</p>
                            </div>
                            <div>
                                <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">{t('common.placeholders_labels.owner_name')}</h4>
                                <p className="font-semibold">{property.ownerName || '-'}</p>
                                {property.ownerDni && <p>ID: {property.ownerDni}</p>}
                                {property.ownerEmail && <p>{property.ownerEmail}</p>}
                            </div>
                        </div>
                        <div className="text-right space-y-4">
                            <div>
                                <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">{t('owner_portal.labels.date')}</h4>
                                <p className="font-semibold">{formatDate(liquidation.dateGenerated)}</p>
                            </div>
                            <div>
                                <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">{t('owner_portal.labels.period')}</h4>
                                <p className="font-semibold">
                                    {format(parseDateSafely(liquidation.periodFrom)!, 'dd/MM/yyyy')} - {format(parseDateSafely(liquidation.periodTo)!, 'dd/MM/yyyy')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-bold border-b pb-1">{t('owner_portal.labels.received_income')}</h3>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-zinc-50">
                                    <TableHead className="w-[100px]">{t('owner_portal.labels.date')}</TableHead>
                                    <TableHead>{t('common.description')}</TableHead>
                                    <TableHead className="text-right">{t('bookings.table.amount')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell>{format(parseDateSafely(p.date)!, 'dd/MM/yy')}</TableCell>
                                        <TableCell>{p.description}</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(p.amount, liquidation.currency)}</TableCell>
                                    </TableRow>
                                ))}
                                {payments.length === 0 && (
                                    <TableRow><TableCell colSpan={3} className="text-center italic text-muted-foreground">Sin ingresos en el período.</TableCell></TableRow>
                                )}
                            </TableBody>
                            <TableFooter>
                                <TableRow className="bg-zinc-50/50">
                                    <TableCell colSpan={2} className="text-right font-bold uppercase text-[10px]">{t('owner_portal.labels.total_income')}</TableCell>
                                    <TableCell className="text-right font-bold">{formatCurrency(liquidation.totalIncome, liquidation.currency)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-bold border-b pb-1">{t('owner_portal.labels.expenses')}</h3>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-zinc-50">
                                    <TableHead className="w-[100px]">{t('owner_portal.labels.date')}</TableHead>
                                    <TableHead>{t('common.description')}</TableHead>
                                    <TableHead className="text-right">{t('bookings.table.amount')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenses.map(e => (
                                    <TableRow key={e.id}>
                                        <TableCell>{format(parseDateSafely(e.date)!, 'dd/MM/yy')}</TableCell>
                                        <TableCell>{e.description}</TableCell>
                                        <TableCell className="text-right font-medium text-red-600">-{formatCurrency(e.originalUsdAmount || e.amount, liquidation.currency)}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="bg-orange-50/30">
                                    <TableCell>{format(parseDateSafely(liquidation.dateGenerated)!, 'dd/MM/yy')}</TableCell>
                                    <TableCell className="font-medium italic">{t('owner_portal.labels.commission')} ({liquidation.commissionPercentage}%)</TableCell>
                                    <TableCell className="text-right font-bold text-orange-700">-{formatCurrency(liquidation.commissionAmount, liquidation.currency)}</TableCell>
                                </TableRow>
                            </TableBody>
                            <TableFooter>
                                <TableRow className="bg-zinc-50/50">
                                    <TableCell colSpan={2} className="text-right font-bold uppercase text-[10px]">{t('owner_portal.labels.total_deductions')}</TableCell>
                                    <TableCell className="text-right font-bold">-{formatCurrency(liquidation.totalExpenses + liquidation.commissionAmount, liquidation.currency)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>

                    {liquidation.notes && (
                        <div className="p-4 bg-zinc-50 rounded-lg border">
                            <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">{t('owner_liquidations.add_dialog.notes')}</h4>
                            <p className="text-sm whitespace-pre-wrap">{liquidation.notes}</p>
                        </div>
                    )}
                </main>

                <footer className="mt-12 pt-6 border-t-2 border-primary">
                    <div className="flex justify-between items-end">
                        <div className="text-xs text-muted-foreground italic">
                             {t('owner_portal.messages.auto_generated').replace('{{name}}', appName)}
                        </div>
                        <div className="text-right space-y-2">
                            <p className="text-sm uppercase font-bold text-muted-foreground">{t('owner_portal.labels.net_transfer')}</p>
                            <p className="text-4xl font-black text-primary tracking-tighter">
                                {formatCurrency(liquidation.netToOwner, liquidation.currency)}
                            </p>
                        </div>
                    </div>

                    {/* Pie de página de marca para impresión */}
                    <div className="mt-16 pt-8 border-t flex flex-col items-center gap-2 opacity-50">
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

export default function OwnerLiquidationPrintPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Cargando...</div>}>
            <PrintPageLoader />
        </Suspense>
    );
}
