'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Provider, Property, TaskScope, LiquidationWithProvider, WorkLogWithDetails, ManualAdjustmentWithDetails } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Loader2, PlusCircle, Pencil, Info, Trash2, Calendar as CalendarIcon, Clock, Banknote, Tag, History } from 'lucide-react';
import { WorkLogAddForm } from './worklog-add-form';
import { ManualAdjustmentAddForm } from './manual-adjustment-add-form';
import { Checkbox } from './ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateLiquidation } from '@/lib/actions';
import { useToast } from './ui/use-toast';
import { parseDateSafely, cn } from '@/lib/utils';
import { WorkLogEditForm } from './worklog-edit-form';
import { ManualAdjustmentEditForm } from './manual-adjustment-edit-form';
import { WorkLogDeleteForm } from './worklog-delete-form';
import { ManualAdjustmentDeleteForm } from './manual-adjustment-delete-form';
import { LiquidationsHistoryList } from './liquidations-history-list';
import { format } from 'date-fns';
import { es, enUS, ptBR } from 'date-fns/locale';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { ProviderAdminNoteEditor } from './provider-admin-note-editor';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTranslation } from '@/i18n/useTranslation';
import useWindowSize from '@/hooks/use-window-size';
import { useAuth } from './auth-provider';

const locales: Record<string, any> = { es, en: enUS, pt: ptBR };

const formatDate = (dateString: string | null | undefined, currentLocale: any) => {
    if (!dateString) return 'N/A';
    const date = parseDateSafely(dateString);
    if (!date) return 'Fecha Inválida';
    return format(date, "dd-LLL-yy", { locale: currentLocale });
};

const formatCurrency = (amount: number, currency: string) => {
    try {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
    } catch(e) {
        return `${currency} ${amount.toFixed(2)}`;
    }
};

