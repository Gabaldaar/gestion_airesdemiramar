'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './auth-provider';
import { useTranslation } from '@/i18n/useTranslation';
import { Button } from './ui/button';
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle, 
    CardFooter 
} from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
    Download, 
    Upload, 
    Loader2, 
    AlertTriangle, 
    CheckCircle2, 
    Info, 
    FileJson,
    ShieldAlert,
    Trash2,
    RefreshCw
} from 'lucide-react';
import { useToast } from './ui/use-toast';
import { 
    collection, 
    getDocs, 
    writeBatch, 
    doc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle 
} from './ui/dialog';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle,
    AlertDialogTrigger
} from './ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { cn } from '@/lib/utils';
import { Checkbox } from './ui/checkbox';
import { purgeOrphanedRecords, clearOrganizationData } from '@/lib/actions';

interface BackupData {
    version: string;
    orgId: string;
    timestamp: string;
    collections: Record<string, any[]>;
}

const COLLECTION_LABELS: Record<string, string> = {
    'properties': 'navigation.properties',
    'tenants': 'navigation.tenants',
    'providers': 'navigation.providers',
    'origins': 'settings.tabs.origins',
    'expense_categories': 'settings.tabs.expense_categories',
    'task_categories': 'settings.tabs.task_categories',
    'provider_categories': 'settings.tabs.provider_categories',
    'adjustment_categories': 'settings.tabs.adjustment_categories',
    'task_scopes': 'settings.tabs.task_scopes',
    'email_templates': 'settings.tabs.templates',
    'bookings': 'navigation.bookings',
    'contratos': 'navigation.contracts',
    'tasks': 'navigation.tasks',
    'payments': 'navigation.payments',
    'expenses': 'navigation.expenses',
    'date_blocks': 'bookings.tabs.blocks',
    'periodosPago': 'contratos.payment_plan',
    'workLogs': 'liquidations.pending_items.hours_visits',
    'manualAdjustments': 'liquidations.pending_items.manual_adjustments',
    'liquidations': 'navigation.liquidations',
    'owner_liquidations': 'owner_liquidations.title'
};

const DEPENDENCIES: Record<string, string[]> = {
    'bookings': ['properties', 'tenants', 'origins'],
    'contratos': ['properties', 'tenants'],
    'periodosPago': ['contratos', 'properties'],
    'tasks': ['properties', 'task_scopes', 'providers', 'task_categories'],
    'payments': ['bookings', 'contratos', 'properties'],
    'expenses': ['properties', 'task_scopes', 'providers', 'expense_categories'],
    'liquidations': ['providers'],
    'owner_liquidations': ['properties'],
    'workLogs': ['providers', 'properties', 'task_scopes'],
    'manualAdjustments': ['providers', 'adjustment_categories', 'properties', 'task_scopes'],
    'date_blocks': ['properties']
};

