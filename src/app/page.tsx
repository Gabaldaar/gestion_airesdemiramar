

'use client';

import { getFinancialSummaryByProperty, getProperties, getTenants, getBookings, BookingWithDetails, Property, Tenant, FinancialSummaryByCurrency, getAlertSettings, AlertSettings } from "@/lib/data";
import DashboardStats from "@/components/dashboard-stats";
import DashboardRecentBookings from "@/components/dashboard-recent-bookings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardCurrentBookings from "@/components/dashboard-current-bookings";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/components/auth-provider";
import { differenceInDays } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info, Copy, Banknote } from "lucide-react";
import AvailabilitySearcher from "@/components/availability-searcher";
import PaymentCalculator from "@/components/payment-calculator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { parseDateSafely } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
    const { toast } = useToast();

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
    
    const today = useMemo(() => {
        const now = new Date();
        return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    }, []);

    const upcomingCheckIns = useMemo(() => {
        if (!data) return [];
        const checkInDays = data.alertSettings?.checkInDays ?? 7;
        return data.bookings.filter(b => {
            const isActive = !b.status || b.status === 'active';
            if (!isActive) return false;
            const checkInDate = parseDateSafely(b.startDate);
            if (!checkInDate) return false;
            const daysUntil = differenceInDays(checkInDate, today);
            return daysUntil >= 0 && daysUntil <= checkInDays;
        }).sort((a, b) => {
            const dateA = parseDateSafely(a.startDate)?.getTime() || 0;
            const dateB = parseDateSafely(b.startDate)?.getTime() || 0;
            return dateA - dateB;
        });
    }, [data, today]);

    const upcomingCheckOuts = useMemo(() => {
        if (!data) return [];
        const checkOutDays = data.alertSettings?.checkOutDays ?? 3;
        return data.bookings.filter(b => {
            const isActive = !b.status || b.status === 'active';
            if (!isActive) return false;
            const checkOutDate = parseDateSafely(b.endDate);
            if (!checkOutDate) return false;
            const daysUntil = differenceInDays(checkOutDate, today);
            return daysUntil >= 0 && daysUntil <= checkOutDays;
        }).sort((a, b) => {
            const dateA = parseDateSafely(a.endDate)?.getTime() || 0;
            const dateB = parseDateSafely(b.endDate)?.getTime() || 0;
            return dateA - dateB;
        });
    }, [data, today]);

    const bookingsWithPendingBalance = useMemo(() => {
        if (!data) return [];
        const checkInDays = data.alertSettings?.checkInDays ?? 7;
        return data.bookings.filter(b => {
            const isActive = !b.status || b.status === 'active';
            if (!isActive) return false;
            if (b.balance < 1) return false;
            
            const startDate = parseDateSafely(b.startDate);
            const endDate = parseDateSafely(b.endDate);
            if (!startDate || !endDate) return false;

            const daysUntilCheckIn = differenceInDays(startDate, today);
            const isUpcoming = daysUntilCheckIn >= 0 && daysUntilCheckIn <= checkInDays;
            const isCurrent = today >= startDate && today <= endDate;
            const isPast = today > endDate;

            return isCurrent || isUpcoming || isPast;
        }).sort((a, b) => {
            const dateA = parseDateSafely(a.startDate)?.getTime() || 0;
            const dateB = parseDateSafely(b.startDate)?.getTime() || 0;
            return dateA - dateB;
        });
    }, [data, today]);

    const upcomingBookings = useMemo(() => {
        if (!data) return [];
        return data.bookings
        .filter(b => {
            const startDate = parseDateSafely(b.startDate);
            if (!startDate) return false;
            const isActive = !b.status || b.status === 'active';
            return startDate >= today && isActive;
        })
        .sort((a, b) => {
            const dateA = parseDateSafely(a.startDate)?.getTime() || 0;
            const dateB = parseDateSafely(b.startDate)?.getTime() || 0;
            return dateA - dateB;
        })
        .slice(0, 5);
    }, [data, today]);

    const currentBookings = useMemo(() => {
        if (!data) return [];
        return data.bookings
        .filter(b => {
            const startDate = parseDateSafely(b.startDate);
            const endDate = parseDateSafely(b.endDate);
            if (!startDate || !endDate) return false;
            const isActive = !b.status || b.status === 'active';
            return today >= startDate && today <= endDate && isActive;
        })
        .sort((a, b) => {
            const dateA = parseDateSafely(a.startDate)?.getTime() || 0;
            const dateB = parseDateSafely(b.startDate)?.getTime() || 0;
            return dateA - dateB;
        });
    }, [data, today]);

    const formatDateForDisplay = (date: Date | undefined): string => {
        if (!date) return 'Fecha inv.';
        // The 'date' object is a UTC date. To format it correctly in the local timezone
        // without it shifting, we need to create a new Date object from its UTC components.
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth();
        const day = date.getUTCDate();
        const localDate = new Date(year, month, day);
        return format(localDate, "dd/MM/yyyy", { locale: es });
    };
    
    const formatCurrency = (amount: number, currency: 'ARS' | 'USD') => {
        if (currency === 'USD') {
            return `USD ${new Intl.NumberFormat('es-AR', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(amount)}`;
        }
        return new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount);
    };

    const handleCopy = (type: 'check-ins' | 'check-outs' | 'balance') => {
        let textToCopy = '';
        if (type === 'check-ins') {
            textToCopy = `*Próximos Check-ins:*\n` + upcomingCheckIns.map(b => {
                let line = `- ${b.property?.name}: *${b.tenant?.name}* llega el *${formatDateForDisplay(parseDateSafely(b.startDate))}*.`;
                if (b.tenant?.phone) {
                    line += ` Tel: ${b.tenant.phone}`;
                }
                return line;
            }).join('\n');
        } else if (type === 'check-outs') {
            textToCopy = `*Próximos Check-outs:*\n` + upcomingCheckOuts.map(b => {
                let line = `- ${b.property?.name}: *${b.tenant?.name}* se retira el *${formatDateForDisplay(parseDateSafely(b.endDate))}*.`;
                if (b.tenant?.phone) {
                    line += ` Tel: ${b.tenant.phone}`;
                }
                return line;
            }).join('\n');
        } else if (type === 'balance') {
             textToCopy = `*Reservas con Saldo Pendiente:*\n` + bookingsWithPendingBalance.map(b => {
                const startDate = parseDateSafely(b.startDate);
                const endDate = parseDateSafely(b.endDate);
                const isCurrent = startDate && endDate && today >= startDate && today <= endDate;
                const isPast = endDate && today > endDate;

                let dateText: string;
                if (isCurrent) {
                    dateText = `En curso - Check-out: ${formatDateForDisplay(endDate)}`;
                } else if (isPast) {
                    dateText = `Finalizada - Check-out: ${formatDateForDisplay(endDate)}`;
                } else {
                    dateText = `Próxima - Check-in: ${formatDateForDisplay(startDate)}`;
                }

                return `- ${b.property?.name}: *${b.tenant?.name}* (${dateText}) tiene un saldo de *${formatCurrency(b.balance, b.currency)}*.`;
            }).join('\n');
        }

        navigator.clipboard.writeText(textToCopy);
        toast({
            title: "Copiado",
            description: "El resumen de alertas se ha copiado al portapapeles.",
        });
    };


    if (loading || !data) {
        return <p>Cargando dashboard...</p>;
    }

    const { summaryByCurrency, properties, tenants, bookings } = data;

    const totalIncomeArs = summaryByCurrency.ars.reduce((acc, item) => acc + item.totalIncome, 0);
    const totalNetResultArs = summaryByCurrency.ars.reduce((acc, item) => acc + item.netResult, 0);
    const totalBalanceArs = summaryByCurrency.ars.reduce((acc, item) => acc + item.balance, 0);
    const totalIncomeUsd = summaryByCurrency.usd.reduce((acc, item) => acc + item.totalIncome, 0);
    const totalNetResultUsd = summaryByCurrency.usd.reduce((acc, item) => acc + item.netResult, 0);
    const totalBalanceUsd = summaryByCurrency.usd.reduce((acc, item) => acc + item.balance, 0);

    const totalProperties = properties.length;
    const totalTenants = tenants.length;

    return (
        <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between space-y-2">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-primary">Inicio</h2>
                <p className="text-muted-foreground">Un resumen de tu negocio de alquileres.</p>
            </div>
        </div>

        {upcomingCheckIns.length > 0 && (
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <div className="flex justify-between items-start w-full">
                    <div>
                        <AlertTitle>¡Atención! Próximos Check-ins</AlertTitle>
                        <AlertDescription>
                            Tienes {upcomingCheckIns.length} check-in(s) en los próximos {data.alertSettings?.checkInDays ?? 7} días.
                            <ul className="list-disc pl-5 mt-2">
                            {upcomingCheckIns.map(b => (
                                <li key={b.id}>{b.property?.name}: <strong>{b.tenant?.name}</strong> llega el <strong>{formatDateForDisplay(parseDateSafely(b.startDate))}</strong>.</li>
                            ))}
                            </ul>
                        </AlertDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleCopy('check-ins')}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </Alert>
        )}
        
        {upcomingCheckOuts.length > 0 && (
            <Alert variant="default" className="border-blue-500 text-blue-800 dark:border-blue-400 dark:text-blue-300 [&>svg]:text-blue-500">
                <Info className="h-4 w-4" />
                <div className="flex justify-between items-start w-full">
                    <div>
                        <AlertTitle className="text-blue-800 dark:text-blue-300">Aviso: Próximos Check-outs</AlertTitle>
                        <AlertDescription>
                            Tienes {upcomingCheckOuts.length} check-out(s) en los próximos {data.alertSettings?.checkOutDays ?? 3} días.
                             <ul className="list-disc pl-5 mt-2">
                            {upcomingCheckOuts.map(b => (
                                <li key={b.id}>{b.property?.name}: <strong>{b.tenant?.name}</strong> se retira el <strong>{formatDateForDisplay(parseDateSafely(b.endDate))}</strong>.</li>
                            ))}
                            </ul>
                        </AlertDescription>
                    </div>
                     <Button variant="ghost" size="icon" onClick={() => handleCopy('check-outs')}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </Alert>
        )}

        {bookingsWithPendingBalance.length > 0 && (
            <Alert variant="default" className="border-orange-500 text-orange-800 dark:border-orange-400 dark:text-orange-300 [&>svg]:text-orange-500">
                <Banknote className="h-4 w-4" />
                <div className="flex justify-between items-start w-full">
                    <div>
                        <AlertTitle className="text-orange-800 dark:text-orange-300">Reservas con Saldo Pendiente</AlertTitle>
                        <AlertDescription>
                            Tienes {bookingsWithPendingBalance.length} reserva(s) con saldo a cobrar.
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                            {bookingsWithPendingBalance.map(b => {
                                const startDate = parseDateSafely(b.startDate);
                                const endDate = parseDateSafely(b.endDate);
                                const isCurrent = startDate && endDate && today >= startDate && today <= endDate;
                                const isPast = endDate && today > endDate;
                                const isCritical = isCurrent || isPast;

                                return (
                                    <li key={b.id} className={isCritical ? "font-semibold text-destructive" : ""}>
                                        {isCritical && <AlertTriangle className="inline-block h-4 w-4 mr-2" />}
                                        {b.property?.name}: <strong>{b.tenant?.name}</strong> debe <strong>{formatCurrency(b.balance, b.currency)}</strong>.
                                        {isCurrent
                                            ? ` (En curso - Check-out: ${formatDateForDisplay(endDate)})`
                                            : isPast
                                            ? ` (Finalizada - Check-out: ${formatDateForDisplay(endDate)})`
                                            : ` (Próxima - Check-in: ${formatDateForDisplay(startDate)})`
                                        }
                                    </li>
                                );
                            })}
                            </ul>
                        </AlertDescription>
                    </div>
                     <Button variant="ghost" size="icon" onClick={() => handleCopy('balance')}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </Alert>
        )}


        <DashboardStats
            totalIncomeArs={totalIncomeArs}
            totalNetResultArs={totalNetResultArs}
            totalBalanceArs={totalBalanceArs}
            totalIncomeUsd={totalIncomeUsd}
            totalNetResultUsd={totalNetResultUsd}
            totalBalanceUsd={totalBalanceUsd}
            totalProperties={totalProperties}
            totalTenants={totalTenants}
        />
        
        <AvailabilitySearcher allProperties={properties} allBookings={bookings} />
        
        <PaymentCalculator showTabs={true} />

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