export default function LiquidationsClient({ providers, properties, scopes, liquidations, onDataNeedsRefresh }: { 
    providers: Provider[], 
    properties: Property[], 
    scopes: TaskScope[],
    liquidations: LiquidationWithProvider[],
    onDataNeedsRefresh: () => void;
}) {
    const { orgId } = useAuth();
    const { t, language } = useTranslation();
    const currentLocale = locales[language] || es;
    const { width } = useWindowSize();
    const useCardView = typeof width === 'number' ? width < 1024 : false;
    
    const [selectedProviderId, setSelectedProviderId] = useState<string>('');
    const [providerData, setProviderData] = useState<{ workLogs: WorkLogWithDetails[], adjustments: ManualAdjustmentWithDetails[] } | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(false);
    
    const [isWorkLogFormOpen, setIsWorkLogFormOpen] = useState(false);
    const [isAdjustmentFormOpen, setIsAdjustmentFormOpen] = useState(false);
    
    const [editingWorkLog, setEditingWorkLog] = useState<WorkLogWithDetails | null>(null);
    const [editingAdjustment, setEditingAdjustment] = useState<ManualAdjustmentWithDetails | null>(null);
    const [deletingWorkLog, setDeletingWorkLog] = useState<WorkLogWithDetails | null>(null);
    const [deletingAdjustment, setDeletingAdjustment] = useState<ManualAdjustmentWithDetails | null>(null);

    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
    const [selectedAdjustmentIds, setSelectedAdjustmentIds] = useState<string[]>([]);
    const [previousBalance, setPreviousBalance] = useState(0);
    const [providerBalances, setProviderBalances] = useState<Record<string, number>>({});

    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const fetchProviderData = useCallback(async (providerId: string) => {
        if (!providerId) {
            setProviderData(null);
            return;
        }
        setIsLoadingData(true);
        try {
            const currentOrgId = orgId || 'global';
            const logsSnap = await getDocs(query(collection(db, 'workLogs'), where('orgId', '==', currentOrgId), where('providerId', '==', providerId), where('status', '==', 'pending_liquidation')));
            const adjsSnap = await getDocs(query(collection(db, 'manualAdjustments'), where('orgId', '==', currentOrgId), where('providerId', '==', providerId), where('status', '==', 'pending_liquidation')));
            
            let adjCatsSnap = await getDocs(collection(db, 'adjustment_categories'));
            if (adjCatsSnap.empty) {
                adjCatsSnap = await getDocs(collection(db, 'adjustmentCategories'));
            }

            const adjCatsMap = new Map(adjCatsSnap.docs.map((d: any) => [d.id, d.data().name]));
            const propsMap = new Map(properties.map((p: Property) => [p.id, p.name]));
            const scopesMap = new Map(scopes.map((s: TaskScope) => [s.id, s.name]));

            const workLogs = logsSnap.docs.map((d: any) => {
                const log = { id: d.id, ...d.data() } as any;
                const type = log.assignment?.type;
                const aid = log.assignment?.id;
                const assignmentName = type === 'property' ? propsMap.get(aid) : scopesMap.get(aid);
                return { ...log, assignmentName: assignmentName || 'N/A' };
            }).sort((a, b) => (parseDateSafely(a.date)?.getTime() || 0) - (parseDateSafely(b.date)?.getTime() || 0));

            const adjustments = adjsSnap.docs.map((d: any) => {
                const adj = { id: d.id, ...d.data() } as any;
                const type = adj.assignment?.type;
                const aid = adj.assignment?.id;
                const assignmentName = type === 'property' ? propsMap.get(aid) : scopesMap.get(aid);
                return { ...adj, categoryName: adjCatsMap.get(adj.categoryId) || 'Ajuste', assignmentName: assignmentName || 'N/A' };
            }).sort((a, b) => (parseDateSafely(a.date)?.getTime() || 0) - (parseDateSafely(b.date)?.getTime() || 0));

            setProviderData({ workLogs, adjustments });

            // Fetch latest balances for Account Status
            const q = query(collection(db, 'liquidations'), where('orgId', '==', currentOrgId), where('providerId', '==', providerId));
            const liqSnap = await getDocs(q);
            const latestByCurrency: Record<string, any> = {};
            liqSnap.docs.forEach(d => {
                const data = d.data();
                const cur = data.currency;
                const date = data.dateGenerated;
                if (!latestByCurrency[cur] || date > latestByCurrency[cur].dateGenerated) {
                    latestByCurrency[cur] = data;
                }
            });
            const balances: Record<string, number> = {};
            Object.keys(latestByCurrency).forEach(cur => {
                balances[cur] = latestByCurrency[cur].balance;
            });
            setProviderBalances(balances);

        } catch (error) {
            console.error("Error fetching provider data:", error);
            setProviderData(null);
            toast({ title: t('common.error'), description: "No se pudieron obtener las actividades.", variant: "destructive" });
        } finally {
            setIsLoadingData(false);
        }
    }, [toast, properties, scopes, t, orgId]);

    useEffect(() => {
        if(selectedProviderId) fetchProviderData(selectedProviderId);
        setSelectedTaskIds([]);
        setSelectedAdjustmentIds([]);
        setPreviousBalance(0);
    }, [selectedProviderId, fetchProviderData]);

    const handleDataChange = useCallback(() => {
        if (selectedProviderId) fetchProviderData(selectedProviderId);
        onDataNeedsRefresh();
    }, [selectedProviderId, fetchProviderData, onDataNeedsRefresh]);
    
    const liquidationProviders = useMemo(() => providers.filter((p: Provider) => p.managementType === 'liquidations'), [providers]);
    const selectedProvider = useMemo(() => providers.find((p: Provider) => p.id === selectedProviderId), [providers, selectedProviderId]);

    const canRegisterActivity = useMemo(() => {
        if (!selectedProvider || !selectedProvider.billingType) return false;
        return selectedProvider.billingType !== 'other';
    }, [selectedProvider]);

    // Calculate Real Total Balance (Liquidation Arrastre + All Pending Items)
    const realBalances = useMemo(() => {
        const balances: Record<string, { liquidation: number, pending: number, total: number }> = {};
        
        // 1. Initial liquidation balances
        Object.entries(providerBalances).forEach(([cur, bal]) => {
            balances[cur] = { liquidation: bal, pending: 0, total: bal };
        });

        // 2. Pending work logs
        providerData?.workLogs.forEach(log => {
            const cur = log.costCurrency;
            if (!balances[cur]) balances[cur] = { liquidation: 0, pending: 0, total: 0 };
            balances[cur].pending += log.calculatedCost;
            balances[cur].total += log.calculatedCost;
        });

        // 3. Pending adjustments
        providerData?.adjustments.forEach(adj => {
            const cur = adj.currency;
            if (!balances[cur]) balances[cur] = { liquidation: 0, pending: 0, total: 0 };
            balances[cur].pending += adj.amount;
            balances[cur].total += adj.amount;
        });

        return balances;
    }, [providerBalances, providerData]);

    const { subtotalItems, currency, canLiquidate } = useMemo(() => {
        let total = 0;
        const usedCurrencies = new Set<string>();
        selectedTaskIds.forEach((id: string) => {
            const item = providerData?.workLogs.find((w: WorkLogWithDetails) => w.id === id);
            if (item) { total += item.calculatedCost; usedCurrencies.add(item.costCurrency); }
        });
        selectedAdjustmentIds.forEach((id: string) => {
            const item = providerData?.adjustments.find((a: ManualAdjustmentWithDetails) => a.id === id);
            if (item) { total += item.amount; usedCurrencies.add(item.currency); }
        });
        if (usedCurrencies.size > 1) return { subtotalItems: 0, currency: 'MIXED' as const, canLiquidate: false };
        const singleCurrency = Array.from(usedCurrencies)[0] || null;
        return { subtotalItems: total, currency: singleCurrency, canLiquidate: (selectedTaskIds.length > 0 || selectedAdjustmentIds.length > 0) };
    }, [selectedTaskIds, selectedAdjustmentIds, providerData]);

    useEffect(() => {
        const fetchCarryover = async () => {
            if (!selectedProviderId || !currency || currency === 'MIXED' || !orgId) {
                setPreviousBalance(0);
                return;
            }
            
            try {
                const q = query(
                    collection(db, 'liquidations'),
                    where('orgId', '==', orgId),
                    where('providerId', '==', selectedProviderId),
                    where('currency', '==', currency)
                );
                const snap = await getDocs(q);
                if (!snap.empty) {
                    const sortedDocs = snap.docs.sort((a, b) => {
                        const dateA = a.data().dateGenerated || '';
                        const dateB = b.data().dateGenerated || '';
                        return dateB.localeCompare(dateA); 
                    });
                    setPreviousBalance(sortedDocs[0].data().balance || 0);
                } else {
                    setPreviousBalance(0);
                }
            } catch (e) {
                console.error("Error fetching carryover balance:", e);
                setPreviousBalance(0);
            }
        };

        fetchCarryover();
    }, [selectedProviderId, currency, orgId]);

    const totalToLiquidate = subtotalItems + previousBalance;

    const handleGenerateLiquidation = async () => {
        if (!canLiquidate || !currency || currency === 'MIXED') {
            toast({ variant: 'destructive', title: t('common.error'), description: 'No se pueden mezclar monedas en una misma liquidación.' });
            return;
        }
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('orgId', orgId || '');
        formData.append('providerId', selectedProviderId);
        formData.append('currency', currency);
        selectedTaskIds.forEach(id => formData.append('workLogIds', id));
        selectedAdjustmentIds.forEach(id => formData.append('adjustmentIds', id));
        const result = await generateLiquidation({ success: false, message: '' }, formData);
        toast({ title: result.success ? t('common.success') : t('common.error'), description: result.message, variant: result.success ? 'default' : 'destructive' });
        if (result.success) { handleDataChange(); setSelectedTaskIds([]); setSelectedAdjustmentIds([]); }
        setIsSubmitting(false);
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader><CardTitle>{t('liquidations.provider_selection')}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <Label htmlFor="provider-select">{t('liquidations.provider_label')}</Label>
                            <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                                <SelectTrigger id="provider-select"><SelectValue placeholder={t('liquidations.provider_placeholder')} /></SelectTrigger>
                                <SelectContent>{liquidationProviders.map((p: Provider) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    {selectedProvider && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Alert variant="default" className="border-blue-500 text-blue-800 dark:border-blue-400 dark:text-blue-300 [&>svg]:text-blue-500 h-fit">
                                <Info className="h-4 w-4" />
                                <div className="flex justify-between items-start w-full">
                                    <div><AlertTitle className="font-semibold">{t('liquidations.admin_note')}</AlertTitle><AlertDescription className="whitespace-pre-wrap">{selectedProvider.adminNote || t('liquidations.no_admin_notes')}</AlertDescription></div>
                                    <ProviderAdminNoteEditor provider={selectedProvider} onActionComplete={handleDataChange} />
                                </div>
                            </Alert>
                            <Card className="bg-muted/30 border-dashed">
                                <CardHeader className="p-4 pb-2 py-3 px-4">
                                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <Banknote className="h-4 w-4" />
                                        {t('liquidations.current_balance_title')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-2">
                                    {Object.keys(realBalances).length > 0 ? (
                                        <div className="space-y-4">
                                            {Object.entries(realBalances).map(([cur, data]) => (
                                                <div key={cur} className="border-b last:border-0 pb-3 last:pb-0 space-y-1">
                                                    <div className="flex justify-between items-baseline">
                                                        <span className="text-[10px] uppercase font-black text-primary">{t('liquidations.balance_real_total')} ({cur})</span>
                                                        <span className={cn("text-xl font-black", data.total > 0.01 ? "text-orange-600" : "text-green-700")}>
                                                            {formatCurrency(data.total, cur)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                                        <span className="flex items-center gap-1"><History className="h-3 w-3"/> {t('liquidations.summary.previous_balance')}: {formatCurrency(data.liquidation, cur)}</span>
                                                        <span className="flex items-center gap-1"><Tag className="h-3 w-3"/> {t('liquidations.pending_to_liquidate')}: {formatCurrency(data.pending, cur)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground italic">{t('liquidations.history.no_liquidations')}</p>
                                    )}
                                    <p className="text-[9px] text-muted-foreground mt-3 italic leading-tight">{t('liquidations.current_balance_desc')}</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pending">{t('liquidations.tabs.pending')}</TabsTrigger>
                    <TabsTrigger value="history">{t('liquidations.tabs.history')}</TabsTrigger>
                </TabsList>
                <TabsContent value="pending">
                    {selectedProvider ? (
                        <>
                            <div className="flex flex-col sm:flex-row justify-end gap-2 my-4">
                                <Button className="w-full sm:w-auto" variant="outline" onClick={() => setIsAdjustmentFormOpen(true)}><PlusCircle className="mr-2 h-4 w-4"/> {t('liquidations.actions.add_adjustment')}</Button>
                                <Button className="w-full sm:w-auto" onClick={() => setIsWorkLogFormOpen(true)} disabled={!canRegisterActivity}><PlusCircle className="mr-2 h-4 w-4"/> {t('liquidations.actions.add_activity')}</Button>
                            </div>
                            <Card>
                                <CardHeader><CardTitle>{t('liquidations.pending_items.title')}</CardTitle><CardDescription>{t('liquidations.pending_items.description')}</CardDescription></CardHeader>
                                <CardContent className="space-y-6">
                                    {isLoadingData ? <div className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></div> : (
                                        <>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between border-b pb-2">
                                                    <h4 className="font-bold text-sm uppercase tracking-wider text-blue-700 flex items-center gap-2">
                                                    <Clock className="h-4 w-4" /> {t('liquidations.pending_items.hours_visits')}
                                                    </h4>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] uppercase font-bold text-muted-foreground">{t('common.all')}</span>
                                                        <Checkbox 
                                                            checked={providerData?.workLogs && providerData.workLogs.length > 0 && selectedTaskIds.length === providerData.workLogs.length}
                                                            onCheckedChange={(checked) => setSelectedTaskIds(checked ? providerData?.workLogs.map(w => w.id) || [] : [])}
                                                        />
                                                    </div>
                                                </div>
                                                
                                                {useCardView ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {providerData?.workLogs.map((log: WorkLogWithDetails) => (
                                                            <Card key={log.id} className="overflow-hidden border shadow-sm">
                                                                <CardHeader className={cn("p-3 py-2 bg-blue-50/50 flex flex-row items-center justify-between space-y-0")}>
                                                                    <div className="flex items-center gap-3">
                                                                        <Checkbox 
                                                                            checked={selectedTaskIds.includes(log.id)} 
                                                                            onCheckedChange={(checked) => setSelectedTaskIds(prev => checked ? [...prev, log.id] : prev.filter(id => id !== log.id))} 
                                                                        />
                                                                        <div className="min-w-0">
                                                                            <p className="font-bold text-blue-700 truncate text-sm">{log.assignmentName}</p>
                                                                            <p className="text-[10px] font-medium flex items-center gap-1 opacity-70"><CalendarIcon className="h-3 w-3"/> {formatDate(log.date, currentLocale)}</p>
                                                                        </div>
                                                                    </div>
                                                                    <Badge variant="outline" className="text-[10px] font-bold uppercase h-5 bg-background">
                                                                        {log.activityType === 'hourly' ? t('liquidations.activity_types.hours') : t('liquidations.activity_types.visit')}
                                                                    </Badge>
                                                                </CardHeader>
                                                                <CardContent className="p-3 space-y-2 text-sm">
                                                                    <p className="font-medium text-xs leading-tight line-clamp-2">{log.description || '(Sin descripción)'}</p>
                                                                    <div className="flex justify-between items-end border-t pt-2 mt-1">
                                                                        <div className="text-[10px] text-muted-foreground">
                                                                            <p>{log.quantity} {log.activityType === 'hourly' ? t('liquidations.activity_types.hours').toLowerCase() : t('liquidations.activity_types.visit').toLowerCase()} x {formatCurrency(log.rateApplied, log.costCurrency)}</p>
                                                                        </div>
                                                                        <p className="font-black text-primary text-base">{formatCurrency(log.calculatedCost, log.costCurrency)}</p>
                                                                    </div>
                                                                </CardContent>
                                                                <CardFooter className="p-2 px-3 justify-end border-t bg-muted/30 gap-1">
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingWorkLog(log)}><Pencil className="h-4 w-4"/></Button>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingWorkLog(log)}><Trash2 className="h-4 w-4"/></Button>
                                                                </CardFooter>
                                                            </Card>
                                                        ))}
                                                        {(!providerData?.workLogs || providerData.workLogs.length === 0) && <p className="text-xs text-muted-foreground italic p-4 text-center col-span-full">{t('liquidations.pending_items.no_items')}</p>}
                                                    </div>
                                                ) : (
                                                    <div className="border rounded-lg overflow-x-auto">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead className="w-10"><Checkbox onCheckedChange={(checked) => setSelectedTaskIds(checked ? providerData?.workLogs.map((w: WorkLogWithDetails) => w.id) || [] : [])} checked={providerData?.workLogs.length ? selectedTaskIds.length === providerData.workLogs.length : false} /></TableHead>
                                                                    <TableHead>{t('common.date')}</TableHead>
                                                                    <TableHead>{t('tasks.table.assignment')}</TableHead>
                                                                    <TableHead>{t('common.description')}</TableHead>
                                                                    <TableHead className="text-right">{t('contratos.fee_amount')}</TableHead>
                                                                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {providerData?.workLogs.map((log: WorkLogWithDetails) => (
                                                                    <TableRow key={log.id}>
                                                                        <TableCell><Checkbox checked={selectedTaskIds.includes(log.id)} onCheckedChange={(checked) => setSelectedTaskIds(prev => checked ? [...prev, log.id] : prev.filter(id => id !== log.id))} /></TableCell>
                                                                        <TableCell>{formatDate(log.date, currentLocale)}</TableCell>
                                                                        <TableCell>{log.assignmentName}</TableCell>
                                                                        <TableCell>{log.description || '-'}</TableCell>
                                                                        <TableCell className="text-right font-medium">{formatCurrency(log.calculatedCost, log.costCurrency)}</TableCell>
                                                                        <TableCell className="text-right">
                                                                            <div className="flex gap-1 justify-end">
                                                                                <Button variant="ghost" size="icon" onClick={() => setEditingWorkLog(log)}><Pencil className="h-4 w-4"/></Button>
                                                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletingWorkLog(log)}><Trash2 className="h-4 w-4"/></Button>
                                                                            </div>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between border-b pb-2">
                                                    <h4 className="font-bold text-sm uppercase tracking-wider text-orange-700 flex items-center gap-2">
                                                        <Tag className="h-4 w-4" /> {t('liquidations.pending_items.manual_adjustments')}
                                                    </h4>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] uppercase font-bold text-muted-foreground">{t('common.all')}</span>
                                                        <Checkbox 
                                                            checked={providerData?.adjustments && providerData.adjustments.length > 0 && selectedAdjustmentIds.length === providerData.adjustments.length}
                                                            onCheckedChange={(checked) => setSelectedAdjustmentIds(checked ? providerData?.adjustments.map(a => a.id) || [] : [])}
                                                        />
                                                    </div>
                                                </div>
                                                
                                                {useCardView ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {providerData?.adjustments.map((adj: ManualAdjustmentWithDetails) => (
                                                            <Card key={adj.id} className="overflow-hidden border shadow-sm">
                                                                <CardHeader className={cn("p-3 py-2 bg-orange-50/50 flex flex-row items-center justify-between space-y-0")}>
                                                                    <div className="flex items-center gap-3">
                                                                        <Checkbox 
                                                                            checked={selectedAdjustmentIds.includes(adj.id)} 
                                                                            onCheckedChange={(checked) => setSelectedAdjustmentIds(prev => checked ? [...prev, adj.id] : prev.filter(id => id !== adj.id))} 
                                                                        />
                                                                        <div className="min-w-0">
                                                                            <p className="font-bold text-orange-700 truncate text-sm">{adj.categoryName}</p>
                                                                            <p className="text-[10px] font-medium flex items-center gap-1 opacity-70"><CalendarIcon className="h-3 w-3"/> {formatDate(adj.date, currentLocale)}</p>
                                                                        </div>
                                                                    </div>
                                                                    <Badge variant="outline" className="text-[10px] font-bold uppercase h-5 bg-background">
                                                                        {adj.amount < 0 ? t('liquidations.adjustment_types.deduction') : t('liquidations.adjustment_types.addition')}
                                                                    </Badge>
                                                                </CardHeader>
                                                                <CardContent className="p-3 space-y-2 text-sm">
                                                                    <div className="flex justify-between items-start gap-2">
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3"/> {t('liquidations.card_labels.imputed_to')}</p>
                                                                            <p className="font-medium text-xs truncate">{adj.assignmentName}</p>
                                                                        </div>
                                                                        <p className={cn("font-black text-base", adj.amount < 0 ? 'text-red-600' : 'text-primary')}>
                                                                            {formatCurrency(adj.amount, adj.currency)}
                                                                        </p>
                                                                    </div>
                                                                    {adj.notes && (
                                                                        <div className="bg-muted/50 p-2 rounded text-[11px] italic">
                                                                            {adj.notes}
                                                                        </div>
                                                                    )}
                                                                </CardContent>
                                                                <CardFooter className="p-2 px-3 justify-end border-t bg-muted/30 gap-1">
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingAdjustment(adj)}><Pencil className="h-4 w-4"/></Button>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingAdjustment(adj)}><Trash2 className="h-4 w-4"/></Button>
                                                                </CardFooter>
                                                            </Card>
                                                        ))}
                                                        {(!providerData?.adjustments || providerData.adjustments.length === 0) && <p className="text-xs text-muted-foreground italic p-4 text-center col-span-full">{t('liquidations.pending_items.no_items')}</p>}
                                                    </div>
                                                ) : (
                                                    <div className="border rounded-lg overflow-x-auto">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead className="w-10"><Checkbox onCheckedChange={(checked) => setSelectedAdjustmentIds(checked ? providerData?.adjustments.map((a: ManualAdjustmentWithDetails) => a.id) || [] : [])} checked={providerData?.adjustments.length ? selectedAdjustmentIds.length === providerData.adjustments.length : false} /></TableHead>
                                                                    <TableHead>{t('common.date')}</TableHead>
                                                                    <TableHead>{t('common.category')}</TableHead>
                                                                    <TableHead>{t('tasks.table.assignment')}</TableHead>
                                                                    <TableHead className="text-right">{t('contratos.fee_amount')}</TableHead>
                                                                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {providerData?.adjustments.map((adj: ManualAdjustmentWithDetails) => (
                                                                    <TableRow key={adj.id}>
                                                                        <TableCell><Checkbox checked={selectedAdjustmentIds.includes(adj.id)} onCheckedChange={(checked) => setSelectedAdjustmentIds(prev => checked ? [...prev, adj.id] : prev.filter(id => id !== adj.id))} /></TableCell>
                                                                        <TableCell>{formatDate(adj.date, currentLocale)}</TableCell>
                                                                        <TableCell>{adj.categoryName}</TableCell>
                                                                        <TableCell>{adj.assignmentName}</TableCell>
                                                                        <TableCell className={cn("text-right font-medium", adj.amount < 0 && 'text-red-500')}>{formatCurrency(adj.amount, adj.currency)}</TableCell>
                                                                        <TableCell className="text-right">
                                                                            <div className="flex gap-1 justify-end">
                                                                                <Button variant="ghost" size="icon" onClick={() => setEditingAdjustment(adj)}><Pencil className="h-4 w-4"/></Button>
                                                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletingAdjustment(adj)}><Trash2 className="h-4 w-4"/></Button>
                                                                            </div>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                                {(selectedTaskIds.length > 0 || selectedAdjustmentIds.length > 0 || previousBalance !== 0) && (
                                    <CardFooter className="flex flex-col sm:flex-row items-center sm:items-end sm:justify-end gap-6 border-t pt-6 bg-muted/20">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-right flex-grow sm:flex-grow-0">
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{t('liquidations.summary.subtotal_items')}</p>
                                                <p className="text-lg font-bold">{canLiquidate && currency !== 'MIXED' ? formatCurrency(subtotalItems, currency!) : '-'}</p>
                                            </div>
                                            <div className={cn(previousBalance === 0 && "opacity-40")}>
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center justify-center sm:justify-end gap-1">
                                                    <History className="h-3 w-3" /> {t('liquidations.summary.previous_balance')}
                                                </p>
                                                <p className={cn("text-lg font-bold", previousBalance < 0 ? 'text-red-600' : previousBalance > 0 ? 'text-green-600' : '')}>
                                                    {canLiquidate && currency !== 'MIXED' ? formatCurrency(previousBalance, currency!) : '-'}
                                                </p>
                                            </div>
                                            <div className="sm:border-l sm:pl-6">
                                                <p className="text-[10px] uppercase font-black text-primary tracking-widest">{t('liquidations.summary.total_to_liquidate')}</p>
                                                <p className="text-3xl font-black text-primary">
                                                    {canLiquidate && currency !== 'MIXED' ? formatCurrency(totalToLiquidate, currency!) : t('liquidations.summary.mixed_currencies')}
                                                </p>
                                            </div>
                                        </div>
                                        <Button size="lg" className="w-full sm:w-auto px-10 font-bold" onClick={handleGenerateLiquidation} disabled={!canLiquidate || isSubmitting}>
                                            {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : t('liquidations.summary.generate_button')}
                                        </Button>
                                    </CardFooter>
                                )}
                            </Card>
                        </>
                    ) : (
                        <Card className="mt-4"><CardContent className="p-8 text-center text-muted-foreground">{t('liquidations.provider_placeholder')}</CardContent></Card>
                    )}
                </TabsContent>
                <TabsContent value="history">
                    <LiquidationsHistoryList liquidations={liquidations} properties={properties} scopes={scopes} onDataRefreshed={handleDataChange} />
                </TabsContent>
            </Tabs>
            
            {selectedProvider && (
                <>
                    <WorkLogAddForm provider={selectedProvider} properties={properties} scopes={scopes} isOpen={isWorkLogFormOpen} onOpenChange={setIsWorkLogFormOpen} onActionComplete={handleDataChange} />
                    <ManualAdjustmentAddForm provider={selectedProvider} properties={properties} scopes={scopes} isOpen={isAdjustmentFormOpen} onOpenChange={setIsAdjustmentFormOpen} onActionComplete={handleDataChange} />
                </>
            )}
            
            {editingWorkLog && (
                <WorkLogEditForm 
                    provider={selectedProvider!} 
                    properties={properties} 
                    scopes={scopes} 
                    workLog={editingWorkLog} 
                    isOpen={!!editingWorkLog} 
                    onOpenChange={(o: boolean) => !o && setEditingWorkLog(null)} 
                    onActionComplete={handleDataChange} 
                />
            )}
            
            {editingAdjustment && (
                <ManualAdjustmentEditForm 
                    provider={selectedProvider!} 
                    properties={properties} 
                    scopes={scopes} 
                    adjustment={editingAdjustment} 
                    isOpen={!!editingAdjustment} 
                    onOpenChange={(o: boolean) => !o && setEditingAdjustment(null)} 
                    onActionComplete={handleDataChange} 
                />
            )}
            
            {deletingWorkLog && (
                <WorkLogDeleteForm 
                    workLogId={deletingWorkLog.id} 
                    isOpen={!!deletingWorkLog} 
                    onOpenChange={(o: boolean) => !o && setDeletingWorkLog(null)} 
                    onActionComplete={handleDataChange} 
                />
            )}
            
            {deletingAdjustment && (
                <ManualAdjustmentDeleteForm 
                    adjustmentId={deletingAdjustment.id} 
                    isOpen={!!deletingAdjustment} 
                    onOpenChange={(o: boolean) => !o && setDeletingAdjustment(null)} 
                    onActionComplete={handleDataChange} 
                />
            )}
        </div>
    );
}
