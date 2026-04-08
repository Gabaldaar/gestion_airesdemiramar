
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Provider, Property, TaskScope, WorkLog, ManualAdjustment, getPendingWorkLogs, getPendingManualAdjustments, LiquidationWithProvider } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Pencil } from 'lucide-react';
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
import useWindowSize from '@/hooks/use-window-size';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = parseDateSafely(dateString);
    if (!date) return 'Fecha Inválida';
    return format(date, "dd-LLL-yy", { locale: es });
};

const formatCurrency = (amount: number, currency: 'ARS' | 'USD') => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
};


function WorkLogCard({ log, onEdit, onDelete, onSelectionChange, isSelected }: {
    log: WorkLog & { assignmentName?: string };
    onEdit: (log: WorkLog) => void;
    onDelete: (log: WorkLog) => void;
    onSelectionChange: (checked: boolean) => void;
    isSelected: boolean;
}) {
    return (
        <Card className={cn(isSelected && 'border-primary ring-2 ring-primary')}>
            <CardHeader className="p-4 flex flex-row items-start gap-4">
                <Checkbox
                    className="mt-1"
                    checked={isSelected}
                    onCheckedChange={onSelectionChange}
                />
                <div className="flex-1">
                    <CardTitle className="text-base">
                        {log.assignmentName || 'N/A'}
                    </CardTitle>
                    <CardDescription>{formatDate(log.date)}</CardDescription>
                </div>
                 <div className="text-right">
                    <p className="font-bold text-lg text-primary">{formatCurrency(log.calculatedCost, log.costCurrency)}</p>
                </div>
            </CardHeader>
            <CardContent className="px-4 pb-2 text-sm">
                <p>{log.description}</p>
                 <p className="text-muted-foreground text-xs mt-1">({log.quantity} {log.activityType === 'hourly' ? 'hs' : 'visita(s)'} a {formatCurrency(log.rateApplied, log.costCurrency)})</p>
            </CardContent>
            <CardFooter className="p-2 justify-end">
                <Button variant="ghost" size="icon" onClick={() => onEdit(log)}><Pencil className="h-4 w-4" /></Button>
                <WorkLogDeleteForm workLogId={log.id} onActionComplete={() => onDelete(log)} />
            </CardFooter>
        </Card>
    )
}

function ManualAdjustmentCard({ adj, onEdit, onDelete, onSelectionChange, isSelected }: {
    adj: ManualAdjustment & { assignmentName?: string };
    onEdit: (adj: ManualAdjustment) => void;
    onDelete: (adj: ManualAdjustment) => void;
    onSelectionChange: (checked: boolean) => void;
    isSelected: boolean;
}) {
    return (
        <Card className={cn(isSelected && 'border-primary ring-2 ring-primary')}>
             <CardHeader className="p-4 flex flex-row items-start gap-4">
                <Checkbox
                    className="mt-1"
                    checked={isSelected}
                    onCheckedChange={onSelectionChange}
                />
                <div className="flex-1">
                    <CardTitle className="text-base">
                        {adj.assignmentName || 'N/A'}
                    </CardTitle>
                    <CardDescription>{formatDate(adj.date)}</CardDescription>
                </div>
                 <div className="text-right">
                    <p className={cn("font-bold text-lg", adj.amount < 0 ? 'text-destructive' : 'text-primary')}>{formatCurrency(adj.amount, adj.currency)}</p>
                </div>
            </CardHeader>
            <CardContent className="px-4 pb-2 text-sm">
                <p>{adj.description}</p>
            </CardContent>
            <CardFooter className="p-2 justify-end">
                <Button variant="ghost" size="icon" onClick={() => onEdit(adj)}><Pencil className="h-4 w-4" /></Button>
                <ManualAdjustmentDeleteForm adjustmentId={adj.id} onActionComplete={() => onDelete(adj)} />
            </CardFooter>
        </Card>
    );
}

