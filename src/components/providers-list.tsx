
'use client';

import React, { useState, useMemo, useTransition } from 'react';
import Link from "next/link";
import { Provider, ProviderCategory } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { ProviderDeleteForm } from "@/components/provider-delete-form";
import { History, FileText, Pencil, Trash2, Star, Mail, Phone, MapPin, Briefcase, Wrench, Banknote, ShieldCheck, Loader2, Users, Info } from "lucide-react";
import { NotesViewer } from "@/components/notes-viewer";
import { Badge } from "./ui/badge";
import { Card, CardHeader, CardTitle, CardFooter, CardContent, CardDescription } from "./ui/card";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "./ui/tooltip";
import { ProviderHistoryDialog } from "./provider-history-dialog";
import { useTranslation } from "@/i18n/useTranslation";
import { updateProviderRating } from '@/lib/actions';
import { useToast } from './ui/use-toast';
import { useAuth } from './auth-provider';

// Identificador del maestro para protección del perfil (UID seguro)
const MASTER_ADMIN_UID = 'ymBtFDZUWKR7VCxWNTHWflXc5mx1';

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

interface ProvidersListProps {
    providers: Provider[];
    categories: ProviderCategory[];
    onDataChanged: () => void;
    onEditProvider: (provider: Provider) => void;
    forceCardView?: boolean;
    customEmptyTitle?: string;
    customEmptyDesc?: string;
}

