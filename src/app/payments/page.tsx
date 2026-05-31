'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { PaymentWithDetails, Property, Booking, Tenant, Contrato, Payment, getPayments, getProperties, getBookings, getTenants, getContratos } from "@/lib/data";
import PaymentsClient from "@/components/payments-client";
import { useAuth } from "@/components/auth-provider";
import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";

interface PaymentsData {
    allPayments: PaymentWithDetails[];
    properties: Property[];
}

export default function PaymentsPage() {
    const { user, orgId } = useAuth();
    const { t } = useTranslation();
    const [data, setData] = useState<PaymentsData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!user || !orgId) return;
        setLoading(true);
        try {
            const [payRaw, properties, bookings, tenants, contratos] = await Promise.all([
                getPayments(orgId),
                getProperties(orgId),
                getBookings(orgId),
                getTenants(orgId),
                getContratos(orgId),
            ]);

            const propsMap = new Map(properties.map(p => [p.id, p]));
            const bookingsMap = new Map(bookings.map(b => [b.id, b]));
            const contratosMap = new Map(contratos.map(c => [c.id, c]));
            const tenantsMap = new Map(tenants.map(t => [t.id, t]));

            const allPayments: PaymentWithDetails[] = payRaw.map(p => {
                let sourceCurrency = p.currency;
                let propertyId = p.propertyId;
                let tenantId = (p as any).tenantId;

                if (p.bookingId) {
                    const b = bookingsMap.get(p.bookingId);
                    if (b) {
                        sourceCurrency = b.currency;
                        propertyId = b.propertyId;
                        tenantId = b.tenantId;
                    }
                } else if (p.contratoId) {
                    const c = contratosMap.get(p.contratoId);
                    if (c) {
                        sourceCurrency = c.moneda;
                        propertyId = c.propertyId;
                        tenantId = c.tenantId;
                    }
                }

                const prop = propertyId ? propsMap.get(propertyId) : null;
                const ten = tenantId ? tenantsMap.get(tenantId) : null;

                const realReceivedAmount = p.receivedAmount ?? p.originalArsAmount ?? p.amount ?? 0;
                const realReceivedCurrency = (p.receivedCurrency || (p.originalArsAmount ? 'ARS' : (p.currency || 'USD'))) as string;

                return {
                    ...p,
                    propertyId: propertyId || undefined,
                    propertyName: prop?.name,
                    tenantName: ten?.name,
                    sourceCurrency,
                    realReceivedAmount,
                    realReceivedCurrency,
                    amountUSD: sourceCurrency === 'USD' ? (p.amount || 0) : 0,
                    amountARS: sourceCurrency === 'ARS' ? (p.amount || 0) : 0
                };
            }).filter(p => p.orgId === orgId); // Filtro estricto final

            setData({ allPayments, properties });
        } catch (err) {
            console.error("Error fetching payments:", err);
        } finally {
            setLoading(false);
        }
    }, [user, orgId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading && !data) {
        return <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

  if (!data) return null;

  return (
    <div className="flex-1 space-y-4">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-primary">{t('navigation.payments')}</h2>
            <p className="text-muted-foreground">{t('payments_page.description')}</p>
        </div>
        <Card>
            <CardContent className="pt-6">
                <PaymentsClient 
                    initialPayments={data.allPayments} 
                    properties={data.properties} 
                />
            </CardContent>
        </Card>
    </div>
  );
}
