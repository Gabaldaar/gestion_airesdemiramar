'use client';

import React, { useState, useTransition } from 'react';
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Provider, ProviderCategory, UserRole, UserStatus } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { ProviderDeleteForm } from "@/components/provider-delete-form";
import { History, FileText, Mail, Phone, Pencil, Star, Loader2 } from "lucide-react";
import { NotesViewer } from "@/components/notes-viewer";
import { Badge } from "./ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "./ui/card";
import useWindowSize from "@/hooks/use-window-size";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { ProviderHistoryDialog } from "./provider-history-dialog";
import { useToast } from './ui/use-toast';
import { updateProviderRating } from '@/lib/actions';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';


const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="currentColor"
      viewBox="0 0 16 16"
      {...props}
    >
      <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
    </svg>
);

const ListSeparator = ({ children }: { children: React.ReactNode }) => (
    <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center">
            <span className="bg-background px-2 text-xs uppercase text-muted-foreground">
                {children}
            </span>
        </div>
    </div>
);


interface ProvidersListProps {
    providers: Provider[];
    categories: ProviderCategory[];
    onDataChanged: () => void;
    onEditProvider: (provider: Provider) => void;
}

const formatWhatsAppLink = (phone: string | null | undefined, countryCode: string | null | undefined) => {
    if (!phone) return null;
    const code = (countryCode || '54').replace(/[^0-9]/g, '');
    const phoneNum = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${code}${phoneNum}`;
};

function InteractiveRating({ tenant: provider, onRated }: { tenant: Provider; onRated: () => void }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogRating, setDialogRating] = useState(0);
    const [dialogError, setDialogError] = useState('');
    const currentRating = provider.rating || 0;

    const getStarColorClass = (rating: number) => {
        if (rating === 1) return "text-red-500 fill-red-500";
        if (rating === 2) return "text-orange-400 fill-orange-400";
        return "text-yellow-400 fill-yellow-400";
    };

    const handleRatingClick = (newRating: number) => {
        if (currentRating === newRating) {
            newRating = 0; // Allow un-rating
        }

        if (newRating <= 2 && newRating > 0) {
            setDialogRating(newRating);
            setDialogError('');
            setIsDialogOpen(true);
        } else {
            const formData = new FormData();
            formData.append('id', provider.id);
            formData.append('rating', String(newRating));
            
            startTransition(async () => {
                const result = await updateProviderRating({ success: false, message: '' }, formData);
                if (result.success) {
                    toast({ title: 'Éxito', description: 'Calificación actualizada.' });
                    onRated();
                } else {
                    toast({ title: 'Error', description: result.message, variant: 'destructive' });
                }
            });
        }
    };

    const handleDialogFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        formData.append('id', provider.id);
        formData.append('rating', String(dialogRating));

        startTransition(async () => {
            const result = await updateProviderRating({ success: false, message: '' }, formData);
            if (result.success) {
                toast({ title: 'Éxito', description: 'Calificación y notas guardadas.' });
                setIsDialogOpen(false);
                onRated();
            } else {
                setDialogError(result.message);
            }
        });
    };

    return (
        <>
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, index) => {
                    const ratingValue = index + 1;
                    return (
                        <Star
                            key={ratingValue}
                            className={cn(
                                "h-4 w-4 cursor-pointer",
                                ratingValue <= currentRating ? getStarColorClass(currentRating) : "text-gray-300",
                                isPending && "opacity-50"
                            )}
                            onClick={() => !isPending && handleRatingClick(ratingValue)}
                        />
                    );
                })}
                {currentRating === 0 && <span className="text-xs text-muted-foreground ml-1">Sin calificar</span>}
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Añadir justificación</DialogTitle>
                        <DialogDescription>
                            Has asignado una calificación baja a <span className="font-semibold">{provider.name}</span>. Por favor, añade una nota para justificar el motivo.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleDialogFormSubmit}>
                        <div className="grid gap-4 py-4">
                            <Label htmlFor="notes">Notas (la nota anterior se reemplazará)</Label>
                            <Textarea id="notes" name="notes" defaultValue={provider.notes || ''} />
                            {dialogError && <p className="text-sm font-medium text-destructive">{dialogError}</p>}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isPending}>Cancelar</Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Guardando...</> : 'Guardar Calificación y Notas'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

function ProviderActions({ provider, onDataChanged, onEditProvider, onHistoryClick }: { provider: Provider, onDataChanged: () => void, onEditProvider: (provider: Provider) => void, onHistoryClick: (provider: Provider) => void }) {
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const waLink = formatWhatsAppLink(provider.phone, provider.countryCode);
    const telLink = `tel:${(provider.countryCode || '+54').replace('+', '')}${provider.phone?.replace(/[^0-9]/g, '')}`;

    return (
        <div className="flex flex-wrap items-center justify-end gap-1">
            <NotesViewer 
                notes={provider.notes} 
                title={`Notas sobre ${provider.name}`}
                isOpen={isNotesOpen}
                onOpenChange={setIsNotesOpen}
            >
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setIsNotesOpen(true)} disabled={!provider.notes}>
                                <FileText className="h-4 w-4" />
                                <span className="sr-only">Ver Notas</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Ver Notas</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </NotesViewer>
            
            {waLink && (
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button asChild variant="ghost" size="icon" className="text-green-600 hover:text-green-700">
                                <a href={waLink} target="_blank" rel="noopener noreferrer">
                                    <WhatsAppIcon className="h-4 w-4" />
                                </a>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Enviar WhatsApp</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}

            {provider.phone && (
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Button asChild variant="ghost" size="icon">
                                <a href={telLink}>
                                    <Phone className="h-4 w-4" />
                                </a>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Llamar</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onEditProvider(provider)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar Colaborador</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Editar Colaborador</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <ProviderDeleteForm providerId={provider.id} onProviderDeleted={onDataChanged} />
            
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onHistoryClick(provider)}>
                            <History className="h-4 w-4" />
                            <span className="sr-only">Ver Historial</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Ver Historial de Trabajos</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}


function ProviderRow({ provider, category, onDataChanged, onEditProvider, onHistoryClick }: { provider: Provider, category?: ProviderCategory, onDataChanged: () => void, onEditProvider: (provider: Provider) => void, onHistoryClick: (provider: Provider) => void }) {
    const waLink = formatWhatsAppLink(provider.phone, provider.countryCode);
    return (
        <TableRow key={provider.id}>
            <TableCell className="font-medium">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-primary">{provider.name}</span>
                        {provider.role === 'admin' && <Badge variant="secondary">Admin</Badge>}
                    </div>
                    <InteractiveRating tenant={provider} onRated={onDataChanged} />
                </div>
            </TableCell>
            <TableCell>
                <a href={`mailto:${provider.email}`} className="text-primary hover:underline">
                    {provider.email}
                </a>
            </TableCell>
            <TableCell>
                {waLink ? (
                    <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 hover:underline flex items-center gap-1">
                        <WhatsAppIcon className="h-4 w-4" />
                        {provider.countryCode || '+54'} {provider.phone}
                    </a>
                ) : (provider.phone ? `${provider.countryCode || '+54'} ${provider.phone}`: null)}
            </TableCell>
             <TableCell>
                <Badge variant={provider.status === 'active' ? 'default' : 'secondary'} className={provider.status === 'active' ? 'bg-green-600' : 'bg-yellow-500 text-black'}>
                    {provider.status === 'active' ? 'Activo' : 'Pendiente'}
                </Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell">{category ? category.name : 'N/A'}</TableCell>
            <TableCell className="text-right">
                <ProviderActions provider={provider} onDataChanged={onDataChanged} onEditProvider={onEditProvider} onHistoryClick={onHistoryClick} />
            </TableCell>
        </TableRow>
    );
}

function ProviderCard({ provider, category, onDataChanged, onEditProvider, onHistoryClick }: { provider: Provider, category?: ProviderCategory, onDataChanged: () => void, onEditProvider: (provider: Provider) => void, onHistoryClick: (provider: Provider) => void }) {
    const waLink = formatWhatsAppLink(provider.phone, provider.countryCode);
    return (
        <Card>
            <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-primary">{provider.name}</CardTitle>
                     <div className="flex flex-col items-end gap-2">
                        {provider.role === 'admin' && <Badge variant="secondary">Admin</Badge>}
                        <Badge variant={provider.status === 'active' ? 'default' : 'secondary'} className={provider.status === 'active' ? 'bg-green-600' : 'bg-yellow-500 text-black'}>
                            {provider.status === 'active' ? 'Activo' : 'Pendiente'}
                        </Badge>
                    </div>
                </div>
                 {category && (
                    <CardDescription>{category.name}</CardDescription>
                )}
            </CardHeader>
            <CardContent className="p-4 grid gap-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Calificación</span>
                    <InteractiveRating tenant={provider} onRated={onDataChanged} />
                </div>
                {provider.email && (
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Email</span>
                        <a href={`mailto:${provider.email}`} className="text-primary hover:underline font-medium truncate flex items-center gap-1">
                           <Mail className="h-3 w-3"/> {provider.email}
                        </a>
                    </div>
                )}
                {provider.phone && (
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Teléfono</span>
                         {waLink ? (
                            <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
                                <WhatsAppIcon className="h-3 w-3"/> {provider.countryCode || '+54'} {provider.phone}
                            </a>
                        ) : (
                            <span className="font-medium">{provider.countryCode || '+54'} {provider.phone}</span>
                        )}
                    </div>
                )}
                 {provider.address && (
                    <div className="flex justify-between text-right">
                        <span className="text-muted-foreground">Dirección</span>
                        <span className="font-medium">{provider.address}</span>
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-2 justify-end">
                <ProviderActions provider={provider} onDataChanged={onDataChanged} onEditProvider={onEditProvider} onHistoryClick={onHistoryClick} />
            </CardFooter>
        </Card>
    );
}


export default function ProvidersList({ providers, categories, onDataChanged, onEditProvider }: ProvidersListProps) {
    const { width } = useWindowSize();
    const useCardView = width < 1024;
    const [historyProvider, setHistoryProvider] = useState<Provider | undefined>(undefined);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const handleHistoryClick = (provider: Provider) => {
        setHistoryProvider(provider);
        setIsHistoryOpen(true);
    };

    if (providers.length === 0) {
        return <p className="text-sm text-center text-muted-foreground py-8">No hay colaboradores para mostrar con los filtros seleccionados.</p>;
    }

    const categoriesMap = new Map(categories.map(o => [o.id, o]));
    
    // Group providers by their role and status
    const groupedProviders = providers.reduce((acc, provider) => {
        let group: string;
        if (provider.role === 'admin') {
            group = 'admins';
        } else if (provider.status === 'active') {
            group = 'active';
        } else {
            group = 'pending';
        }
        if (!acc[group]) {
            acc[group] = [];
        }
        acc[group].push(provider);
        return acc;
    }, {} as { [key: string]: Provider[] });

    const groupOrder = ['admins', 'active', 'pending'];
    const groupTitles: { [key: string]: string } = {
        admins: 'Administradores',
        active: 'Colaboradores',
        pending: 'Colaboradores Pendientes',
    };

    const renderGroup = (groupKey: string, isCardView: boolean) => {
        const group = groupedProviders[groupKey];
        if (!group || group.length === 0) return null;

        return (
            <React.Fragment key={groupKey}>
                {isCardView ? (
                    <ListSeparator>{groupTitles[groupKey]}</ListSeparator>
                ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="p-0 h-auto">
                            <ListSeparator>{groupTitles[groupKey]}</ListSeparator>
                        </TableCell>
                    </TableRow>
                )}
                {group.map((provider) => (
                    isCardView ? (
                        <ProviderCard
                            key={provider.id}
                            provider={provider}
                            category={provider.categoryId ? categoriesMap.get(provider.categoryId) : undefined}
                            onDataChanged={onDataChanged}
                            onEditProvider={onEditProvider}
                            onHistoryClick={handleHistoryClick}
                        />
                    ) : (
                        <ProviderRow
                            key={provider.id}
                            provider={provider}
                            category={provider.categoryId ? categoriesMap.get(provider.categoryId) : undefined}
                            onDataChanged={onDataChanged}
                            onEditProvider={onEditProvider}
                            onHistoryClick={handleHistoryClick}
                        />
                    )
                ))}
            </React.Fragment>
        );
    };

    const CardView = () => (
        <div className="space-y-4">
            {groupOrder.map(key => renderGroup(key, true))}
        </div>
    );

    const TableView = () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="hidden md:table-cell">Categoría</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {groupOrder.map(key => renderGroup(key, false))}
            </TableBody>
        </Table>
    );
    
    return (
        <div>
            {useCardView ? <CardView /> : <TableView />}
            {historyProvider && (
                <ProviderHistoryDialog
                    providerId={historyProvider.id}
                    providerName={historyProvider.name}
                    isOpen={isHistoryOpen}
                    onOpenChange={setIsHistoryOpen}
                />
            )}
        </div>
    );
}
