
'use client';

import React, { useState, useTransition, useMemo } from 'react';
import Link from "next/link";
import { Tenant, Origin, Booking } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { TenantDeleteForm } from "@/components/tenant-delete-form";
import { History, FileText, Pencil, Star, Loader2, Copy, Trash2, Phone, Users } from "lucide-react";
import { NotesViewer } from "@/components/notes-viewer";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardFooter, CardContent, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from '@/components/ui/use-toast';
import { updateTenantRating } from '@/lib/actions';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from "@/i18n/useTranslation";
import { TenantDetailsDialog } from "./tenant-details-dialog";

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" {...props}>
      <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1-4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
    </svg>
);

const formatWhatsAppLink = (phone: string | null | undefined, countryCode: string | null | undefined) => {
    if (!phone) return null;
    const code = (countryCode || '54').replace(/[^0-9]/g, '');
    const phoneNum = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${code}${phoneNum}`;
};

interface TenantsListProps {
    tenants: Tenant[];
    allBookings: Booking[];
    origins: Origin[];
    onDataChanged: () => void;
    onEditTenant: (tenant: Tenant) => void;
}

export default function TenantsList({ tenants, allBookings, origins, onDataChanged, onEditTenant }: TenantsListProps) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const [notesTenant, setNotesTenant] = useState<Tenant | null>(null);
    const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);
    const [selectedTenantForRating, setSelectedTenantForRating] = useState<Tenant | null>(null);
    const [pendingRatingValue, setPendingRatingValue] = useState(0);
    const [selectedTenantDetails, setSelectedTenantDetails] = useState<Tenant | null>(null);

    const originsMap = useMemo(() => {
        return origins ? new Map(origins.map(o => [o.id, o])) : new Map<string, Origin>();
    }, [origins]);

    const bookingsCountMap = useMemo(() => {
        const counts: Record<string, number> = {};
        allBookings.forEach(b => {
            if (b.status !== 'cancelled') {
                counts[b.tenantId] = (counts[b.tenantId] || 0) + 1;
            }
        });
        return counts;
    }, [allBookings]);

    const handleRatingClick = (tenant: Tenant, newRating: number) => {
        const finalRating = tenant.rating === newRating ? 0 : newRating;
        if (finalRating > 0 && finalRating <= 2) {
            setSelectedTenantForRating(tenant);
            setPendingRatingValue(finalRating);
        } else {
            const formData = new FormData();
            formData.append('id', tenant.id);
            formData.append('rating', String(finalRating));
            startTransition(async () => {
                const result = await updateTenantRating({ success: false, message: '' }, formData);
                if (result.success) onDataChanged();
                else toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
            });
        }
    };

    const handleRatingDialogSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedTenantForRating) return;
        const formData = new FormData(event.currentTarget);
        formData.append('id', selectedTenantForRating.id);
        formData.append('rating', String(pendingRatingValue));
        startTransition(async () => {
            const result = await updateTenantRating({ success: false, message: '' }, formData);
            if (result.success) {
                setSelectedTenantForRating(null);
                onDataChanged();
            } else {
                toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
            }
        });
    };

    const handleCopy = (tenant: Tenant) => {
        let textToCopy = `*${t('tenants.copy_format.title')}*\n`;
        textToCopy += `*${t('tenants.copy_format.name')}:* ${tenant.name}\n`;
        if (tenant.phone) textToCopy += `*${t('tenants.copy_format.phone')}:* ${tenant.countryCode || '+54'} ${tenant.phone}\n`;
        if (tenant.email) textToCopy += `*${t('tenants.copy_format.email')}:* ${tenant.email}\n`;
        if (tenant.dni) textToCopy += `*${t('tenants.copy_format.dni')}:* ${tenant.dni}\n`;
        navigator.clipboard.writeText(textToCopy);
        toast({ title: t('common.success'), description: t('tenants.tooltips.copy_data_success') });
    };

    const renderRating = (tenant: Tenant) => {
        const rating = tenant.rating || 0;
        const getStarColorClass = (r: number) => {
            if (r === 1) return "text-red-500 fill-red-500";
            if (r === 2) return "text-orange-400 fill-orange-400";
            return "text-yellow-400 fill-yellow-400";
        };
        return (
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, index) => {
                    const val = index + 1;
                    return (
                        <Star 
                            key={val} 
                            className={cn(
                                "h-4 w-4 cursor-pointer transition-transform hover:scale-125", 
                                val <= rating ? getStarColorClass(rating) : "text-gray-300", 
                                isPending && "opacity-50"
                            )} 
                            onClick={() => !isPending && handleRatingClick(tenant, val)} 
                        />
                    );
                })}
            </div>
        );
    };

    const renderActions = (tenant: Tenant) => {
        const waLink = formatWhatsAppLink(tenant.phone, tenant.countryCode);
        const telLink = `tel:${(tenant.countryCode || '+54').replace('+', '')}${tenant.phone?.replace(/[^0-9]/g, '')}`;

        return (
            <div className="flex flex-wrap items-center justify-end gap-1">
                <TooltipProvider>
                    {waLink && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-green-600">
                                    <a href={waLink} target="_blank" rel="noopener noreferrer"><WhatsAppIcon /></a>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('tenants.tooltips.send_whatsapp')}</p></TooltipContent>
                        </Tooltip>
                    )}
                    {tenant.phone && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                                    <a href={telLink}><Phone className="h-4 w-4" /></a>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('tenants.tooltips.call')}</p></TooltipContent>
                        </Tooltip>
                    )}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(tenant)}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{t('tenants.tooltips.copy_data')}</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setNotesTenant(tenant)} disabled={!tenant.notes}>
                                <FileText className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{t('tenants.tooltips.view_notes')}</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditTenant(tenant)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{t('tenants.tooltips.edit_tenant')}</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                                <Link href={`/bookings?tenantId=${tenant.id}`}><History className="h-4 w-4" /></Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{t('tenants.tooltips.view_history')}</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingTenant(tenant)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{t('tenants.tooltips.delete_tenant')}</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        );
    };

    if (tenants.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-3xl bg-muted/20">
                <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-bold text-muted-foreground">{t('tenants.no_tenants')}</h3>
                <p className="text-sm text-muted-foreground/60 max-w-xs">{t('common.empty_states.tenants_desc')}</p>
            </div>
        );
    }

    return (
        <div className="pb-24">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tenants.map((tenant) => {
                    const origin = originsMap.get(tenant.originId || '');
                    const rating = tenant.rating || 0;
                    const isLowRating = rating > 0 && rating <= 2;
                    const isFiveStar = rating === 5;
                    const bookingsCount = bookingsCountMap[tenant.id] || 0;
                    
                    return (
                        <Card key={tenant.id} className={cn(
                            "overflow-hidden border-2 shadow-sm flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl", 
                            isLowRating ? "border-red-500/40" : isFiveStar ? "border-yellow-500/40" : "border-primary/20"
                        )}>
                            <CardHeader className={cn(
                                "p-4 flex flex-row justify-between items-start py-3", 
                                isLowRating ? "bg-red-500/10" : isFiveStar ? "bg-yellow-500/10" : "bg-primary/5"
                            )}>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CardTitle className={cn(
                                            "text-lg truncate font-bold flex-1", 
                                            isLowRating ? "text-red-700" : isFiveStar ? "text-amber-700" : "text-primary"
                                        )}>
                                            <button onClick={() => setSelectedTenantDetails(tenant)} className="hover:underline text-left truncate block w-full">
                                                {tenant.name}
                                            </button>
                                        </CardTitle>
                                        {bookingsCount > 0 && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className={cn(
                                                            "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm border",
                                                            bookingsCount > 1 ? "bg-blue-600 text-white border-blue-700" : "bg-muted text-muted-foreground border-muted-foreground/20"
                                                        )}>
                                                            {bookingsCount}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{t('tenants.card.bookings_count')}: {bookingsCount}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                    {renderRating(tenant)}
                                </div>
                                {origin && <Badge style={{ backgroundColor: origin.color, color: 'white' }} className="h-fit">{origin.name}</Badge>}
                            </CardHeader>
                            <CardContent className="p-4 space-y-3 text-sm flex-grow">
                                {tenant.dni && (
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <span className="text-muted-foreground uppercase text-[10px] font-bold">{t('tenants.card.dni')}</span>
                                        <span className="font-medium">{tenant.dni}</span>
                                    </div>
                                )}
                                {tenant.phone && (
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <span className="text-muted-foreground uppercase text-[10px] font-bold">{t('tenants.card.phone')}</span>
                                        <span className="font-medium">{tenant.countryCode || '+54'} {tenant.phone}</span>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="p-2 px-4 justify-end border-t bg-muted/30">
                                {renderActions(tenant)}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            {selectedTenantForRating && (
                <Dialog open={!!selectedTenantForRating} onOpenChange={(open) => !open && setSelectedTenantForRating(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Añadir justificación</DialogTitle>
                            <DialogDescription>Has asignado una calificación baja a <span className="font-semibold">{selectedTenantForRating.name}</span>. Por favor, añade una nota.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleRatingDialogSubmit}>
                            <div className="grid gap-4 py-4">
                                <Label htmlFor="notes">Notas</Label>
                                <Textarea id="notes" name="notes" defaultValue={selectedTenantForRating.notes || ''} required />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setSelectedTenantForRating(null)}>Cancelar</Button>
                                <Button type="submit" disabled={isPending}>{isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : t('common.save')}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

            {notesTenant && (
                <NotesViewer 
                    notes={notesTenant.notes} 
                    title={`${t('tenants.tooltips.view_notes')} - ${notesTenant.name}`}
                    isOpen={!!notesTenant}
                    onOpenChange={(open) => !open && setNotesTenant(null)}
                />
            )}

            {deletingTenant && (
                <TenantDeleteForm 
                    tenantId={deletingTenant.id} 
                    isOpen={!!deletingTenant} 
                    onOpenChange={(open) => !open && setDeletingTenant(null)} 
                    onTenantDeleted={onDataChanged} 
                />
            )}

            {selectedTenantDetails && (
                <TenantDetailsDialog
                    tenant={selectedTenantDetails}
                    origin={originsMap.get(selectedTenantDetails.originId || '')}
                    isOpen={!!selectedTenantDetails}
                    onOpenChange={(open) => !open && setSelectedTenantDetails(null)}
                />
            )}
        </div>
    );
}
