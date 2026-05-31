
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Property, BookingWithDetails, OwnerLiquidation, getPropertiesByOwnerEmail, getBookingsByPropertyId, getOwnerLiquidationsByPropertyId, Tenant, Payment, Expense, BrandingSettings } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Home, ScrollText, Clock, ShieldCheck, Calendar, MapPin, Notebook, ChevronRight, CheckCircle, AlertTriangle, FileDown, Info } from 'lucide-react';
import { format, startOfToday } from 'date-fns';
import { es, enUS, ptBR } from 'date-fns/locale';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn, parseDateSafely } from '@/lib/utils';
import { useTranslation } from '@/i18n/useTranslation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { collection, getDocs, query, where, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from './ui/table';
import Image from 'next/image';

const locales: Record<string, any> = { es, en: enUS, pt: ptBR };

const formatCurrency = (amount: number, currency: string) => {
    try {
        return new Intl.NumberFormat('es-AR', { 
            style: 'currency', 
            currency, 
            maximumFractionDigits: 0 
        }).format(amount);
    } catch(e) {
        return `${currency} ${amount.toFixed(0)}`;
    }
};

export default function OwnerDashboard() {
    const { user, appUser, orgId, loading: authLoading } = useAuth();
    const { t, language } = useTranslation();
    const currentLocale = locales[language] || es;

    const [properties, setProperties] = useState<Property[]>([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
    const [propertyData, setPropertyData] = useState<{ bookings: BookingWithDetails[], liquidations: OwnerLiquidation[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [branding, setBranding] = useState<BrandingSettings | null>(null);
    
    const [selectedLiq, setSelectedLiq] = useState<OwnerLiquidation | null>(null);
    const [liqItems, setLiqItems] = useState<{ payments: Payment[], expenses: Expense[] } | null>(null);
    const [isLoadingLiqItems, setIsLoadingLiqItems] = useState(false);

    const today = useMemo(() => startOfToday(), []);

    const userEmail = useMemo(() => {
        const email = (user?.email || user?.providerData[0]?.email || appUser?.email || '').toLowerCase().trim();
        return email;
    }, [user, appUser]);

    useEffect(() => {
        if (orgId) {
            const unsubBranding = onSnapshot(doc(db, 'settings', `branding_${orgId}`), (snap) => {
                if (snap.exists()) setBranding(snap.data() as BrandingSettings);
            });
            return () => unsubBranding();
        }
    }, [orgId]);

    const fetchProperties = useCallback(async () => {
        if (!userEmail) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const props = await getPropertiesByOwnerEmail(userEmail);
            setProperties(props);
            if (props.length > 0) {
                setSelectedPropertyId(props[0].id);
            }
        } catch (error) {
            console.error("Error fetching owner properties:", error);
        } finally {
            setIsLoading(false);
        }
    }, [userEmail]);

    const fetchPropertyDetails = useCallback(async (id: string) => {
        if (!id) {
            setIsLoadingDetails(false);
            return;
        }
        setIsLoadingDetails(true);
        try {
            const targetProperty = properties.find(p => p.id === id);
            const currentOrgId = targetProperty?.orgId || orgId || 'global';

            const [bookings, liquidations] = await Promise.all([
                getBookingsByPropertyId(id, currentOrgId),
                getOwnerLiquidationsByPropertyId(id, currentOrgId)
            ]);
            
            const enrichedBookings = bookings.map(b => ({
                ...b,
                tenant: { name: t('owner_portal.status.confirmed') } as Tenant 
            })) as any;

            setPropertyData({ 
                bookings: enrichedBookings, 
                liquidations: liquidations.sort((a, b) => (b.dateGenerated || '').localeCompare(a.dateGenerated || '')) 
            });
        } catch (error) {
            console.error("Error fetching property details:", error);
        } finally {
            setIsLoadingDetails(false);
        }
    }, [t, properties, orgId]);

    useEffect(() => {
        if (!authLoading && userEmail) {
            fetchProperties();
        } else if (!authLoading && !userEmail) {
            setIsLoading(false);
        }
    }, [fetchProperties, authLoading, userEmail]);

    useEffect(() => {
        if (selectedPropertyId) {
            fetchPropertyDetails(selectedPropertyId);
        } else if (!isLoading) {
            setIsLoadingDetails(false);
        }
    }, [selectedPropertyId, fetchPropertyDetails, isLoading]);

    const fetchLiquidationItems = async (liq: OwnerLiquidation) => {
        setIsLoadingLiqItems(true);
        try {
            const pQuery = query(collection(db, 'payments'), where('ownerLiquidationId', '==', liq.id));
            const eQuery = query(collection(db, 'expenses'), where('ownerLiquidationId', '==', liq.id));
            const [pSnaps, eSnaps] = await Promise.all([getDocs(pQuery), getDocs(eQuery)]);
            
            setLiqItems({
                payments: pSnaps.docs.map(d => ({ id: d.id, ...d.data() } as Payment)),
                expenses: eSnaps.docs.map(d => ({ id: d.id, ...d.data() } as Expense))
            });
        } catch (error) {
            console.error("Error fetching items:", error);
        } finally {
            setIsLoadingLiqItems(false);
        }
    };

    const handleLiqClick = (liq: OwnerLiquidation) => {
        setSelectedLiq(liq);
        fetchLiquidationItems(liq);
    };

    if (authLoading || isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center p-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (properties.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 sm:p-12 max-w-2xl mx-auto">
                <h2 className="text-2xl font-black text-primary tracking-tight">{t('owner_portal.no_properties_title')}</h2>
                <p className="text-muted-foreground mt-4 text-sm sm:text-base">
                    {t('owner_portal.no_properties_desc')}
                </p>
                <div className="mt-8 w-full p-4 bg-muted/50 rounded-xl border border-dashed text-left">
                    <p className="font-mono text-primary font-bold break-all bg-background p-3 rounded-lg border text-sm">
                        {userEmail || '(Email no detectado)'}
                    </p>
                </div>
            </div>
        );
    }

    const currentProperty = properties.find(p => p.id === selectedPropertyId);
    const ownerFirstName = user?.displayName?.split(' ')[0] || appUser?.name?.split(' ')[0] || 'Propietario';

    return (
        <div className="w-full space-y-8 animate-in fade-in duration-500 pb-20">
            <header className="flex flex-col gap-1 border-b pb-6">
                <h2 className="text-lg font-bold text-primary/80 uppercase tracking-tighter">
                    {t('owner_portal.welcome').replace('{{name}}', ownerFirstName)}
                </h2>
                <h1 className="text-2xl sm:text-4xl font-black text-primary tracking-tight">
                    {t('owner_portal.title')}
                </h1>
            </header>

            <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary border-l-4 border-primary pl-3">
                    {t('owner_portal.units_label')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {properties.map(p => (
                        <button 
                            key={p.id}
                            onClick={() => setSelectedPropertyId(p.id)}
                            className={cn(
                                "text-left p-5 rounded-2xl border-2 transition-all",
                                selectedPropertyId === p.id 
                                    ? "border-primary bg-primary/5 shadow-lg" 
                                    : "border-zinc-200 bg-white hover:bg-zinc-50"
                                )}
                        >
                            <p className="font-black truncate text-base">{p.name}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate mt-1">
                                <MapPin className="h-3 w-3 inline mr-1" /> {p.address}
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            {currentProperty && (
                <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="grid grid-cols-4 w-full bg-zinc-100/80 p-1 rounded-2xl">
                        <TabsTrigger value="summary" className="py-3 font-bold">{t('owner_portal.tabs.summary')}</TabsTrigger>
                        <TabsTrigger value="occupancy" className="py-3 font-bold">{t('owner_portal.tabs.occupancy')}</TabsTrigger>
                        <TabsTrigger value="finances" className="py-3 font-bold">{t('owner_portal.tabs.finances')}</TabsTrigger>
                        <TabsTrigger value="info" className="py-3 font-bold">{t('owner_portal.tabs.info')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="summary" className="space-y-6 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-l-4 border-l-primary shadow-md">
                                <CardHeader className="pb-3 bg-muted/20">
                                    <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-primary" /> {t('owner_portal.sections.next_bookings')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 p-5">
                                    {isLoadingDetails ? (
                                        <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                                    ) : (
                                        <>
                                            {propertyData?.bookings.filter(b => (parseDateSafely(b.startDate) || new Date()) >= today).slice(0, 3).map(b => (
                                                <div key={b.id} className="flex justify-between items-center p-4 rounded-xl bg-muted/30 border border-muted">
                                                    <p className="font-bold text-sm">{t('common.from')} {format(parseDateSafely(b.startDate) || new Date(), 'dd/MM')} {t('common.to')} {format(parseDateSafely(b.endDate) || new Date(), 'dd/MM')}</p>
                                                    <Badge variant="secondary" className="bg-background text-[10px]">{t('owner_portal.status.ok')}</Badge>
                                                </div>
                                            ))}
                                            {propertyData?.bookings.filter(b => (parseDateSafely(b.startDate) || new Date()) >= today).length === 0 && (
                                                <p className="text-center py-8 text-xs text-muted-foreground italic">{t('owner_portal.messages.no_movements')}</p>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-green-600 shadow-md">
                                <CardHeader className="pb-3 bg-muted/20">
                                    <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <ScrollText className="h-4 w-4 text-green-600" /> {t('owner_portal.sections.recent_liquidations')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 p-5">
                                    {isLoadingDetails ? (
                                        <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                                    ) : (
                                        <>
                                            {propertyData?.liquidations.slice(0, 3).map(liq => (
                                                <div key={liq.id} className="flex justify-between items-center p-4 rounded-xl border-2 bg-green-50/50 border-green-200 cursor-pointer hover:bg-green-100/50" onClick={() => handleLiqClick(liq)}>
                                                    <div className="space-y-0.5">
                                                        <p className="font-bold text-sm">{format(parseDateSafely(liq.dateGenerated) || new Date(), 'dd/MM/yyyy')}</p>
                                                        <p className="text-[10px] uppercase font-black opacity-60">{t('owner_portal.labels.net')}: {formatCurrency(liq.netToOwner, liq.currency)}</p>
                                                    </div>
                                                    <ChevronRight className="h-5 w-5 opacity-40" />
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="occupancy" className="pt-4">
                        <Card className="shadow-lg border-zinc-200">
                            <CardHeader>
                                <CardTitle>{t('owner_portal.sections.occupancy_history')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isLoadingDetails ? <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {propertyData?.bookings.sort((a,b) => (b.startDate || '').localeCompare(a.startDate || '')).map(b => (
                                            <div key={b.id} className="flex justify-between items-center p-6 rounded-2xl border-2 bg-primary/5 border-primary/60 shadow-sm">
                                                <p className="font-black text-primary">{format(parseDateSafely(b.startDate) || new Date(), 'dd MMM yyyy', { locale: currentLocale })} — {format(parseDateSafely(b.endDate) || new Date(), 'dd MMM yyyy', { locale: currentLocale })}</p>
                                                <Badge className="uppercase font-black text-[10px]">{t('owner_portal.status.confirmed')}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="finances" className="pt-4">
                         <Card className="shadow-lg border-zinc-200">
                            <CardHeader>
                                <CardTitle>{t('owner_portal.sections.liquidations_made')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {propertyData?.liquidations.map(liq => (
                                        <Card key={liq.id} className="overflow-hidden border-2 transition-all hover:shadow-xl cursor-pointer" onClick={() => handleLiqClick(liq)}>
                                            <CardHeader className="p-4 border-b bg-green-600/10 flex flex-row justify-between items-center space-y-0">
                                                <CardTitle className="text-sm font-black uppercase">{format(parseDateSafely(liq.dateGenerated) || new Date(), "dd MMM, yyyy", { locale: currentLocale })}</CardTitle>
                                                <Badge className="bg-green-600">{t('owner_portal.status.paid')}</Badge>
                                            </CardHeader>
                                            <CardContent className="p-6 space-y-4">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground font-bold">{t('owner_portal.labels.invoiced')}:</span>
                                                    <span className="font-bold text-green-700">+{formatCurrency(liq.totalIncome, liq.currency)}</span>
                                                </div>
                                                <div className="flex justify-between items-baseline pt-4 border-t-2 border-dashed">
                                                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('owner_portal.labels.net')}</span>
                                                    <span className="text-2xl font-black text-primary">{formatCurrency(liq.netToOwner, liq.currency)}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="info" className="pt-4">
                        <Card className="shadow-lg border-zinc-200">
                             <CardHeader>
                                <CardTitle>{t('owner_portal.sections.property_info')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {currentProperty.ownerNotes && (
                                    <div className="p-5 rounded-3xl border-2 border-dashed bg-primary/5 border-primary/20 space-y-4">
                                        <h4 className="font-black text-sm uppercase tracking-widest text-primary flex items-center gap-2"><Notebook className="h-4 w-4"/> {t('owner_portal.labels.admin_notes')}</h4>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{currentProperty.ownerNotes}</p>
                                    </div>
                                )}
                                <div className="p-5 rounded-3xl border-2 bg-muted/30 flex items-center gap-6">
                                    <Home className="h-8 w-8 text-primary" />
                                    <div>
                                        <p className="font-black text-xl text-primary">{currentProperty.name}</p>
                                        <p className="text-sm text-muted-foreground">{currentProperty.address}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}

            {selectedLiq && (
                <Dialog open={!!selectedLiq} onOpenChange={(open) => !open && setSelectedLiq(null)}>
                    <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black uppercase tracking-tight text-primary">{t('owner_portal.labels.liq_summary')}</DialogTitle>
                            <DialogDescription>
                                {t('owner_portal.labels.period')}: {format(parseDateSafely(selectedLiq.periodFrom)!, 'dd/MM/yyyy')} al {format(parseDateSafely(selectedLiq.periodTo)!, 'dd/MM/yyyy')}
                            </DialogDescription>
                        </DialogHeader>

                        {isLoadingLiqItems ? (
                            <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                        ) : liqItems && (
                            <div className="space-y-8 py-4">
                                <Table>
                                    <TableHeader><TableRow><TableHead>{t('owner_portal.labels.date')}</TableHead><TableHead>{t('common.description')}</TableHead><TableHead className="text-right">{t('bookings.table.amount')}</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {liqItems.payments.map(p => (
                                            <TableRow key={p.id} className="text-xs"><TableCell>{format(parseDateSafely(p.date)!, 'dd/MM/yy')}</TableCell><TableCell className="font-medium">{p.description}</TableCell><TableCell className="text-right font-bold text-green-700">+{formatCurrency(p.amount, selectedLiq.currency)}</TableCell></TableRow>
                                        ))}
                                        {liqItems.expenses.map(e => (
                                            <TableRow key={e.id} className="text-xs"><TableCell>{format(parseDateSafely(e.date)!, 'dd/MM/yy')}</TableCell><TableCell className="font-medium">{e.description}</TableCell><TableCell className="text-right font-bold text-red-600">-{formatCurrency(e.originalUsdAmount || e.amount, selectedLiq.currency)}</TableCell></TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                <div className="p-6 bg-primary/5 rounded-2xl border-2 border-primary/20 flex justify-between items-center">
                                    <span className="text-xs font-black uppercase tracking-widest text-primary">{t('owner_portal.labels.net_transfer')}</span>
                                    <span className="text-3xl font-black text-primary">{formatCurrency(selectedLiq.netToOwner, selectedLiq.currency)}</span>
                                </div>
                            </div>
                        )}

                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setSelectedLiq(null)}>{t('common.close')}</Button>
                            <Button className="font-bold" onClick={() => window.open(`/owner-liquidations/${selectedLiq!.id}/print`, '_blank')}>
                                <FileDown className="mr-2 h-4 w-4" /> {t('owner_portal.labels.recibo_pdf')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