export function DataManager({ onDataChanged }: { onDataChanged: () => void }) {
    const { orgId } = useAuth();
    const { t } = useTranslation();
    const { toast } = useToast();
    
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isPurging, setIsPurging] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    
    const [importData, setImportData] = useState<BackupData | null>(null);
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    const [exportSelection, setExportSelection] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        Object.keys(COLLECTION_LABELS).forEach(k => initial[k] = true);
        return initial;
    });

    const [importSelection, setImportSelection] = useState<Record<string, boolean>>({});

    const handleToggleExport = (colName: string, checked: boolean) => {
        setExportSelection(prev => {
            const next = { ...prev, [colName]: checked };
            if (checked && DEPENDENCIES[colName]) {
                DEPENDENCIES[colName].forEach(parent => {
                    next[parent] = true;
                });
            }
            if (!checked) {
                Object.keys(DEPENDENCIES).forEach(childKey => {
                    if (DEPENDENCIES[childKey].includes(colName)) {
                        next[childKey] = false;
                    }
                });
            }
            return next;
        });
    };

    const handleToggleImport = (colName: string, checked: boolean) => {
        setImportSelection(prev => {
            const next = { ...prev, [colName]: checked };
            if (checked && DEPENDENCIES[colName]) {
                DEPENDENCIES[colName].forEach(parent => {
                    if (importData?.collections[parent]) {
                        next[parent] = true;
                    }
                });
            }
            if (!checked) {
                Object.keys(DEPENDENCIES).forEach(childKey => {
                    if (DEPENDENCIES[childKey].includes(colName)) {
                        next[childKey] = false;
                    }
                });
            }
            return next;
        });
    };

    const handleExport = async () => {
        if (!orgId) return;
        setIsExporting(true);
        try {
            const backup: BackupData = {
                version: '1.1.0',
                orgId: orgId,
                timestamp: new Date().toISOString(),
                collections: {}
            };

            const selectedCols = Object.keys(exportSelection).filter(k => exportSelection[k]);

            for (const colName of selectedCols) {
                const snap = await getDocs(collection(db, colName));
                const items = snap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter((item: any) => {
                        const itemOrgId = item.orgId || 'global';
                        return itemOrgId === orgId;
                    });
                
                if (items.length > 0) {
                    backup.collections[colName] = items;
                }
            }

            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `regentum_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({ title: t('common.success'), description: "Backup generado con éxito." });
        } catch (error) {
            console.error("Export error:", error);
            toast({ variant: 'destructive', title: t('common.error'), description: "Error al exportar datos." });
        } finally {
            setIsExporting(false);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                if (!data.collections) throw new Error("Formato inválido");
                
                const initialImport: Record<string, boolean> = {};
                Object.keys(data.collections).forEach(k => initialImport[k] = true);
                
                setImportData(data);
                setImportSelection(initialImport);
                setShowImportDialog(true);
            } catch (err) {
                toast({ variant: 'destructive', title: t('common.error'), description: "El archivo no tiene un formato de backup válido." });
            } finally {
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    const executeImport = async () => {
        if (!importData || !orgId) return;
        setIsImporting(true);
        setShowImportDialog(false);

        try {
            const idMap: Record<string, string> = {};
            const processedCollections: Record<string, any[]> = {};
            
            const selectedCols = Object.keys(importSelection).filter(k => importSelection[k]);

            for (const colName of selectedCols) {
                const items = importData.collections[colName] || [];
                processedCollections[colName] = items.map(item => {
                    const oldId = item.id;
                    const newId = doc(collection(db, colName)).id;
                    idMap[oldId] = newId;
                    
                    const cleaned = { ...item };
                    delete cleaned.id;
                    
                    if (cleaned.imageUrl) cleaned.imageUrl = '';
                    if (cleaned.contractSignatureUrl) cleaned.contractSignatureUrl = '';
                    if (cleaned.tenantSignatureUrl) cleaned.tenantSignatureUrl = '';
                    
                    cleaned.orgId = orgId; 
                    return { newId, data: cleaned };
                });
            }

            const refFields = [
                'tenantId', 'propertyId', 'originId', 'categoryId', 
                'providerId', 'bookingId', 'contratoId', 'taskId', 
                'liquidationId', 'ownerLiquidationId', 'periodoPagoId'
            ];

            for (const colName of selectedCols) {
                processedCollections[colName]?.forEach(obj => {
                    refFields.forEach(field => {
                        if (obj.data[field] && idMap[obj.data[field]]) {
                            obj.data[field] = idMap[obj.data[field]];
                        }
                    });
                    if (obj.data.assignment?.id && idMap[obj.data.assignment.id]) {
                        obj.data.assignment.id = idMap[obj.data.assignment.id];
                    }
                });
            }

            let batch = writeBatch(db);
            let count = 0;

            for (const colName of selectedCols) {
                const items = processedCollections[colName] || [];
                for (const obj of items) {
                    const ref = doc(db, colName, obj.newId);
                    batch.set(ref, obj.data);
                    count++;

                    if (count === 450) { 
                        await batch.commit();
                        batch = writeBatch(db);
                        count = 0;
                    }
                }
            }
            
            if (count > 0) await batch.commit();

            toast({ title: t('common.success'), description: t('settings.data.import_success') });
            onDataChanged();
        } catch (error) {
            console.error("Import error:", error);
            toast({ variant: 'destructive', title: t('common.error'), description: "Error durante la importación de datos." });
        } finally {
            setIsImporting(false);
            setImportData(null);
        }
    };

    const handlePurgeOrphans = async () => {
        if (!orgId) return;
        setIsPurging(true);
        const result = await purgeOrphanedRecords({ success: false, message: "" }, orgId);
        toast({ 
            title: result.success ? t('common.success') : t('common.error'), 
            description: result.message,
            variant: result.success ? "default" : "destructive"
        });
        if (result.success) onDataChanged();
        setIsPurging(false);
    };

    const handleClearAll = async () => {
        if (!orgId || confirmText !== "VACIAR") return;
        setIsClearing(true);
        const result = await clearOrganizationData({ success: false, message: "" }, orgId);
        toast({ title: t('common.success'), description: result.message });
        if (result.success) onDataChanged();
        setIsClearing(false);
        setConfirmText("");
    };

    const renderCollectionItem = (key: string, count: number, isSelected: boolean, onToggle: (val: boolean) => void) => {
        const label = t(COLLECTION_LABELS[key] || key);
        const isParent = !DEPENDENCIES[key];
        
        return (
            <div key={key} className={cn(
                "flex items-center justify-between p-2 rounded-lg transition-colors border",
                isSelected ? "bg-primary/5 border-primary/20" : "bg-muted/20 border-transparent opacity-60",
                !isParent && "ml-4 border-l-2"
            )}>
                <div className="flex items-center gap-3">
                    <Checkbox 
                        id={`check-${key}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => onToggle(!!checked)}
                    />
                    <Label htmlFor={`check-${key}`} className="cursor-pointer text-xs font-bold truncate max-w-[150px]">
                        {label}
                    </Label>
                </div>
                <div className="text-[10px] px-1.5 py-0.5 rounded-full border bg-background font-bold text-muted-foreground">{count}</div>
            </div>
        );
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-500 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-2 border-primary/10 shadow-md flex flex-col">
                    <CardHeader className="bg-primary/5 pb-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Download className="h-5 w-5 text-primary" />
                            </div>
                            <CardTitle className="text-lg">{t('settings.data.export_title')}</CardTitle>
                        </div>
                        <CardDescription>{t('settings.data.export_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 flex-1 space-y-6">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('settings.data.export_selection_title')}</Label>
                                <div className="flex gap-2">
                                    <Button variant="link" size="sm" className="h-auto p-0 text-[10px] uppercase font-bold" onClick={() => {
                                        const next: any = {};
                                        Object.keys(COLLECTION_LABELS).forEach(k => next[k] = true);
                                        setExportSelection(next);
                                    }}>Marcar todo</Button>
                                    <Button variant="link" size="sm" className="h-auto p-0 text-[10px] uppercase font-bold" onClick={() => {
                                        const next: any = {};
                                        Object.keys(COLLECTION_LABELS).forEach(k => next[k] = false);
                                        setExportSelection(next);
                                    }}>Limpiar</Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                {Object.keys(COLLECTION_LABELS).map(key => (
                                    <div key={key} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-transparent hover:border-primary/20 transition-colors">
                                        <Checkbox 
                                            id={`export-${key}`}
                                            checked={exportSelection[key]}
                                            onCheckedChange={(checked) => handleToggleExport(key, !!checked)}
                                        />
                                        <Label htmlFor={`export-${key}`} className="text-xs font-bold cursor-pointer flex-1">{t(COLLECTION_LABELS[key] || key)}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <Alert className="bg-amber-50 border-amber-200">
                            <Info className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-[10px] text-amber-800 leading-tight">
                                {t('settings.data.export_hint')}
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter className="pt-4 border-t bg-muted/10">
                        <Button 
                            onClick={handleExport} 
                            disabled={isExporting || !Object.values(exportSelection).some(v => v)} 
                            className="w-full h-12 font-bold uppercase text-[10px] tracking-widest shadow-lg"
                        >
                            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileJson className="mr-2 h-4 w-4" />}
                            {t('settings.data.export_button')}
                        </Button>
                    </CardFooter>
                </Card>

                <div className="space-y-8">
                    <Card className="border-2 border-orange-500/20 shadow-md flex flex-col">
                        <CardHeader className="bg-orange-50/5 pb-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-orange-500/10 rounded-lg">
                                    <Upload className="h-5 w-5 text-orange-600" />
                                </div>
                                <CardTitle className="text-lg">{t('settings.data.import_title')}</CardTitle>
                            </div>
                            <CardDescription>{t('settings.data.import_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <AlertTitle className="text-xs font-black uppercase tracking-widest">¡Atención!</AlertTitle>
                                <AlertDescription className="text-xs">
                                    {t('settings.data.import_hint')}
                                </AlertDescription>
                            </Alert>
                            
                            <div className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-3xl bg-muted/20 hover:bg-muted/40 transition-colors group cursor-pointer h-40 overflow-hidden">
                                <input 
                                    type="file" 
                                    accept=".json" 
                                    onChange={handleFileSelect} 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                                    id="import-file" 
                                    disabled={isImporting}
                                />
                                <div className="flex flex-col items-center gap-3 text-center pointer-events-none group-hover:scale-105 transition-transform">
                                    <div className="p-4 bg-background rounded-full shadow-md group-hover:shadow-lg">
                                        <FileJson className="h-8 w-8 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black uppercase italic tracking-tighter">{t('settings.data.import_button')}</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">Formato JSON Regentum</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-zinc-200 shadow-md">
                        <CardHeader className="bg-zinc-50 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-zinc-200 rounded-lg">
                                    <RefreshCw className="h-5 w-5 text-zinc-600" />
                                </div>
                                <CardTitle className="text-lg">Mantenimiento de Datos</CardTitle>
                            </div>
                            <CardDescription>Herramientas para corregir errores de consistencia.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex flex-col gap-3">
                                <div className="p-4 bg-muted/30 rounded-2xl border flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <h5 className="text-xs font-bold uppercase tracking-tight">Depurar Registros Huérfanos</h5>
                                        <p className="text-[10px] text-muted-foreground mt-1">Elimina reservas y contratos que apuntan a propiedades o inquilinos eliminados.</p>
                                    </div>
                                    <Button variant="secondary" size="sm" onClick={handlePurgeOrphans} disabled={isPurging} className="font-bold text-[10px] uppercase h-9">
                                        {isPurging ? <Loader2 className="h-3 w-3 animate-spin mr-2"/> : <RefreshCw className="h-3 w-3 mr-2"/>}
                                        Depurar
                                    </Button>
                                </div>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100 flex items-center justify-between gap-4 group cursor-pointer hover:bg-red-50 transition-colors">
                                            <div className="flex-1">
                                                <h5 className="text-xs font-bold uppercase tracking-tight text-red-700">Vaciar todo el Espacio</h5>
                                                <p className="text-[10px] text-red-600/70 mt-1">Elimina TODA la información operativa. Acción irreversible para empezar de cero.</p>
                                            </div>
                                            <div className="p-2 bg-red-100 text-red-600 rounded-lg group-hover:scale-110 transition-transform">
                                                <Trash2 className="h-4 w-4" />
                                            </div>
                                        </div>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="text-destructive flex items-center gap-2">
                                                <ShieldAlert className="h-6 w-6" />
                                                ¿Vaciar absolutamente todo?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription className="space-y-4">
                                                <p>Esta acción eliminará <strong>todas las propiedades, inquilinos, cobros, gastos y liquidaciones</strong> de este espacio de trabajo.</p>
                                                <p className="font-bold text-destructive">SOLO el perfil administrativo y los socios del equipo se mantendrán.</p>
                                                <div className="space-y-2 mt-4">
                                                    <Label htmlFor="confirm-clear" className="text-xs font-bold">Escribe "VACIAR" para confirmar:</Label>
                                                    <Input 
                                                        id="confirm-clear" 
                                                        value={confirmText} 
                                                        onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                                                        placeholder="VACIAR"
                                                        className="border-destructive/30"
                                                    />
                                                </div>
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel onClick={() => setConfirmText("")}>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction 
                                                onClick={handleClearAll} 
                                                disabled={confirmText !== "VACIAR" || isClearing}
                                                className="bg-destructive hover:bg-destructive/90"
                                            >
                                                {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                                Confirmar Borrado Total
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={showImportDialog} onOpenChange={(open) => !isImporting && setShowImportDialog(open)}>
                <DialogContent 
                    className="sm:max-w-3xl p-0 overflow-hidden rounded-[2.5rem] flex flex-col max-h-[90vh]"
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                >
                    <DialogHeader className="p-6 bg-background border-b relative z-10 shrink-0">
                        <DialogTitle className="text-xl font-black uppercase italic tracking-tighter text-primary flex items-center gap-2">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                            {t('settings.data.import_confirm_title')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('settings.data.import_confirm_desc')}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto px-6 py-8 shadow-inner bg-muted/30 border-y border-muted-foreground/10">
                        <div className="space-y-6">
                            <Alert className="bg-primary/5 border-primary/20">
                                <Info className="h-4 w-4 text-primary" />
                                <AlertTitle className="text-[10px] font-black uppercase tracking-widest text-primary">{t('settings.data.import_selection_title')}</AlertTitle>
                                <AlertDescription className="text-xs">
                                    {t('settings.data.dependency_warning')}
                                </AlertDescription>
                            </Alert>

                            {importData && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] border-b pb-1">Datos Maestros</h4>
                                        {Object.entries(importData.collections).map(([key, list]) => {
                                            if (DEPENDENCIES[key]) return null;
                                            return renderCollectionItem(key, list.length, importSelection[key], (val) => handleToggleImport(key, val));
                                        })}
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] border-b pb-1">Movimientos y Registros</h4>
                                        {Object.entries(importData.collections).map(([key, list]) => {
                                            if (!DEPENDENCIES[key]) return null;
                                            return renderCollectionItem(key, list.length, importSelection[key], (val) => handleToggleImport(key, val));
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-background border-t shrink-0">
                        <Button variant="ghost" onClick={() => setShowImportDialog(false)} className="font-bold uppercase text-[10px] tracking-widest h-11">{t('common.cancel')}</Button>
                        <Button 
                            onClick={executeImport} 
                            disabled={!Object.values(importSelection).some(v => v)}
                            className="bg-orange-600 hover:bg-orange-700 font-bold uppercase text-[10px] tracking-widest h-11 px-10 shadow-lg"
                        >
                            {t('settings.data.import_confirm_button')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {isImporting && (
                <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                    <div className="p-6 bg-background border-4 border-primary rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="text-xl font-black uppercase italic tracking-tighter animate-pulse text-primary">
                            {t('settings.data.import_progress')}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}