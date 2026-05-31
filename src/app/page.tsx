
'use client';

import { useEffect, useState } from "react";
import { 
    Property, 
    Tenant, 
    BookingWithDetails, 
    AlertSettings, 
    DateBlock,
    Contrato,
    PeriodoPago,
    Booking,
    Payment,
    Provider,
    getProperties,
    getTenants,
    getBookings,
    getAlertSettings,
    getDateBlocks,
    getContratos,
    getPeriodosPago,
    getProviders
} from "@/lib/data";
import DashboardClient from "@/components/dashboard-client";
import { Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useTranslation } from "@/i18n/useTranslation";
import { startOfMonth, endOfMonth, isWithinInterval, startOfToday } from 'date-fns';
import { parseDateSafely } from "@/lib/utils";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface MonthlyBreakdownItem {
    id: string;
    type: 'temporary' | 'annual';
    name: string;
    property: string;
    amount: number;
    currency: string;
    date: string;
}

export default function DashboardPage() {
    const { orgId, loading: authLoading } = useAuth();
    const { t } = useTranslation();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!orgId) {
            setLoading(false);
            return;
        }

        async function fetchAllData() {
            setLoading(true);
            try {
                const [
                    properties,
                    tenants,
                    bookingsRaw,
                    alertSettings,
                    blocks,
                    contratosRaw,
                    periodosPago,
                    paymentsSnap,
                    providers
                ] = await Promise.all([
                    getProperties(orgId!),
                    getTenants(orgId!),
                    getBookings(orgId!),
                    getAlertSettings(orgId!),
                    getDateBlocks(orgId!),
                    getContratos(orgId!),
                    getPeriodosPago(orgId!),
                    getDocs(query(collection(db, 'payments'), where('orgId', '==', orgId!))),
                    getProviders(orgId!)
                ]);

                const paymentsData = paymentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));

                const tenantsMap = new Map<string, Tenant>(tenants.map((t: Tenant) => [t.id, t]));
                const propsMap = new Map<string, Property>(properties.map((p: Property) => [p.id, p]));

                const enrichedBookings: BookingWithDetails[] = bookingsRaw.map((booking: Booking) => ({
                    ...booking,
                    property: propsMap.get(booking.propertyId) || ({ id: booking.propertyId, name: 'Propiedad no encontrada', address: 'N/A' } as Property),
                    tenant: tenantsMap.get(booking.tenantId) || ({ id: booking.tenantId, name: 'Inquilino no encontrado' } as Tenant)
                }));

                const enrichedContratos = contratosRaw.map((c: Contrato) => ({
                    ...c,
                    property: propsMap.get(c.propertyId) || ({ id: c.propertyId, name: 'Propiedad no encontrada', address: 'N/A' } as Property),
                    tenant: tenantsMap.get(c.tenantId) || ({ id: c.tenantId, name: 'Inquilino no encontrado' } as Tenant)
                }));

                const today = startOfToday();
                const startMonth = startOfMonth(today);
                const endMonth = endOfMonth(today);

                const occupiedUnitIds = new Set<string>();
                enrichedBookings.forEach(b => {
                    const s = parseDateSafely(b.startDate);
                    const e = parseDateSafely(b.endDate);
                    if (s && e && today >= s && today <= e && (!b.status || b.status === 'active')) {
                        occupiedUnitIds.add(b.propertyId);
                    }
                });
                enrichedContratos.forEach(c => {
                    const s = parseDateSafely(c.fechaInicio);
                    const e = parseDateSafely(c.fechaFin);
                    if (s && e && today >= s && today <= e && c.status === 'active') {
                        occupiedUnitIds.add(c.propertyId);
                    }
                });

                const monthlyStats: Record<string, { received: number, pending: number, items: MonthlyBreakdownItem[] }> = {
                    'USD': { received: 0, pending: 0, items: [] },
                    'ARS': { received: 0, pending: 0, items: [] }
                };

                paymentsData.forEach(p => {
                    const pDate = parseDateSafely(p.date);
                    if (pDate && isWithinInterval(pDate, { start: startMonth, end: endMonth })) {
                        const cur = (p.currency || 'USD').toUpperCase();
                        if (!monthlyStats[cur]) monthlyStats[cur] = { received: 0, pending: 0, items: [] };
                        monthlyStats[cur].received += (p.amount || 0);
                    }
                });

                enrichedBookings.forEach(b => {
                    if (b.status === 'cancelled') return;
                    const eDate = parseDateSafely(b.endDate);
                    if (eDate && isWithinInterval(eDate, { start: startMonth, end: endMonth })) {
                        const cur = (b.currency || 'USD').toUpperCase();
                        if (!monthlyStats[cur]) monthlyStats[cur] = { received: 0, pending: 0, items: [] };
                        const bal = (b.balance || 0);
                        if (bal > 0.01) {
                            monthlyStats[cur].pending += bal;
                            monthlyStats[cur].items.push({
                                id: b.id,
                                type: 'temporary',
                                name: b.tenant?.name || 'S/D',
                                property: b.property?.name || 'S/D',
                                amount: bal,
                                currency: cur,
                                date: b.endDate
                            });
                        }
                    }
                });

                periodosPago.forEach(p => {
                    const contrato = enrichedContratos.find(c => c.id === p.contratoId);
                    if (!contrato || contrato.status !== 'active') return;

                    const dDate = parseDateSafely(p.fechaVencimiento);
                    if (dDate && isWithinInterval(dDate, { start: startMonth, end: endMonth })) {
                        const cur = (contrato.moneda || 'ARS').toUpperCase();
                        if (!monthlyStats[cur]) monthlyStats[cur] = { received: 0, pending: 0, items: [] };
                        const saldoPeriodo = (p.montoAjustado || 0) - (p.montoPagado || 0);
                        if (saldoPeriodo > 0.01) {
                            monthlyStats[cur].pending += saldoPeriodo;
                            monthlyStats[cur].items.push({
                                id: p.id,
                                type: 'annual',
                                name: contrato.tenant?.name || 'S/D',
                                property: contrato.property?.name || 'S/D',
                                amount: saldoPeriodo,
                                currency: cur,
                                date: p.fechaVencimiento
                            });
                        }
                    }
                });

                setData({
                    properties,
                    tenants,
                    bookings: enrichedBookings,
                    alertSettings,
                    blocks,
                    contratos: enrichedContratos,
                    periodosPago,
                    occupiedPropertiesCount: occupiedUnitIds.size,
                    monthlyStats,
                    pendingLiquidationsCount: 0, 
                    unliquidatedItemsCount: 0, 
                    pendingBookingsCount: enrichedBookings.filter((b: Booking) => b.status === 'pending').length,
                    providers
                });
            } catch (err: any) {
                console.error("Error fetching data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchAllData();
    }, [orgId, authLoading]);

    if (authLoading || loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-4">{t('common.loading')}</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center p-4">
                <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-lg max-w-md text-center">
                    <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-destructive">{t('common.error')}</h2>
                    <p className="text-sm mt-2">{error}</p>
                    <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-primary text-white rounded-md">Reintentar</button>
                </div>
            </div>
        );
    }

    return <DashboardClient initialData={data} />;
}
