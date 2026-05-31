
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, notFound } from 'next/navigation';
import { OwnerLiquidation, Property, Payment, Expense, BrandingSettings } from '@/lib/data';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from 'next/image';
import { Loader2, FileDown, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseDateSafely } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/lib/app-config';
import { useTranslation } from '@/i18n/useTranslation';

const formatCurrency = (amount: number, currency: string) => {
    try {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
    } catch(e) {
        return `${currency} ${amount.toFixed(2)}`;
    }
};

function LiquidationViewLoader() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    if (!id) return <div className="p-8 text-red-500 text-center">ID de rendición no proporcionado.</div>;
    return <LiquidationView id={id} />;
}

export default function LiquidationViewPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Cargando...</div>}>
            <LiquidationViewLoader />
        </Suspense>
    );
}

function LiquidationView({ id }: { id: string }) {
    const { t } = useTranslation();
    const [data, setData] = useState<{ liquidation: OwnerLiquidation, property: Property, payments: Payment[], expenses: Expense[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [branding, setBranding] = useState<BrandingSettings | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const liqDoc = await getDoc(doc(db, 'owner_liquidations', id));
                if (!liqDoc.exists()) {
                    setError("No se encontró la rendición solicitada.");
                    setIsLoading(false);
                    return;
                }
                const liquidation = { id: liqDoc.id, ...liqDoc.data() } as OwnerLiquidation;
                const orgId = liquidation.orgId || 'global';
                
                // Suscribirse al branding de esta organización específica
                onSnapshot(doc(db, 'settings', `branding_${orgId}`), (snap) => {
                    if (snap.exists()) setBranding(snap.data() as BrandingSettings);
                });

                const propDoc = await getDoc(doc(db, 'properties', liquidation.propertyId));
                if (!propDoc.exists()) throw new Error("Propiedad no encontrada.");
                const property = { id: propDoc.id, ...propDoc.data() } as Property;
                const [pSnaps, eSnaps] = await Promise.all([
                    getDocs(query(collection(db, 'payments'), where('ownerLiquidationId', '==', id))),
                    getDocs(query(collection(db, 'expenses'), where('ownerLiquidationId', '==', id)))
                ]);
                setData({ 
                    liquidation, property,
                    payments: pSnaps.docs.map(d => ({ id: d.id, ...d.data() } as Payment)),
                    expenses: eSnaps.docs.map(d => ({ id: d.id, ...d.data() } as Expense))
                });
            } catch (err: any) {
                console.error(err); setError("Error al cargar los datos.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (isLoading) return <div className="flex h-screen items-center justify-center flex-col gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Generando vista de rendición...</p>
    </div>;

    if (error || !data) return <div className="p-8 text-center space-y-4">
        <p className="text-red-500 font-semibold">{error || "No se pudo cargar la rendición."}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Reintentar</Button>
    </div>;

    const { liquidation, property, payments, expenses } = data;
    const logoSrc = branding?.logoDocUrl || APP_CONFIG.logo.contract;
    const mainLogoSrc = branding?.logoMainUrl || APP_CONFIG.logo.main;
    const appName = branding?.appName || APP_CONFIG.name;
    const appSlogan = branding?.appSlogan || APP_CONFIG.slogan;

    return (
        <div className="min-h-screen bg-zinc-50 py-4 sm:py-12 print:bg-white print:py-0">
            <div className="max-w-4xl mx-auto space-y-6 px-4 print:px-0">
                <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border print:hidden">
                    <p className="text-sm font-medium text-muted-foreground">Rendición para {property.name}</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> {t('owner_portal.labels.print_pdf') || 'Imprimir'}</Button>
                        <Button size="sm" onClick={() => window.print()}><FileDown className="mr-2 h-4 w-4" /> {t('owner_portal.labels.recibo_pdf') || 'Descargar'}</Button>
                    </div>
                </div>
                <div className="bg-white p-6 sm:p-12 rounded-xl shadow-lg border print:shadow-none print:border-none print:rounded-none">
                    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b">
                        <div className="relative w-[200px] h-[54px]">
                            <Image 
                              src={logoSrc} 
                              alt="Logo" 
                              fill 
                              className="object-contain" 
                              priority 
                              data-ai-hint="corporate identity"
                            />
                        </div>
                        <div className="text-left sm:text-right space-y-1">
                            <h1 className="text-xl font-black uppercase tracking-tight text-primary">{t('owner_portal.labels.liq_summary')}</h1>
                            <p className="text-sm text-muted-foreground">ID: {liquidation.id}</p>
                        </div>
                    </header>
                    <main className="mt-8 space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
                            <div className="space-y-4">
                                <div><h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">{t('owner_portal.sections.property_info')}</h4><p className="text-base font-bold text-primary">{property.name}</p><p className="text-muted-foreground">{property.address}</p></div>
                                <div><h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">{t('common.placeholders_labels.owner_name')}</h4><p className="font-semibold text-base">{property.ownerName || '-'}</p></div>
                            </div>
                            <div className="text-left sm:text-right space-y-4">
                                <div><h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">{t('owner_portal.labels.date')}</h4><p className="font-semibold">{format(parseDateSafely(liquidation.dateGenerated)!, "dd 'de' MMMM, yyyy", { locale: es })}</p></div>
                                <div><h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">{t('owner_portal.labels.period')}</h4><p className="font-semibold">{format(parseDateSafely(liquidation.periodFrom)!, 'dd/MM/yyyy')} - {format(parseDateSafely(liquidation.periodTo)!, 'dd/MM/yyyy')}</p></div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold border-b pb-1 text-primary">{t('owner_portal.labels.received_income')}</h3>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-zinc-50"><TableRow><TableHead>{t('owner_portal.labels.date')}</TableHead><TableHead>{t('common.description')}</TableHead><TableHead className="text-right">{t('bookings.table.amount')}</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {payments.map(p => (
                                            <TableRow key={p.id}><TableCell>{format(parseDateSafely(p.date)!, 'dd/MM/yy')}</TableCell><TableCell className="font-medium">{p.description}</TableCell><TableCell className="text-right font-bold text-green-700">{formatCurrency(p.amount, liquidation.currency)}</TableCell></TableRow>
                                        ))}
                                    </TableBody>
                                    <TableFooter><TableRow className="bg-zinc-50/50"><TableCell colSpan={2} className="text-right font-bold uppercase text-[10px]">{t('owner_portal.labels.total_income')}</TableCell><TableCell className="text-right font-bold text-lg">{formatCurrency(liquidation.totalIncome, liquidation.currency)}</TableCell></TableRow></TableFooter>
                                </Table>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold border-b pb-1 text-primary">{t('owner_portal.labels.expenses')}</h3>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-zinc-50"><TableRow><TableHead>{t('owner_portal.labels.date')}</TableHead><TableHead>{t('common.description')}</TableHead><TableHead className="text-right">{t('bookings.table.amount')}</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {expenses.map(e => (
                                            <TableRow key={e.id}><TableCell>{format(parseDateSafely(e.date)!, 'dd/MM/yy')}</TableCell><TableCell className="font-medium">{e.description}</TableCell><TableCell className="text-right font-medium text-red-600">-{formatCurrency(e.originalUsdAmount || e.amount, liquidation.currency)}</TableCell></TableRow>
                                        ))}
                                        <TableRow className="bg-orange-50/30"><TableCell>{format(parseDateSafely(liquidation.dateGenerated)!, 'dd/MM/yy')}</TableCell><TableCell className="font-medium italic">{t('owner_portal.labels.commission')} ({liquidation.commissionPercentage}%)</TableCell><TableCell className="text-right font-bold text-orange-700">-{formatCurrency(liquidation.commissionAmount, liquidation.currency)}</TableCell></TableRow>
                                    </TableBody>
                                    <TableFooter><TableRow className="bg-zinc-50/50"><TableCell colSpan={2} className="text-right font-bold uppercase text-[10px]">{t('owner_portal.labels.total_deductions')}</TableCell><TableCell className="text-right font-bold text-red-600">-{formatCurrency(liquidation.totalExpenses + liquidation.commissionAmount, liquidation.currency)}</TableCell></TableRow></TableFooter>
                                </Table>
                            </div>
                        </div>
                        {liquidation.notes && <div className="p-4 bg-zinc-50 rounded-lg border border-dashed"><h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">{t('owner_liquidations.add_dialog.notes')}</h4><p className="text-sm whitespace-pre-wrap">{liquidation.notes}</p></div>}
                    </main>
                    <footer className="mt-12 pt-8 border-t-2 border-primary">
                        <div className="flex flex-col sm:flex-row justify-between items-end gap-6">
                            <div className="text-[10px] text-muted-foreground italic text-center sm:text-left order-2 sm:order-1">
                                {t('owner_portal.messages.auto_generated').replace('{{name}}', appName)}
                            </div>
                            <div className="text-right space-y-2 order-1 sm:order-2 w-full sm:w-auto">
                                <p className="text-sm uppercase font-black text-muted-foreground tracking-widest">{t('owner_portal.labels.net_transfer')}</p>
                                <p className="text-4xl sm:text-5xl font-black text-primary tracking-tighter">{formatCurrency(liquidation.netToOwner, liquidation.currency)}</p>
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
        </div>
    );
}
