
'use client';

import { useState, useTransition, useMemo } from 'react';
import { OrganizationStats } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { 
    Loader2, 
    RefreshCw, 
    Activity, 
    ShieldAlert, 
    Mail, 
    Info, 
    Users, 
    Building2, 
    Calendar, 
    ClipboardList, 
    CheckCircle2, 
    Home, 
    Wrench,
    Clock,
    Tag,
    ShieldCheck,
    ExternalLink,
    BarChart3,
    PieChart
} from 'lucide-react';
import { syncAllOrganizationsStats } from '@/lib/actions';
import { useToast } from './ui/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseDateSafely, cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/useTranslation';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import useWindowSize from '@/hooks/use-window-size';

export function MonitorClient({ initialStats, onDataChanged }: { 
    initialStats: OrganizationStats[], 
    onDataChanged: () => void 
}) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const { width } = useWindowSize();
    const isMobile = typeof width === 'number' ? width < 1024 : false;

    const handleSyncAll = () => {
        startTransition(async () => {
            const result = await syncAllOrganizationsStats();
            if (result.success) {
                toast({ title: t('common.success'), description: result.message });
                onDataChanged();
            }
        });
    };

    const formatDate = (dateStr: string) => {
        const date = parseDateSafely(dateStr);
        return date ? format(date, 'dd MMM HH:mm', { locale: es }) : '-';
    };

    const totals = useMemo(() => {
        return initialStats.reduce((acc, stat) => {
            acc.orgs++;
            acc.properties += stat.propertiesCount || 0;
            acc.tenants += stat.tenantsCount || 0;
            acc.bookings += stat.bookingsCount || 0;
            acc.contratos += stat.contratosCount || 0;
            acc.team += stat.teamCount || 0;
            
            const lastActivity = parseDateSafely(stat.lastActivity);
            if (lastActivity && (new Date().getTime() - lastActivity.getTime()) < 7 * 24 * 60 * 60 * 1000) {
                acc.activeOrgs++;
            }
            
            return acc;
        }, { orgs: 0, activeOrgs: 0, properties: 0, tenants: 0, bookings: 0, contratos: 0, team: 0 });
    }, [initialStats]);

    // URLs de Consola (ID de Proyecto: miramar-rentals-manager)
    const googleLinks = [
        { 
            label: t('monitor.shortcuts.firebase'), 
            url: "https://console.firebase.google.com/project/miramar-rentals-manager/analytics/overview",
            icon: <BarChart3 className="h-4 w-4" />,
            desc: t('monitor.shortcuts.firebase_desc')
        },
        { 
            label: t('monitor.shortcuts.debug'), 
            url: "https://console.firebase.google.com/project/miramar-rentals-manager/analytics/debugview",
            icon: <Activity className="h-4 w-4" />,
            desc: t('monitor.shortcuts.debug_desc')
        },
        { 
            label: t('monitor.shortcuts.ga4'), 
            url: "https://analytics.google.com/analytics/web/",
            icon: <PieChart className="h-4 w-4" />,
            desc: t('monitor.shortcuts.ga4_desc')
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        {t('monitor.title')}
                    </h3>
                    <p className="text-sm text-muted-foreground">{t('monitor.subtitle')}</p>
                </div>
                <Button variant="outline" onClick={handleSyncAll} disabled={isPending} className="w-full sm:w-auto shadow-sm">
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    {t('monitor.sync_button')}
                </Button>
            </div>

            {/* PANEL DE MÉTRICAS GLOBALES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <Card className="bg-primary/5 border-primary/20 shadow-sm border-2">
                    <CardHeader className="p-3 pb-0">
                        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                            <Building2 className="h-3 w-3 text-primary" /> {t('monitor.stats.orgs')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-1">
                        <p className="text-2xl font-black text-primary">{totals.orgs}</p>
                        <p className="text-[9px] font-bold text-green-600 uppercase flex items-center gap-1 mt-1">
                            <CheckCircle2 className="h-2.5 w-2.5" /> {totals.activeOrgs} {t('monitor.stats.active')}
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-zinc-200">
                    <CardHeader className="p-3 pb-0">
                        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                            <Home className="h-3 w-3 text-blue-600" /> {t('monitor.stats.properties')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-1">
                        <p className="text-2xl font-black">{totals.properties}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Global</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-zinc-200">
                    <CardHeader className="p-3 pb-0">
                        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                            <Users className="h-3 w-3 text-zinc-600" /> {t('monitor.stats.tenants')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-1">
                        <p className="text-2xl font-black">{totals.tenants}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Total</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-zinc-200">
                    <CardHeader className="p-3 pb-0">
                        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-green-600" /> {t('monitor.stats.bookings')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-1">
                        <p className="text-2xl font-black">{totals.bookings}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Total</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-zinc-200">
                    <CardHeader className="p-3 pb-0">
                        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                            <ClipboardList className="h-3 w-3 text-orange-600" /> {t('monitor.stats.contratos')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-1">
                        <p className="text-2xl font-black">{totals.contratos}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Total</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-zinc-200">
                    <CardHeader className="p-3 pb-0">
                        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                            <Wrench className="h-3 w-3 text-purple-600" /> {t('monitor.stats.team')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-1">
                        <p className="text-2xl font-black">{totals.team}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Total</p>
                    </CardContent>
                </Card>
            </div>

            {/* ACCESOS DIRECTOS A GOOGLE ANALYTICS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {googleLinks.map((link, idx) => (
                    <Card key={idx} className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => window.open(link.url, '_blank')}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors text-muted-foreground group-hover:text-primary">
                                    {link.icon}
                                </div>
                                <div>
                                    <p className="text-sm font-bold">{link.label}</p>
                                    <p className="text-[10px] text-muted-foreground">{link.desc}</p>
                                </div>
                            </div>
                            <ExternalLink className="h-4 w-4 opacity-30 group-hover:opacity-100 transition-opacity" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* TABLA O TARJETAS DE DETALLE */}
            <Card className="border-2 border-primary/10 shadow-lg overflow-hidden">
                <CardHeader className="bg-primary/5">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">{t('monitor.org_detail.title')}</CardTitle>
                    <CardDescription>{t('monitor.org_detail.desc')}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {isMobile ? (
                        <div className="grid grid-cols-1 gap-4 p-4">
                            {initialStats.length > 0 ? initialStats.map((stat) => {
                                const lastActivityDate = parseDateSafely(stat.lastActivity);
                                const isRecent = lastActivityDate && (new Date().getTime() - lastActivityDate.getTime()) < 24 * 60 * 60 * 1000;
                                
                                return (
                                    <Card key={stat.orgId} className={cn("overflow-hidden border-2", isRecent ? "border-primary/30 shadow-md" : "border-muted")}>
                                        <CardHeader className="p-4 pb-2 py-3 bg-muted/20">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <CardTitle className="text-base font-black truncate text-primary">{stat.ownerName}</CardTitle>
                                                    <CardDescription className="flex items-center gap-1 text-[10px] truncate">
                                                        <Mail className="h-3 w-3" /> {stat.ownerEmail}
                                                    </CardDescription>
                                                </div>
                                                {isRecent && <Badge className="bg-green-600 text-[8px] h-4 uppercase">{t('monitor.org_detail.active_today')}</Badge>}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-4 border-b border-muted">
                                            <div className="grid grid-cols-3 gap-y-4 gap-x-2">
                                                <div className="space-y-0.5 text-center sm:text-left">
                                                    <p className="text-[9px] uppercase font-bold text-muted-foreground flex items-center justify-center sm:justify-start gap-1"><Home className="h-2.5 w-2.5"/> {t('monitor.stats.properties').slice(0, 4)}.</p>
                                                    <p className="font-black text-sm">{stat.propertiesCount || 0}</p>
                                                </div>
                                                <div className="space-y-0.5 border-x px-2 text-center sm:text-left">
                                                    <p className="text-[9px] uppercase font-bold text-muted-foreground flex items-center justify-center sm:justify-start gap-1"><Users className="h-2.5 w-2.5"/> Inq.</p>
                                                    <p className="font-black text-sm">{stat.tenantsCount || 0}</p>
                                                </div>
                                                <div className="space-y-0.5 text-center sm:text-left">
                                                    <p className="text-[9px] uppercase font-bold text-muted-foreground flex items-center justify-center sm:justify-start gap-1"><Wrench className="h-2.5 w-2.5"/> {t('monitor.stats.team').slice(0, 4)}.</p>
                                                    <p className="font-black text-sm">{stat.teamCount || 0}</p>
                                                </div>
                                                <div className="space-y-0.5 text-center sm:text-left">
                                                    <p className="text-[9px] uppercase font-bold text-muted-foreground flex items-center justify-center sm:justify-start gap-1"><Calendar className="h-2.5 w-2.5"/> Temp.</p>
                                                    <p className="font-black text-sm">{stat.bookingsCount || 0}</p>
                                                </div>
                                                <div className="space-y-0.5 border-x px-2 text-center sm:text-left">
                                                    <p className="text-[9px] uppercase font-bold text-muted-foreground flex items-center justify-center sm:justify-start gap-1"><ClipboardList className="h-2.5 w-2.5"/> Anu.</p>
                                                    <p className="font-black text-sm">{stat.contratosCount || 0}</p>
                                                </div>
                                                <div className="space-y-0.5 text-center sm:text-left">
                                                    <p className="text-[9px] uppercase font-bold text-muted-foreground flex items-center justify-center sm:justify-start gap-1"><Tag className="h-2.5 w-2.5"/> {t('monitor.stats.total').split(' ')[0]}</p>
                                                    <p className="font-black text-sm">{(stat.bookingsCount || 0) + (stat.contratosCount || 0)}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="p-2 px-4 justify-between bg-muted/10">
                                            <span className="text-[9px] font-mono opacity-40 uppercase truncate max-w-[100px]">ID: {stat.orgId}</span>
                                            <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> {formatDate(stat.lastActivity)}
                                            </span>
                                        </CardFooter>
                                    </Card>
                                );
                            }) : (
                                <p className="text-center py-12 text-muted-foreground italic">{t('liquidations.history.no_liquidations')}</p>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <TableHead className="font-bold">Dueño / Organización</TableHead>
                                        <TableHead className="text-center">Prop.</TableHead>
                                        <TableHead className="text-center">Inq.</TableHead>
                                        <TableHead className="text-center">Res.</TableHead>
                                        <TableHead className="text-center">Anu.</TableHead>
                                        <TableHead className="text-center">Equipo</TableHead>
                                        <TableHead className="text-right">{t('monitor.org_detail.last_activity')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {initialStats.length > 0 ? initialStats.map((stat) => (
                                        <TableRow key={stat.orgId} className="hover:bg-primary/5 transition-colors">
                                            <TableCell className="max-w-[200px]">
                                                <p className="font-bold text-sm truncate">{stat.ownerName}</p>
                                                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <Mail className="h-2.5 w-2.5" /> {stat.ownerEmail}
                                                </p>
                                                <p className="text-[9px] font-mono opacity-40 mt-0.5 truncate">{stat.orgId}</p>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className={cn(stat.propertiesCount > 0 ? "border-primary text-primary" : "opacity-30")}>
                                                    {stat.propertiesCount}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className={cn(stat.tenantsCount > 0 ? "border-blue-500 text-blue-700" : "opacity-30")}>
                                                    {stat.tenantsCount}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={cn("text-xs font-bold", stat.bookingsCount === 0 && "opacity-30")}>
                                                    {stat.bookingsCount}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={cn("text-xs font-bold", stat.contratosCount === 0 && "opacity-30")}>
                                                    {stat.contratosCount}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Users className={cn("h-3 w-3", stat.teamCount > 0 ? "text-purple-600" : "opacity-20")} />
                                                    <span className={cn("text-xs font-bold", stat.teamCount === 0 && "opacity-30")}>
                                                        {stat.teamCount}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right text-[11px] font-medium text-muted-foreground">
                                                {formatDate(stat.lastActivity)}
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic">
                                                No hay datos registrados. Pulsa "Sincronizar" para iniciar.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800 font-bold uppercase text-[10px] tracking-widest">{t('monitor.alerts.info_title')}</AlertTitle>
                    <AlertDescription className="text-xs text-blue-700">
                        {t('monitor.alerts.info_desc')}
                    </AlertDescription>
                </Alert>
                <Alert variant="destructive" className="bg-orange-50 border-orange-200 text-orange-800">
                    <ShieldCheck className="h-4 w-4 text-orange-600" />
                    <AlertTitle className="text-orange-800 font-bold uppercase text-[10px] tracking-widest">{t('monitor.alerts.privacy_title')}</AlertTitle>
                    <AlertDescription className="text-xs text-orange-700">
                        {t('monitor.alerts.privacy_desc')}
                    </AlertDescription>
                </Alert>
            </div>
        </div>
    );
}
