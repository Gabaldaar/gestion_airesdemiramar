'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { Property, TaskScope, WorkLog, getPendingWorkLogs } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { LogOut, PlusCircle, Loader2, Pencil, Info, ChevronDown } from 'lucide-react';
import { WorkLogAddForm } from './worklog-add-form';
import { WorkLogEditForm } from './worklog-edit-form';
import { WorkLogDeleteForm } from './worklog-delete-form';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseDateSafely, cn } from '@/lib/utils';
import { useToast } from './ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const formatDate = (dateString: string) => {
    const date = parseDateSafely(dateString);
    if (!date) return 'Fecha Inválida';
    return format(date, "dd-LLL-yy", { locale: es });
};

const formatCurrency = (amount: number, currency: 'ARS' | 'USD') => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
};


function WorkLogCard({ log, onEdit, onDelete }: {
    log: WorkLog & { assignmentName?: string };
    onEdit: (log: WorkLog) => void;
    onDelete: () => void;
}) {
    return (
        <Card>
            <CardHeader className="p-3 flex flex-row justify-between items-start">
                <div>
                    <CardTitle className="text-base">{log.assignmentName}</CardTitle>
                    <CardDescription>{formatDate(log.date)}</CardDescription>
                </div>
                <p className="font-bold text-lg text-primary">{formatCurrency(log.calculatedCost, log.costCurrency)}</p>
            </CardHeader>
            <CardContent className="p-3 pt-0 text-sm">
                <p className="font-medium">{log.description}</p>
                <p className="text-xs text-muted-foreground">({log.quantity} {log.activityType === 'hourly' ? 'hs' : 'visita(s)'} a {formatCurrency(log.rateApplied, log.costCurrency)})</p>
            </CardContent>
            <CardFooter className="p-2 justify-end">
                <Button variant="ghost" size="icon" onClick={() => onEdit(log)}><Pencil className="h-4 w-4" /></Button>
                <WorkLogDeleteForm workLogId={log.id} onActionComplete={onDelete} />
            </CardFooter>
        </Card>
    );
}

export default function ColaboradorDashboard({ properties, scopes }: { properties: Property[], scopes: TaskScope[] }) {
    const { appUser, signOut, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddFormOpen, setIsAddFormOpen] = useState(false);
    const [editingWorkLog, setEditingWorkLog] = useState<WorkLog | undefined>(undefined);
    const [isEditFormOpen, setIsEditFormOpen] = useState(false);

    useEffect(() => {
        const performFetch = async () => {
            if (!appUser?.id) {
                // If there's no user while auth is finished, we stop loading.
                // The layout manager will handle redirection if needed.
                if (!authLoading) {
                    setIsLoading(false);
                }
                return;
            }
            
            // We have a user, start fetching data.
            setIsLoading(true);
            try {
                const logs = await getPendingWorkLogs(appUser.id);
                setWorkLogs(logs);
            } catch (error) {
                console.error("Failed to fetch work logs:", error);
                toast({ title: "Error", description: "No se pudieron cargar las actividades.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        performFetch();
    }, [appUser, authLoading, toast]);


    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };
    
    const handleSoftExit = () => {
        router.push('/login');
    };

    const fetchData = useCallback(async () => {
        if (appUser?.id) {
            setIsLoading(true);
            try {
                const logs = await getPendingWorkLogs(appUser.id);
                setWorkLogs(logs);
            } catch (error) {
                toast({ title: "Error", description: "No se pudieron cargar las actividades.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        }
    }, [appUser?.id, toast]);


    const handleEdit = (log: WorkLog) => {
        setEditingWorkLog(log);
        setIsEditFormOpen(true);
    };

    const totalToLiquidate = useMemo(() => {
        const totals: { [key in 'ARS' | 'USD']: number } = { ARS: 0, USD: 0 };
        workLogs.forEach(log => {
            totals[log.costCurrency] = (totals[log.costCurrency] || 0) + log.calculatedCost;
        });
        return totals;
    }, [workLogs]);

    if (authLoading || isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!appUser) {
        // This should be handled by the layout manager, but it's a safe fallback.
        return (
            <div className="flex h-screen items-center justify-center">
               <p className="text-muted-foreground">Redirigiendo...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-background">
            <header className="flex h-16 items-center justify-between border-b bg-muted/40 px-4 md:px-6">
                <h1 className="text-lg font-semibold truncate">
                    Hola, <span className="text-primary">{appUser.name.split(' ')[0]}</span>
                </h1>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            Menú
                            <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleSoftExit}>
                            Salir del Panel
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                            <LogOut className="mr-2 h-4 w-4" />
                            Cerrar Sesión
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {appUser.adminNote && (
                    <Alert variant="default" className="border-blue-500 text-blue-800 dark:border-blue-400 dark:text-blue-300 [&>svg]:text-blue-500">
                        <Info className="h-4 w-4" />
                        <AlertTitle className="font-semibold text-blue-800 dark:text-blue-300">Nota del Administrador</AlertTitle>
                        <AlertDescription className="whitespace-pre-wrap">{appUser.adminNote}</AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader className="p-4">
                        <CardTitle className="text-lg">Total a Liquidar</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 grid grid-cols-2 gap-4 text-center">
                        <div>
                            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalToLiquidate.ARS, 'ARS')}</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalToLiquidate.USD, 'USD')}</p>
                        </div>
                    </CardContent>
                </Card>
                
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                         <h2 className="text-xl font-semibold">Tus Actividades Pendientes</h2>
                         <Button onClick={() => setIsAddFormOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Registrar Actividad
                        </Button>
                    </div>

                    {workLogs.length > 0 ? (
                        <div className="space-y-3">
                            {workLogs.map(log => (
                                <WorkLogCard key={log.id} log={log as any} onEdit={handleEdit} onDelete={fetchData} />
                            ))}
                        </div>
                    ) : (
                        <Card className="text-center">
                            <CardContent className="p-6">
                                <p className="text-muted-foreground">No tienes actividades pendientes de liquidación.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
            
            {/* Dialogs */}
            <WorkLogAddForm 
                provider={appUser} 
                properties={properties} 
                scopes={scopes} 
                isOpen={isAddFormOpen} 
                onOpenChange={setIsAddFormOpen} 
                onActionComplete={fetchData} 
            />
             {editingWorkLog && (
                <WorkLogEditForm
                    provider={appUser}
                    properties={properties}
                    scopes={scopes}
                    workLog={editingWorkLog}
                    isOpen={isEditFormOpen}
                    onOpenChange={setIsEditFormOpen}
                    onActionComplete={fetchData}
                />
             )}
        </div>
    );
}
