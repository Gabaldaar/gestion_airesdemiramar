
'use client';

import { BookingWithDetails, Property, Tenant, AlertSettings, DateBlock, Contrato, PeriodoPago, Provider } from "@/lib/data";
import DashboardStats from "@/components/dashboard-stats";
import DashboardRecentBookings from "@/components/dashboard-recent-bookings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import DashboardCurrentBookings from "@/components/dashboard-current-bookings";
import { useState, useMemo } from "react";
import { useAuth } from "@/components/auth-provider";
import { differenceInDays, startOfToday } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info, Copy, Banknote, ShieldCheck, ShieldAlert, Briefcase, ClipboardList, Building2, Users, PlusCircle, CheckCircle } from "lucide-react";
import AvailabilitySearcher from "@/components/availability-searcher";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { parseDateSafely, cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from 'next/link';
import PaymentCalculator from "@/components/payment-calculator";
import { useTranslation } from "@/i18n/useTranslation";
import { MonthlyBreakdownItem } from "@/app/page";
import { PropertyAddForm } from "./property-add-form";
import { TenantAddForm } from "./tenant-add-form";
import { PushNotificationReminder } from "./push-notification-reminder";

interface DashboardData {
    properties: Property[];
    tenants: Tenant[];
    bookings: BookingWithDetails[];
    alertSettings: AlertSettings | null;
    blocks: DateBlock[];
    contratos: (Contrato & { property: Property; tenant: Tenant })[];
    periodosPago: PeriodoPago[];
    occupiedPropertiesCount: number;
    monthlyStats: Record<string, { received: number, pending: number, items: MonthlyBreakdownItem[] }>;
    pendingLiquidationsCount: number;
    unliquidatedItemsCount: number;
    pendingBookingsCount: number;
    providers: Provider[];
}

export type DashboardStay = {
    id: string;
    property: Property;
    tenant: Tenant;
    startDate: string;
    endDate: string;
    amount: number;
    currency: string;
    balance: number;
    status: string;
    agreementType: 'temporary' | 'long_term';
};

export default function DashboardClient({ initialData }: { initialData: DashboardData }) {
    const { appUser, activeRole } = useAuth();
    const { t } = useTranslation();
    const isPersonalFlavor = appUser?.appFlavor !== 'commercial';
    const [data] = useState<DashboardData | null>(initialData);
    const { toast } = useToast();
    
    const today = useMemo(() => startOfToday(), []);

    // Solo mostramos el recordatorio a roles administrativos
    const isSystemUser = activeRole === 'admin' || activeRole === 'socio' || activeRole === 'staff';

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
    
    const upcomingOrCurrentWithGuaranteeSolicited = useMemo(() => {
        if (!data) return [];
        return data.bookings.filter(b => {
            const isActive = !b.status || b.status === 'active';
            if (!isActive || b.guaranteeStatus !== 'solicited') return false;

            const startDate = parseDateSafely(b.startDate);
            const endDate = parseDateSafely(b.endDate);
            if (!startDate || !endDate) return false;

            const isUpcoming = startDate >= today;
            const isCurrent = today >= startDate && today <= endDate;
            
            return isUpcoming || isCurrent;
        }).sort((a, b) => {
            const dateA = parseDateSafely(a.startDate)?.getTime() || 0;
            const dateB = parseDateSafely(b.startDate)?.getTime() || 0;
            return dateA - dateB;
        });
    }, [data, today]);

    const completedWithGuaranteeReceived = useMemo(() => {
        if (!data) return [];
        return data.bookings.filter(b => {
            const isActive = !b.status || b.status === 'active';
            if (!isActive || b.guaranteeStatus !== 'received') return false;
            
            const endDate = parseDateSafely(b.endDate);
            if (!endDate) return false;

            const isPast = today > endDate;
            return isPast;
        }).sort((a, b) => {
            const dateA = parseDateSafely(a.endDate)?.getTime() || 0;
            const dateB = parseDateSafely(b.endDate)?.getTime() || 0;
            return dateA - dateB;
        });
    }, [data, today]);

    const upcomingStays = useMemo(() => {
        if (!data) return [];
        
        const upcomingBookings: DashboardStay[] = data.bookings
            .filter(b => {
                const startDate = parseDateSafely(b.startDate);
                return startDate && startDate >= today && (!b.status || b.status === 'active');
            })
            .map(b => ({
                id: b.id,
                property: b.property,
                tenant: b.tenant,
                startDate: b.startDate,
                endDate: b.endDate,
                amount: b.amount,
                currency: b.currency,
                balance: b.balance,
                status: b.status || 'active',
                agreementType: 'temporary'
            }));

        const upcomingContracts: DashboardStay[] = data.contratos
            .filter(c => {
                const startDate = parseDateSafely(c.fechaInicio);
                return startDate && startDate >= today && c.status === 'active';
            })
            .map(c => ({
                id: c.id,
                property: c.property,
                tenant: c.tenant,
                startDate: c.fechaInicio,
                endDate: c.fechaFin,
                amount: c.montoInicial,
                currency: c.moneda,
                balance: 0, // Simplified for dashboard
                status: c.status,
                agreementType: 'long_term'
            }));

        return [...upcomingBookings, ...upcomingContracts]
            .sort((a, b) => (parseDateSafely(a.startDate)?.getTime() || 0) - (parseDateSafely(b.startDate)?.getTime() || 0))
            .slice(0, 5);
    }, [data, today]);

    const currentStays = useMemo(() => {
        if (!data) return [];

        const currentBookings: DashboardStay[] = data.bookings
            .filter(b => {
                const startDate = parseDateSafely(b.startDate);
                const endDate = parseDateSafely(b.endDate);
                return startDate && endDate && today >= startDate && today <= endDate && (!b.status || b.status === 'active');
            })
            .map(b => ({
                id: b.id,
                property: b.property,
                tenant: b.tenant,
                startDate: b.startDate,
                endDate: b.endDate,
                amount: b.amount,
                currency: b.currency,
                balance: b.balance,
                status: b.status || 'active',
                agreementType: 'temporary'
            }));

        const currentContracts: DashboardStay[] = data.contratos
            .filter(c => {
                const startDate = parseDateSafely(c.fechaInicio);
                const endDate = parseDateSafely(c.fechaFin);
                return startDate && endDate && today >= startDate && today <= endDate && c.status === 'active';
            })
            .map(c => ({
                id: c.id,
                property: c.property,
                tenant: c.tenant,
                startDate: c.fechaInicio,
                endDate: c.fechaFin,
                amount: c.montoInicial,
                currency: c.moneda,
                balance: 0,
                status: c.status,
                agreementType: 'long_term'
            }));

        return [...currentBookings, ...currentContracts]
            .sort((a, b) => (parseDateSafely(a.startDate)?.getTime() || 0) - (parseDateSafely(b.startDate)?.getTime() || 0));
    }, [data, today]);

    const formatDateForDisplay = (date: Date | undefined): string => {
        if (!date) return 'Fecha inv.';
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth();
        const day = date.getUTCDate();
        const localDate = new Date(year, month, day);
        return format(localDate, "dd/MM/yyyy", { locale: es });
    };
    
    const formatCurrency = (amount: number, currency: string) => {
        try {
            return new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(amount);
        } catch (e) {
            return `${currency} ${amount.toFixed(2)}`;
        }
    };

    const handleCopy = (type: 'check-ins' | 'check-outs' | 'balance' | 'guarantee-solicited' | 'guarantee-received') => {
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
                } else { // isUpcoming
                    dateText = `Próxima - Check-in: ${formatDateForDisplay(startDate)}`;
                }

                return `- ${b.property?.name}: *${b.tenant?.name}* (${dateText}) tiene un saldo de *${formatCurrency(b.balance, b.currency)}*.`;
            }).join('\n');
        } else if (type === 'guarantee-solicited') {
            textToCopy = `*Reservas con Garantía Solicitada:*\n` + upcomingOrCurrentWithGuaranteeSolicited.map(b => {
                const date = parseDateSafely(b.startDate);
                return `- ${b.property?.name}: *${b.tenant?.name}* (Check-in: ${formatDateForDisplay(date)}).`;
            }).join('\n');
        } else if (type === 'guarantee-received') {
            textToCopy = `*Reservas Cumplidas con Garantía sin Devolver:*\n` + completedWithGuaranteeReceived.map(b => {
                 const date = parseDateSafely(b.endDate);
                return `- ${b.property?.name}: *${b.tenant?.name}* (Check-out: ${formatDateForDisplay(date)}).`;
            }).join('\n');
        }

        navigator.clipboard.writeText(textToCopy);
        toast({
            title: t('common.success'),
            description: "El resumen de alertas se ha copiado al portapapeles.",
        });
    };

    if (!data) return null;

    const { properties, tenants, occupiedPropertiesCount, monthlyStats, pendingLiquidationsCount, unliquidatedItemsCount } = data;

    const isEmptyState = properties.length === 0 || tenants.length === 0;

    const TenantOnboardingCard = ({ highlight = false }: { highlight?: boolean }) => (
        <Card className={cn(
            "border-4 border-dashed transition-all shadow-2xl rounded-[2.5rem] group overflow-hidden h-full",
            highlight ? "border-primary/20 bg-primary/5 hover:border-primary/40" : "border-zinc-200 bg-zinc-50"
        )}>
            <CardHeader className="text-center p-12">
                <div className="mx-auto w-24 h-24 bg-zinc-200 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                    <Users className="h-12 w-12 text-zinc-500" />
                </div>
                <CardTitle className="text-3xl font-black uppercase italic tracking-tighter text-zinc-700">{t('dashboard.welcome_new.tenant_title')}</CardTitle>
                <CardDescription className="text-lg mt-3 font-medium text-muted-foreground/80 leading-snug">
                    {t('dashboard.welcome_new.tenant_desc')}
                </CardDescription>
            </CardHeader>
            <CardContent className="px-12 text-center pb-0">
                 <p className="text-sm text-muted-foreground italic">
                     {t('dashboard.welcome_new.tenant_hint')}
                 </p>
            </CardContent>
            <CardFooter className="justify-center pb-12 pt-8">
                <TenantAddForm onTenantAdded={() => window.location.reload()}>
                    <Button variant={highlight ? "default" : "secondary"} size="lg" className="h-16 px-10 text-lg font-black uppercase italic tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">
                        <PlusCircle className="mr-3 h-6 w-6 stroke-[3px]" />
                        {t('dashboard.welcome_new.tenant_btn')}
                    </Button>
                </TenantAddForm>
            </CardFooter>
        </Card>
    );

    if (isEmptyState) {
        return (
            <div className="flex-1 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="text-center max-w-2xl mx-auto space-y-2 py-6">
                    <h2 className="text-4xl font-black tracking-tighter text-primary italic uppercase leading-none">
                        {t('dashboard.welcome_new.title')}
                    </h2>
                    <p className="text-muted-foreground text-lg font-medium">
                        {t('dashboard.welcome_new.subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-start">
                    {/* Columna Izquierda: Estado de Propiedad / Paso Siguiente */}
                    <div className="space-y-6">
                        {properties.length === 0 ? (
                            <Card className="border-4 border-dashed border-primary/20 bg-primary/5 hover:border-primary/40 transition-all shadow-2xl rounded-[2.5rem] group overflow-hidden">
                                <CardHeader className="text-center p-12">
                                    <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                                        <Building2 className="h-12 w-12 text-primary" />
                                    </div>
                                    <CardTitle className="text-3xl font-black uppercase italic tracking-tighter text-primary">{t('dashboard.welcome_new.prop_title')}</CardTitle>
                                    <CardDescription className="text-lg mt-3 font-medium text-muted-foreground/80 leading-snug">
                                        {t('dashboard.welcome_new.prop_desc')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="px-12 text-center pb-0">
                                     <p className="text-sm text-muted-foreground italic">
                                         {t('dashboard.welcome_new.prop_hint')}
                                     </p>
                                </CardContent>
                                <CardFooter className="justify-center pb-12 pt-8">
                                    <PropertyAddForm providers={data.providers || []} isPersonalFlavor={isPersonalFlavor} onPropertyAdded={() => window.location.reload()}>
                                        <Button size="lg" className="h-16 px-10 text-lg font-black uppercase italic tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">
                                            <PlusCircle className="mr-3 h-6 w-6 stroke-[3px]" />
                                            {t('dashboard.welcome_new.prop_btn')}
                                        </Button>
                                    </PropertyAddForm>
                                </CardFooter>
                            </Card>
                        ) : (
                             <>
                                <div className="flex items-center gap-4 p-6 bg-green-50 rounded-3xl border-2 border-green-200">
                                    <div className="p-3 bg-green-500 text-white rounded-2xl shadow-lg">
                                        <CheckCircle className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-black uppercase italic text-green-700 leading-none">Paso Completado</p>
                                        <p className="text-sm text-green-600 font-medium">Ya tienes {properties.length} propiedades listas.</p>
                                    </div>
                                </div>
                                
                                {/* Si las propiedades ya están cargadas, movemos la tarjeta de inquilinos aquí debajo */}
                                {tenants.length === 0 && (
                                    <TenantOnboardingCard highlight={true} />
                                )}
                             </>
                        )}
                    </div>

                    {/* Columna Derecha: Inquilinos (inicial) / Estadísticas */}
                    <div className="space-y-6">
                        {properties.length === 0 ? (
                            tenants.length === 0 && <TenantOnboardingCard />
                        ) : (
                             <DashboardStats
                                monthlyStats={monthlyStats}
                                totalProperties={properties.length}
                                totalTenants={tenants.length}
                                occupiedPropertiesCount={occupiedPropertiesCount}
                             />
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between space-y-2">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-primary">{t('dashboard.title')}</h2>
                <p className="text-muted-foreground">{t('dashboard.description')}</p>
            </div>
        </div>

        {isSystemUser && <PushNotificationReminder />}

        {isPersonalFlavor && pendingLiquidationsCount > 0 && (
            <Alert variant="default" className="border-orange-500 text-orange-800 dark:border-orange-400 dark:text-orange-300 [&>svg]:text-orange-500">
                <Briefcase className="h-4 w-4" />
                <div className="flex justify-between items-start w-full">
                    <div>
                        <AlertTitle className="text-orange-800 dark:text-orange-300">{t('dashboard.alerts.pending_liquidations')}</AlertTitle>
                        <AlertDescription>
                            {t('dashboard.alerts.pending_liquidations_desc').replace('{{count}}', pendingLiquidationsCount.toString())}
                        </AlertDescription>
                    </div>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/liquidations">
                            {t('navigation.liquidations')}
                        </Link>
                    </Button>
                </div>
            </Alert>
        )}
        
        {isPersonalFlavor && unliquidatedItemsCount > 0 && (
            <Alert variant="default" className="border-blue-500 text-blue-800 dark:border-blue-400 dark:text-blue-300 [&>svg]:text-blue-500">
                <ClipboardList className="h-4 w-4" />
                <div className="flex justify-between items-start w-full">
                    <div>
                        <AlertTitle className="text-blue-800 dark:text-blue-300">{t('dashboard.alerts.unliquidated_items')}</AlertTitle>
                        <AlertDescription>
                            {t('dashboard.alerts.unliquidated_items_desc').replace('{{count}}', unliquidatedItemsCount.toString())}
                        </AlertDescription>
                    </div>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/liquidations">
                            {t('navigation.liquidations')}
                        </Link>
                    </Button>
                </div>
            </Alert>
        )}

        {upcomingCheckIns.length > 0 && (
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <div className="flex justify-between items-start w-full">
                    <div>
                        <AlertTitle>{t('dashboard.alerts.checkins_title')}</AlertTitle>
                        <AlertDescription>
                            {t('dashboard.alerts.checkins_desc').replace('{{count}}', upcomingCheckIns.length.toString())}
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
                        <AlertTitle className="text-blue-800 dark:text-blue-300">{t('dashboard.alerts.checkouts_title')}</AlertTitle>
                        <AlertDescription>
                            {t('dashboard.alerts.checkouts_desc').replace('{{count}}', upcomingCheckOuts.length.toString())}
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
                        <AlertTitle className="text-orange-800 dark:text-orange-300">{t('dashboard.alerts.balance_title')}</AlertTitle>
                        <AlertDescription>
                            {t('dashboard.alerts.balance_desc').replace('{{count}}', bookingsWithPendingBalance.length.toString())}
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

        {upcomingOrCurrentWithGuaranteeSolicited.length > 0 && (
            <Alert variant="default" className="border-cyan-500 text-cyan-800 dark:border-cyan-400 dark:text-cyan-300 [&>svg]:text-cyan-500">
                <ShieldAlert className="h-4 w-4" />
                <div className="flex justify-between items-start w-full">
                    <div>
                        <AlertTitle className="text-cyan-800 dark:text-cyan-300">{t('dashboard.alerts.guarantee_solicited_title')}</AlertTitle>
                        <AlertDescription>
                            {t('dashboard.alerts.guarantee_solicited_desc').replace('{{count}}', upcomingOrCurrentWithGuaranteeSolicited.length.toString())}
                            <ul className="list-disc pl-5 mt-2">
                            {upcomingOrCurrentWithGuaranteeSolicited.map(b => (
                                <li key={b.id}>{b.property?.name}: <strong>{b.tenant?.name}</strong> (Check-in: <strong>{formatDateForDisplay(parseDateSafely(b.startDate))}</strong>).</li>
                            ))}
                            </ul>
                        </AlertDescription>
                    </div>
                     <Button variant="ghost" size="icon" onClick={() => handleCopy('guarantee-solicited')}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </Alert>
        )}
        
        {completedWithGuaranteeReceived.length > 0 && (
            <Alert variant="destructive">
                <ShieldCheck className="h-4 w-4" />
                <div className="flex justify-between items-start w-full">
                    <div>
                        <AlertTitle>{t('dashboard.alerts.guarantee_received_title')}</AlertTitle>
                        <AlertDescription>
                            {t('dashboard.alerts.guarantee_received_desc').replace('{{count}}', completedWithGuaranteeReceived.length.toString())}
                            <ul className="list-disc pl-5 mt-2">
                            {completedWithGuaranteeReceived.map(b => (
                                <li key={b.id}>{b.property?.name}: <strong>{b.tenant?.name}</strong> se retiró el <strong>{formatDateForDisplay(parseDateSafely(b.endDate))}</strong>.</li>
                            ))}
                            </ul>
                        </AlertDescription>
                    </div>
                     <Button variant="ghost" size="icon" onClick={() => handleCopy('guarantee-received')}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </Alert>
        )}


        <DashboardStats
            monthlyStats={monthlyStats}
            totalProperties={properties.length}
            totalTenants={tenants.length}
            occupiedPropertiesCount={occupiedPropertiesCount}
        />
        
        <AvailabilitySearcher allProperties={properties} allBookings={data.bookings} allBlocks={data.blocks} allContratos={data.contratos} isPersonalFlavor={isPersonalFlavor} />
        {isPersonalFlavor && <PaymentCalculator showTabs={true} />}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-1 lg:col-span-4">
            <CardHeader>
                <CardTitle>{t('dashboard.current_bookings')}</CardTitle>
                <CardDescription>
                Ocupación activa en este momento.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <DashboardCurrentBookings bookings={currentStays} />
            </CardContent>
            </Card>
            <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
                <CardTitle>{t('dashboard.upcoming_bookings')}</CardTitle>
                <CardDescription>
                Las próximas 5 ocupaciones agendadas.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <DashboardRecentBookings bookings={upcomingStays} />
            </CardContent>
            </Card>
        </div>
        </div>
    );
}
