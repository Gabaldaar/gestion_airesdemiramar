'use client';

import { useEffect, useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { OwnerLiquidation, Property, BrandingSettings } from '@/lib/data';
import { revertOwnerLiquidation, updateOwnerLiquidationStatus } from '@/lib/actions';
import { Loader2, Printer, Copy, Trash2, CheckCircle, Phone, Link2 as Link2Icon } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseDateSafely, cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { collection, getDocs, query, where, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { APP_CONFIG } from '@/lib/app-config';
import Image from 'next/image';

const formatCurrency = (amount: number, currency: string) => {
    try {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
    } catch(e) {
        return `${currency} ${amount.toFixed(2)}`;
    }
};

export function OwnerLiquidationDetailsDialog({ liquidation, property, isOpen, onOpenChange, onActionComplete }: {
    liquidation: OwnerLiquidation;
    property: Property;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onActionComplete: () => void;
}) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const [items, setItems] = useState<{ payments: any[], expenses: any[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [baseUrl, setBaseUrl] = useState('');
    const [branding, setBranding] = useState<BrandingSettings | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin);
        }
        const unsubBranding = onSnapshot(doc(db, 'settings', 'branding'), (snap) => {
            if (snap.exists()) setBranding(snap.data() as BrandingSettings);
        });
        return () => unsubBranding();
    }, []);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            const fetchDetails = async () => {
                const pQuery = query(collection(db, 'payments'), where('ownerLiquidationId', '==', liquidation.id));
                const eQuery = query(collection(db, 'expenses'), where('ownerLiquidationId', '==', liquidation.id));
                const [pSnaps, eSnaps] = await Promise.all([getDocs(pQuery), getDocs(eQuery)]);
                setItems({
                    payments: pSnaps.docs.map(d => ({ id: d.id, ...d.data() })),
                    expenses: eSnaps.docs.map(d => ({ id: d.id, ...d.data() }))
                });
                setIsLoading(false);
            };
            fetchDetails();
        }
    }, [isOpen, liquidation.id]);

    const handleRevert = () => {
        startTransition(async () => {
            const result = await revertOwnerLiquidation({ success: false, message: '' }, liquidation.id);
            if (result.success) {
                toast({ title: 'Éxito', description: result.message });
                onActionComplete();
                onOpenChange(false);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };

    const handleToggleStatus = () => {
        const newStatus = liquidation.status === 'paid' ? 'pending' : 'paid';
        const formData = new FormData();
        formData.append('id', liquidation.id);
        formData.append('status', newStatus);

        startTransition(async () => {
            const result = await updateOwnerLiquidationStatus({ success: false, message: '' }, formData);
            if (result.success) {
                toast({ title: 'Estado Actualizado', description: `La rendición ahora está "${newStatus === 'paid' ? 'Pagada' : 'Pendiente'}".` });
                onActionComplete();
                onOpenChange(false);
            }
        });
    };

    const getLiquidationLink = () => `${baseUrl}/liquidation-view?id=${liquidation.id}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(getLiquidationLink());
        toast({ title: 'Enlace Copiado', description: 'El enlace directo se ha copiado al portapapeles.' });
    };

    const generateFullMessage = () => {
        const ownerName = property.ownerName ? property.ownerName.split(' ')[0] : 'Propietario';
        let text = `Hola ${ownerName}, espero que estés bien. Te envío el resumen de la rendición de cuentas de *${property.name}*.\n\n`;
        text += `*Período:* ${format(parseDateSafely(liquidation.periodFrom)!, 'dd/MM/yy')} al ${format(parseDateSafely(liquidation.periodTo)!, 'dd/MM/yy')}\n\n`;
        
        text += `*Ingresos:* ${formatCurrency(liquidation.totalIncome, liquidation.currency)}\n`;
        text += `*Gastos:* -${formatCurrency(liquidation.totalExpenses, liquidation.currency)}\n`;
        text += `*Comisión Admin (${liquidation.commissionPercentage}%):* -${formatCurrency(liquidation.commissionAmount, liquidation.currency)}\n`;
        text += `--------------------------\n`;
        text += `*NETO A TRANSFERIR:* *${formatCurrency(liquidation.netToOwner, liquidation.currency)}*\n\n`;
        
        text += `Puedes revisar el detalle completo y descargar tu recibo oficial en este link:\n${getLiquidationLink()}\n\n`;
        text += `Cualquier duda quedo a disposición. Saludos!`;
        return text;
    };

    const handlePrint = () => {
        window.open(`/owner-liquidations/${liquidation.id}/print`, '_blank');
    };

    const handleWhatsApp = () => {
        if (!property.ownerPhone) {
            toast({ variant: 'destructive', title: 'Sin teléfono', description: 'El propietario no tiene un teléfono configurado.' });
            return;
        }
        const text = generateFullMessage();
        const phone = property.ownerPhone.replace(/[^0-9]/g, '');
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const appName = branding?.appName || APP_CONFIG.name;
    const appSlogan = branding?.appSlogan || APP_CONFIG.slogan;
    const logoMainUrl = branding?.logoMainUrl || APP_CONFIG.logo.main;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Detalle de Rendición - {property.name}</DialogTitle>
                    <DialogDescription>
                        Generada el {format(parseDateSafely(liquidation.dateGenerated)!, "dd 'de' MMMM, yyyy", { locale: es })}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Ingresos</p>
                            <p className="font-bold text-green-700">{formatCurrency(liquidation.totalIncome, liquidation.currency)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Gastos</p>
                            <p className="font-bold text-red-700">{formatCurrency(liquidation.totalExpenses, liquidation.currency)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Comisión</p>
                            <p className="font-bold text-orange-600">{formatCurrency(liquidation.commissionAmount, liquidation.currency)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-primary">Saldo Neto</p>
                            <p className="text-lg font-black text-primary">{formatCurrency(liquidation.netToOwner, liquidation.currency)}</p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                    ) : items && (
                        <div className="text-sm space-y-4 max-h-[30vh] overflow-y-auto pr-2">
                             <div className="space-y-1">
                                <h4 className="font-bold text-xs uppercase text-muted-foreground">Desglose de Movimientos</h4>
                                {items.payments.map(p => (
                                    <div key={p.id} className="flex justify-between p-2 border-b text-xs">
                                        <span>{format(parseDateSafely(p.date)!, 'dd/MM')} - {p.description}</span>
                                        <span className="font-medium text-green-600">+{formatCurrency(p.amount, liquidation.currency)}</span>
                                    </div>
                                ))}
                                {items.expenses.map(e => (
                                    <div key={e.id} className="flex justify-between p-2 border-b text-xs">
                                        <span>{format(parseDateSafely(e.date)!, 'dd/MM')} - {e.description}</span>
                                        <span className="font-medium text-red-600">-{formatCurrency(e.originalUsdAmount || e.amount, liquidation.currency)}</span>
                                    </div>
                                ))}
                             </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 border-t pt-4">
                    <div className="flex gap-2 mr-auto">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive h-8">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Revertir
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Revertir esta liquidación?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Los cobros y gastos asociados quedarán libres para volver a ser liquidados. El documento de rendición será eliminado permanentemente.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleRevert} className="bg-destructive">Confirmar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="outline" size="sm" className="h-8" onClick={handleToggleStatus}>
                            <CheckCircle className={cn("h-4 w-4 mr-2", liquidation.status === 'paid' ? "text-green-600" : "text-muted-foreground")} />
                            {liquidation.status === 'paid' ? 'Pagada' : 'Pendiente'}
                        </Button>
                        <Button variant="secondary" size="sm" className="h-8" onClick={handleCopyLink}>
                            <Link2Icon className="h-4 w-4 mr-2" />
                            Link
                        </Button>
                        <Button variant="secondary" size="sm" className="h-8" onClick={handleWhatsApp}>
                            <Phone className="h-4 w-4 mr-2" />
                            WhatsApp
                        </Button>
                        <Button variant="secondary" size="sm" className="h-8" onClick={handlePrint}>
                            <Printer className="h-4 w-4 mr-2" />
                            PDF
                        </Button>
                    </div>
                </DialogFooter>
                
                {/* Branding Footer for Dialog View */}
                <div className="mt-4 pt-4 border-t flex flex-col items-center gap-1 opacity-40">
                    <div className="relative w-24 h-6 grayscale">
                        <Image src={logoMainUrl} alt={appName} fill className="object-contain" />
                    </div>
                    <p className="text-[8px] uppercase font-bold tracking-widest text-zinc-500 text-center">
                        Gestionado con {appName} — {appSlogan}
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