export default function ProvidersList({ 
    providers, 
    categories, 
    onDataChanged, 
    onEditProvider, 
    forceCardView = false,
    customEmptyTitle,
    customEmptyDesc
}: ProvidersListProps) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { appUser } = useAuth();
    const [isPendingRating, startRatingTransition] = useTransition();
    
    const [historyProvider, setHistoryProvider] = useState<Provider | null>(null);
    const [notesProvider, setNotesProvider] = useState<Provider | null>(null);
    const [deletingProvider, setDeletingProvider] = useState<Provider | null>(null);

    const categoriesMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);

    const formatCurrency = (amount: number | null | undefined, currency: string | null | undefined) => {
        if (amount === undefined || amount === null) return '-';
        return new Intl.NumberFormat('es-AR', { 
            style: 'currency', 
            currency: currency || 'ARS', 
            maximumFractionDigits: 0 
        }).format(amount);
    };

    const handleRatingClick = (provider: Provider, val: number) => {
        const newRating = provider.rating === val ? 0 : val;
        const formData = new FormData();
        formData.append('id', provider.id);
        formData.append('rating', String(newRating));
        
        startRatingTransition(async () => {
            const result = await updateProviderRating({ success: false, message: '' }, formData);
            if (result.success) {
                onDataChanged();
            } else {
                toast({ variant: 'destructive', title: t('common.error'), description: result.message });
            }
        });
    };

    const renderRating = (provider: Provider) => {
        const rating = provider.rating || 0;
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
                                "h-3.5 w-3.5 cursor-pointer transition-transform hover:scale-125", 
                                val <= rating ? getStarColorClass(rating) : "text-gray-300",
                                isPendingRating && "opacity-50 pointer-events-none"
                            )} 
                            onClick={() => handleRatingClick(provider, val)}
                        />
                    );
                })}
                {isPendingRating && <Loader2 className="h-3 w-3 animate-spin ml-2 text-muted-foreground" />}
            </div>
        );
    };

    const getHeaderColors = (p: Provider) => {
        const rating = p.rating || 0;
        const isPending = p.status === 'pending';
        const isAdmin = p.role === 'admin';

        if (rating === 1) return { headerClass: "bg-red-500/10", titleColor: "text-red-700", borderClass: "border-red-500/40" };
        if (rating === 2) return { headerClass: "bg-orange-500/10", titleColor: "text-orange-700", borderClass: "border-orange-500/40" };
        if (isPending) return { headerClass: "bg-purple-500/10", titleColor: "text-purple-700", borderClass: "border-purple-500/40" };
        if (isAdmin) return { headerClass: "bg-green-500/10", titleColor: "text-green-700", borderClass: "border-green-500/40" };
        return { headerClass: "bg-blue-500/10", titleColor: "text-blue-700", borderClass: "border-blue-500/40" };
    };

    const renderActions = (p: Provider) => {
        const waLink = formatWhatsAppLink(p.phone, p.countryCode);
        const telLink = p.phone ? `tel:${(p.countryCode || '+54').replace('+', '')}${p.phone.replace(/[^0-9]/g, '')}` : null;
        const isExternalProvider = p.role === 'provider';
        
        const isMasterAdminId = p.id === MASTER_ADMIN_UID;
        const isWorkspaceOwner = p.id === p.orgId;
        
        const isSystemRole = p.role === 'admin' || p.role === 'socio' || p.role === 'staff';
        const isProtected = isSystemRole && (isMasterAdminId || isWorkspaceOwner);

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
                            <TooltipContent><p>{t('providers.tooltips.send_whatsapp')}</p></TooltipContent>
                        </Tooltip>
                    )}
                    {telLink && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                                    <a href={telLink}><Phone className="h-4 w-4" /></a>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('providers.tooltips.call')}</p></TooltipContent>
                        </Tooltip>
                    )}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setNotesProvider(p)} disabled={!p.notes}>
                                <FileText className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{t('tenants.tooltips.view_notes')}</p></TooltipContent>
                    </Tooltip>

                    {isExternalProvider && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => setHistoryProvider(p)}>
                                    <History className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('providers.tooltips.view_history')}</p></TooltipContent>
                        </Tooltip>
                    )}

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditProvider(p)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{t('common.edit')}</p></TooltipContent>
                    </Tooltip>

                    {!isProtected && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingProvider(p)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('common.delete')}</p></TooltipContent>
                        </Tooltip>
                    )}
                </TooltipProvider>
            </div>
        );
    };

    if (providers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-3xl bg-muted/20">
                <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-bold text-muted-foreground">
                    {customEmptyTitle || t('providers.no_providers')}
                </h3>
                <p className="text-sm text-muted-foreground/60 max-w-xs">
                    {customEmptyDesc || t('common.empty_states.providers_desc')}
                </p>
            </div>
        );
    }

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {providers.map(p => {
                    const { headerClass, titleColor, borderClass } = getHeaderColors(p);
                    const categoryName = categoriesMap.get(p.categoryId || '');
                    const telLink = p.phone ? `tel:${(p.countryCode || '+54').replace('+', '')}${p.phone.replace(/[^0-9]/g, '')}` : null;
                    const isPending = p.status === 'pending';
                    const isAdmin = p.role === 'admin';
                    const isOwner = p.role === 'owner';
                    const isExternalProvider = p.role === 'provider';
                    const isWorkspaceOwner = p.id === p.orgId;
                    const isMasterAdminId = p.id === MASTER_ADMIN_UID;
                    const isProtected = (isAdmin || isWorkspaceOwner || isMasterAdminId) && p.role !== 'owner';

                    return (
                        <Card key={p.id} className={cn(
                            "overflow-hidden border-2 shadow-sm flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
                            borderClass
                        )}>
                            <CardHeader className={cn("p-4 py-3", headerClass)}>
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CardTitle className={cn(titleColor, "font-bold text-lg")}>
                                                {p.name}
                                            </CardTitle>
                                            {isProtected && <ShieldCheck className="h-4 w-4 text-green-600 shrink-0" />}
                                        </div>
                                        {!isOwner && renderRating(p)}
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        {!isOwner && (
                                            <Badge variant={isPending ? "secondary" : "default"} className={cn(
                                                "text-[10px] h-5 uppercase font-bold",
                                                isPending ? "bg-purple-500 text-white" : isProtected ? "bg-green-600" : "bg-blue-600"
                                            )}>
                                                {t(`providers.status.${p.status || 'pending'}`)}
                                            </Badge>
                                        )}
                                        <Badge variant="outline" className="text-[10px] h-5 uppercase border-primary text-primary font-bold">
                                            {isWorkspaceOwner && p.role !== 'owner' ? t('providers.roles.admin') : t(`providers.roles.${p.role || 'provider'}`)}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4 text-sm flex-grow">
                                <div className="space-y-2">
                                    {categoryName && !isOwner && (
                                        <div className="flex items-center gap-2 text-muted-foreground border-b pb-2">
                                            <Wrench className="h-3.5 w-3.5" />
                                            <span className="text-[10px] uppercase font-bold">{t('providers.card.category')}</span>
                                            <span className="font-medium text-foreground ml-auto">{categoryName}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-muted-foreground border-b pb-2">
                                        <Mail className="h-3.5 w-3.5" />
                                        <span className="text-[10px] uppercase font-bold">{t('providers.card.email')}</span>
                                        {p.email ? (
                                          <a href={`mailto:${p.email}`} className="text-primary hover:underline ml-auto truncate max-w-[200px]">{p.email}</a>
                                        ) : (
                                          <span className="text-muted-foreground italic ml-auto">-</span>
                                        )}
                                    </div>
                                    {p.phone && (
                                        <div className="flex items-center gap-2 text-muted-foreground border-b pb-2">
                                            <Phone className="h-3.5 w-3.5" />
                                            <span className="text-[10px] uppercase font-bold">{t('providers.card.phone')}</span>
                                            <a href={telLink || '#'} className="font-medium text-foreground ml-auto">{p.countryCode || '+54'} {p.phone}</a>
                                        </div>
                                    )}
                                    {p.address && (
                                        <div className="flex items-start gap-2 text-muted-foreground">
                                            <MapPin className="h-3.5 w-3.5 mt-0.5" />
                                            <span className="text-[10px] uppercase font-bold shrink-0">{t('providers.card.address')}</span>
                                            <span className="font-medium text-foreground ml-auto text-right line-clamp-1">{p.address}</span>
                                        </div>
                                    )}
                                </div>

                                {isExternalProvider && (
                                    <>
                                        <div className="pt-2 border-t grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                                    <Briefcase className="h-3 w-3" /> {t('providers.management.label')}
                                                </p>
                                                <p className="font-semibold capitalize text-xs">
                                                    {t(`providers.management.${p.managementType || 'tasks'}`)}
                                                </p>
                                            </div>
                                            {p.managementType === 'liquidations' && (
                                                <div className="text-right space-y-1">
                                                    <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-end gap-1">
                                                        <Banknote className="h-3 w-3" /> {t('providers.billing.label')}
                                                    </p>
                                                    <p className="font-bold text-primary">
                                                        {p.billingType === 'hourly' || p.billingType === 'hourly_or_visit' 
                                                            ? `${formatCurrency(p.hourlyRate, p.rateCurrency)}/h`
                                                            : p.perVisitRate ? formatCurrency(p.perVisitRate, p.rateCurrency) : '-'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                            <CardFooter className="p-2 px-4 justify-end border-t bg-muted/30">
                                {renderActions(p)}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            {historyProvider && (
                <ProviderHistoryDialog 
                    providerId={historyProvider.id} 
                    providerName={historyProvider.name} 
                    isOpen={!!historyProvider} 
                    onOpenChange={(open) => !open && setHistoryProvider(null)} 
                />
            )}

            {notesProvider && (
                <NotesViewer 
                    notes={notesProvider.notes} 
                    title={`${t('tenants.tooltips.view_notes')} - ${notesProvider.name}`} 
                    isOpen={!!notesProvider} 
                    onOpenChange={(open) => !open && setNotesProvider(null)} 
                />
            )}

            {deletingProvider && (
                <ProviderDeleteForm 
                    providerId={deletingProvider.id} 
                    isOpen={!!deletingProvider} 
                    onOpenChange={(open) => !open && setDeletingProvider(null)} 
                    onProviderDeleted={onDataChanged} 
                />
            )}
        </div>
    );
}
