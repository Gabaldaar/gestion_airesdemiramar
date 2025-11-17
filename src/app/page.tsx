
'use client';

import { getFinancialSummaryByProperty, getProperties, getTenants, getBookings, BookingWithDetails, Property, Tenant, FinancialSummaryByCurrency, getAlertSettings, AlertSettings } from "@/lib/data";
import DashboardStats from "@/components/dashboard-stats";
import DashboardRecentBookings from "@/components/dashboard-recent-bookings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardCurrentBookings from "@/components/dashboard-current-bookings";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/components/auth-provider";
import { differenceInDays, startOfToday } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
import AvailabilitySearcher from "@/components/availability-searcher";

interface DashboardData {
    summaryByCurrency: FinancialSummaryByCurrency;
    properties: Property[];
    tenants: Tenant[];
    bookings: BookingWithDetails[];
    alertSettings: AlertSettings | null;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const fetchData = async () => {
                setLoading(true);
                const [summaryByCurrency, properties, tenants, bookings, alertSettings] = await Promise.all([
                    getFinancialSummaryByProperty({}),
                    getProperties(),
                    getTenants(),
                    getBookings(),
                    getAlertSettings(),
                ]);
                setData({ summaryByCurrency, properties, tenants, bookings, alertSettings });
                setLoading(false);
            };
            fetchData();
        }
    }, [user]);

    const upcomingCheckIns = useMemo(() => {
        if (!data) return [];
        const today = startOfToday();
        const checkInDays = data.alertSettings?.checkInDays ?? 7;
        return data.bookings.filter(b => {
            const isActive = !b.status || b.status === 'active';
            if (!isActive) return false;
            const checkInDate = new Date(b.startDate);
            const daysUntil = differenceInDays(checkInDate, today);
            return daysUntil >= 0 && daysUntil <= checkInDays;
        }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }, [data]);

    const upcomingCheckOuts = useMemo(() => {
        if (!data) return [];
        const today = startOfToday();
        const checkOutDays = data.alertSettings?.checkOutDays ?? 3;
        return data.bookings.filter(b => {
            const isActive = !b.status || b.status === 'active';
            if (!isActive) return false;
            const checkOutDate = new Date(b.endDate);
            const daysUntil = differenceInDays(checkOutDate, today);
            return daysUntil >= 0 && daysUntil <= checkOutDays;
        }).sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    }, [data]);


    if (loading || !data) {
        return <p>Cargando dashboard...</p>;
    }

    const { summaryByCurrency, properties, tenants, bookings } = data;

    const totalIncomeArs = summaryByCurrency.ars.reduce((acc, item) => acc + item.totalIncome, 0);
    const totalNetResultArs = summaryByCurrency.ars.reduce((acc, item) => acc + item.netResult, 0);
    const totalIncomeUsd = summaryByCurrency.usd.reduce((acc, item) => acc + item.totalIncome, 0);
    const totalNetResultUsd = summaryByCurrency.usd.reduce((acc, item) => acc + item.netResult, 0);

    const totalProperties = properties.length;
    const totalTenants = tenants.length;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const upcomingBookings = bookings
        .filter(b => {
            const isActive = !b.status || b.status === 'active';
            return new Date(b.startDate) >= today && isActive;
        })
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, 5);

    const currentBookings = bookings
        .filter(b => {
            const startDate = new Date(b.startDate);
            const endDate = new Date(b.endDate);
            const isActive = !b.status || b.status === 'active';
            return today >= startDate && today <= endDate && isActive;
        })
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());


    return (
        <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between space-y-2">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h2>
                <p className="text-muted-foreground">Un resumen de tu negocio de alquileres.</p>
            </div>
        </div>

        {upcomingCheckIns.length > 0 && (
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>¡Atención! Próximos Check-ins</AlertTitle>
                <AlertDescription>
                    Tienes {upcomingCheckIns.length} check-in(s) en los próximos {data.alertSettings?.checkInDays ?? 7} días.
                    <ul className="list-disc pl-5 mt-2">
                    {upcomingCheckIns.map(b => (
                        <li key={b.id}>{b.property?.name}: <strong>{b.tenant?.name}</strong> llega el <strong>{new Date(b.startDate).toLocaleDateString('es-AR')}</strong>.</li>
                    ))}
                    </ul>
                </AlertDescription>
            </Alert>
        )}
        
        {upcomingCheckOuts.length > 0 && (
            <Alert variant="default" className="border-blue-500 text-blue-800 dark:border-blue-400 dark:text-blue-300 [&>svg]:text-blue-500">
                <Info className="h-4 w-4" />
                <AlertTitle className="text-blue-800 dark:text-blue-300">Aviso: Próximos Check-outs</AlertTitle>
                <AlertDescription>
                    Tienes {upcomingCheckOuts.length} check-out(s) en los próximos {data.alertSettings?.checkOutDays ?? 3} días.
                     <ul className="list-disc pl-5 mt-2">
                    {upcomingCheckOuts.map(b => (
                        <li key={b.id}>{b.property?.name}: <strong>{b.tenant?.name}</strong> se retira el <strong>{new Date(b.endDate).toLocaleDateString('es-AR')}</strong>.</li>
                    ))}
                    </ul>
                </AlertDescription>
            </Alert>
        )}


        <DashboardStats
            totalIncomeArs={totalIncomeArs}
            totalNetResultArs={totalNetResultArs}
            totalIncomeUsd={totalIncomeUsd}
            totalNetResultUsd={totalNetResultUsd}
            totalProperties={totalProperties}
            totalTenants={totalTenants}
        />
        
        <AvailabilitySearcher allProperties={properties} allBookings={bookings} />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-1 lg:col-span-4">
            <CardHeader>
                <CardTitle>Reservas en Curso</CardTitle>
                <CardDescription>
                Reservas activas en este momento.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <DashboardCurrentBookings bookings={currentBookings} />
            </CardContent>
            </Card>
            <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
                <CardTitle>Próximas Reservas</CardTitle>
                <CardDescription>
                Las próximas 5 reservas agendadas.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <DashboardRecentBookings bookings={upcomingBookings} />
            </CardContent>
            </Card>
        </div>
        </div>
    );
}

    