export default function LiquidationsClient({ providers, properties, scopes, liquidations, onDataNeedsRefresh }: { 
    providers: Provider[], 
    properties: Property[], 
    scopes: TaskScope[],
    liquidations: LiquidationWithProvider[],
    onDataNeedsRefresh: () => void;
}) {
    const [selectedProviderId, setSelectedProviderId] = useState<string>('');
    const [providerData, setProviderData] = useState<{ workLogs: WorkLog[], adjustments: ManualAdjustment[] } | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(false);
    
    // Form states
    const [isWorkLogFormOpen, setIsWorkLogFormOpen] = useState(false);
    const [isAdjustmentFormOpen, setIsAdjustmentFormOpen] = useState(false);
    const [editingWorkLog, setEditingWorkLog] = useState<WorkLog | undefined>(undefined);
    const [isWorkLogEditOpen, setIsWorkLogEditOpen] = useState(false);
    const [editingAdjustment, setEditingAdjustment] = useState<ManualAdjustment | undefined>(undefined);
    const [isAdjustmentEditOpen, setIsAdjustmentEditOpen] = useState(false);

    const [selectedWorkLogIds, setSelectedWorkLogIds] = useState<string[]>([]);
    const [selectedAdjustmentIds, setSelectedAdjustmentIds] = useState<string[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { width } = useWindowSize();
    const isMobile = width ? width < 768 : false;

    const fetchProviderData = useCallback(async (providerId: string) => {
        if (!providerId) {
            setProviderData(null);
            return;
        }
        setIsLoadingData(true);
        try {
            const [workLogs, adjustments] = await Promise.all([
                getPendingWorkLogs(providerId),
                getPendingManualAdjustments(providerId),
            ]);
            setProviderData({ workLogs, adjustments });
        } catch (error) {
            console.error("Error fetching provider data:", error);
            setProviderData(null);
            toast({
                title: "Error al cargar datos",
                description: "No se pudieron obtener las actividades pendientes. Revisa la consola para más detalles.",
                variant: "destructive"
            });
        } finally {
            setIsLoadingData(false);
        }
    }, [toast]);

    useEffect(() => {
        if(selectedProviderId) {
            fetchProviderData(selectedProviderId);
        }
        setSelectedWorkLogIds([]);
        setSelectedAdjustmentIds([]);
    }, [selectedProviderId, fetchProviderData]);

    const handleDataChange = useCallback(() => {
        if (selectedProviderId) {
            fetchProviderData(selectedProviderId);
        }
        onDataNeedsRefresh();
    }, [selectedProviderId, fetchProviderData, onDataNeedsRefresh]);
    
    const handleEditWorkLog = (log: WorkLog) => {
        setEditingWorkLog(log);
        setIsWorkLogEditOpen(true);
    };

    const handleEditAdjustment = (adj: ManualAdjustment) => {
        setEditingAdjustment(adj);
        setIsAdjustmentEditOpen(true);
    };

    const liquidationProviders = useMemo(() => providers.filter(p => p.managementType === 'liquidations'), [providers]);

    const selectedProvider = useMemo(() => providers.find(p => p.id === selectedProviderId), [providers, selectedProviderId]);

    const canRegisterActivity = useMemo(() => {
        if (!selectedProvider || !selectedProvider.billingType) return false;
        return selectedProvider.billingType !== 'other';
    }, [selectedProvider]);

    const { totalToLiquidate, currency, canLiquidate } = useMemo(() => {
        let total = 0;
        const currencies = new Set<string>();

        selectedWorkLogIds.forEach(id => {
            const item = providerData?.workLogs.find(w => w.id === id);
            if (item) {
                total += item.calculatedCost;
                currencies.add(item.costCurrency);
            }
        });

        selectedAdjustmentIds.forEach(id => {
            const item = providerData?.adjustments.find(a => a.id === id);
            if (item) {
                total += item.amount;
                currencies.add(item.currency);
            }
        });

        if (currencies.size > 1) {
            return { totalToLiquidate: 0, currency: 'Monedas Mixtas', canLiquidate: false };
        }

        return {
            totalToLiquidate: total,
            currency: currencies.values().next().value || null,
            canLiquidate: currencies.size <= 1 && (selectedWorkLogIds.length > 0 || selectedAdjustmentIds.length > 0)
        };
    }, [selectedWorkLogIds, selectedAdjustmentIds, providerData]);

    const handleGenerateLiquidation = async () => {
        if (!canLiquidate || !currency) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pueden mezclar diferentes monedas en una misma liquidación.' });
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('providerId', selectedProviderId);
        formData.append('currency', currency);
        selectedWorkLogIds.forEach(id => formData.append('workLogIds', id));
        selectedAdjustmentIds.forEach(id => formData.append('adjustmentIds', id));

        const result = await generateLiquidation({ success: false, message: '' }, formData);
        
        toast({
            title: result.success ? 'Éxito' : 'Error',
            description: result.message,
            variant: result.success ? 'default' : 'destructive'
        });

        if (result.success) {
            handleDataChange();
            setSelectedWorkLogIds([]);
            setSelectedAdjustmentIds([]);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Selección de Colaborador</CardTitle>
                </CardHeader>
                <CardContent>
                    <Label htmlFor="provider-select">Colaborador</Label>
                    <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                        <SelectTrigger id="provider-select">
                            <SelectValue placeholder="Selecciona un colaborador..." />
                        </SelectTrigger>
                        <SelectContent>
                            {liquidationProviders.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pending">Pendientes</TabsTrigger>
                    <TabsTrigger value="history">Historial</TabsTrigger>
                </TabsList>
                <TabsContent value="pending">
                    {selectedProvider ? (
                        <>
                            <div className="flex flex-col sm:flex-row justify-end gap-2 my-4">
                                <ManualAdjustmentAddForm provider={selectedProvider} properties={properties} scopes={scopes} isOpen={isAdjustmentFormOpen} onOpenChange={setIsAdjustmentFormOpen} onActionComplete={handleDataChange} />
                                <WorkLogAddForm provider={selectedProvider} properties={properties} scopes={scopes} isOpen={isWorkLogFormOpen} onOpenChange={setIsWorkLogFormOpen} onActionComplete={handleDataChange} />
                                <Button className="w-full sm:w-auto" variant="outline" onClick={() => setIsAdjustmentFormOpen(true)}><PlusCircle className="mr-2 h-4 w-4"/> Registrar Ajuste</Button>
                                <Button className="w-full sm:w-auto" onClick={() => setIsWorkLogFormOpen(true)} disabled={!canRegisterActivity}><PlusCircle className="mr-2 h-4 w-4"/> Registrar Actividad</Button>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Actividades y Ajustes Pendientes</CardTitle>
                                    <CardDescription>
                                        Selecciona los ítems que deseas incluir en la próxima liquidación para {selectedProvider.name}. 
                                        El total se calculará automáticamente.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {isLoadingData ? <div className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></div> : (
                                        <>
                                            <div>
                                                <h4 className="font-semibold mb-2">Horas y Visitas</h4>
                                                 {isMobile ? (
                                                    <div className="space-y-2">
                                                        {providerData?.workLogs.map(log => (
                                                            <WorkLogCard key={log.id} log={log} onEdit={handleEditWorkLog} onDelete={handleDataChange} onSelectionChange={(checked) => setSelectedWorkLogIds(prev => checked ? [...prev, log.id] : prev.filter(id => id !== log.id))} isSelected={selectedWorkLogIds.includes(log.id)} />
                                                        ))}
                                                        {providerData?.workLogs.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No hay actividades pendientes.</p>}
                                                    </div>
                                                ) : (
                                                    <div className="border rounded-lg">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead className="w-10"><Checkbox onCheckedChange={(checked) => setSelectedWorkLogIds(checked ? providerData?.workLogs.map(w => w.id) || [] : [])} checked={providerData?.workLogs.length ? selectedWorkLogIds.length === providerData.workLogs.length : false} /></TableHead>
                                                                    <TableHead>Fecha</TableHead>
                                                                    <TableHead>Asignación</TableHead>
                                                                    <TableHead>Descripción</TableHead>
                                                                    <TableHead className="text-right">Costo</TableHead>
                                                                    <TableHead className="text-right">Acciones</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {providerData?.workLogs.map(log => (
                                                                    <TableRow key={log.id}>
                                                                        <TableCell><Checkbox checked={selectedWorkLogIds.includes(log.id)} onCheckedChange={(checked) => setSelectedWorkLogIds(prev => checked ? [...prev, log.id] : prev.filter(id => id !== log.id))} /></TableCell>
                                                                        <TableCell>{formatDate(log.date)}</TableCell>
                                                                        <TableCell>{(log as any).assignmentName || 'N/A'}</TableCell>
                                                                        <TableCell>{log.description}</TableCell>
                                                                        <TableCell className="text-right font-medium">{formatCurrency(log.calculatedCost, log.costCurrency)}</TableCell>
                                                                        <TableCell className="text-right">
                                                                            <div className="flex items-center justify-end">
                                                                                <Button variant="ghost" size="icon" onClick={() => handleEditWorkLog(log)}><Pencil className="h-4 w-4" /></Button>
                                                                                <WorkLogDeleteForm workLogId={log.id} onActionComplete={handleDataChange} />
                                                                            </div>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                                {providerData?.workLogs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No hay actividades pendientes.</TableCell></TableRow>}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold mb-2">Ajustes Manuales (Bonos, Adelantos, etc.)</h4>
                                                 {isMobile ? (
                                                    <div className="space-y-2">
                                                        {providerData?.adjustments.map(adj => (
                                                            <ManualAdjustmentCard key={adj.id} adj={adj} onEdit={handleEditAdjustment} onDelete={handleDataChange} onSelectionChange={(checked) => setSelectedAdjustmentIds(prev => checked ? [...prev, adj.id] : prev.filter(id => id !== adj.id))} isSelected={selectedAdjustmentIds.includes(adj.id)} />
                                                        ))}
                                                        {providerData?.adjustments.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No hay ajustes pendientes.</p>}
                                                    </div>
                                                ) : (
                                                    <div className="border rounded-lg">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead className="w-10"><Checkbox onCheckedChange={(checked) => setSelectedAdjustmentIds(checked ? providerData?.adjustments.map(a => a.id) || [] : [])} checked={providerData?.adjustments.length ? selectedAdjustmentIds.length === providerData.adjustments.length : false} /></TableHead>
                                                                    <TableHead>Fecha</TableHead>
                                                                    <TableHead>Descripción</TableHead>
                                                                    <TableHead>Imputado a</TableHead>
                                                                    <TableHead className="text-right">Monto</TableHead>
                                                                    <TableHead className="text-right">Acciones</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {providerData?.adjustments.map(adj => (
                                                                    <TableRow key={adj.id}>
                                                                        <TableCell><Checkbox checked={selectedAdjustmentIds.includes(adj.id)} onCheckedChange={(checked) => setSelectedAdjustmentIds(prev => checked ? [...prev, adj.id] : prev.filter(id => id !== adj.id))} /></TableCell>
                                                                        <TableCell>{formatDate(adj.date)}</TableCell>
                                                                        <TableCell>{adj.description}</TableCell>
                                                                        <TableCell>{(adj as any).assignmentName || 'N/A'}</TableCell>
                                                                        <TableCell className={`text-right font-medium ${adj.amount < 0 ? 'text-red-500' : ''}`}>{formatCurrency(adj.amount, adj.currency)}</TableCell>
                                                                        <TableCell className="text-right">
                                                                            <div className="flex items-center justify-end">
                                                                                <Button variant="ghost" size="icon" onClick={() => handleEditAdjustment(adj)}><Pencil className="h-4 w-4" /></Button>
                                                                                <ManualAdjustmentDeleteForm adjustmentId={adj.id} onActionComplete={handleDataChange} />
                                                                            </div>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                                {providerData?.adjustments.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No hay ajustes pendientes.</TableCell></TableRow>}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                                {(selectedWorkLogIds.length > 0 || selectedAdjustmentIds.length > 0) && (
                                    <CardFooter className="flex-col items-end gap-4 border-t pt-4">
                                        <div className="text-right">
                                            <p className="text-muted-foreground">Total a liquidar</p>
                                            <p className="text-2xl font-bold">{canLiquidate && currency ? formatCurrency(totalToLiquidate, currency) : 'Monedas Mixtas'}</p>
                                        </div>
                                        <Button onClick={handleGenerateLiquidation} disabled={!canLiquidate || isSubmitting}>
                                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Procesando...</> : "Generar Liquidación"}
                                        </Button>
                                    </CardFooter>
                                )}
                            </Card>
                        </>
                    ) : (
                        <Card className="mt-4">
                            <CardContent>
                                <p className="text-center text-muted-foreground p-8">Selecciona un colaborador para ver sus actividades pendientes.</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
                <TabsContent value="history">
                     <Card>
                        <CardHeader>
                            <CardTitle>Historial de Liquidaciones</CardTitle>
                            <CardDescription>Consulta las liquidaciones generadas previamente. Haz clic en una para ver el detalle.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <LiquidationsHistoryList 
                                liquidations={liquidations} 
                                properties={properties} 
                                scopes={scopes} 
                                onDataRefreshed={onDataNeedsRefresh}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            {editingWorkLog && selectedProvider && <WorkLogEditForm provider={selectedProvider} properties={properties} scopes={scopes} workLog={editingWorkLog} isOpen={isWorkLogEditOpen} onOpenChange={setIsWorkLogEditOpen} onActionComplete={handleDataChange} />}
            {editingAdjustment && selectedProvider && <ManualAdjustmentEditForm provider={selectedProvider} properties={properties} scopes={scopes} adjustment={editingAdjustment} isOpen={isAdjustmentEditOpen} onOpenChange={setIsAdjustmentEditOpen} onActionComplete={handleDataChange} />}
        </div>
    );
}
