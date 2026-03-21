
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Provider, ProviderCategory } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { ProviderDeleteForm } from "@/components/provider-delete-form";
import { History, FileText, Mail, Phone, Pencil, Star, Wrench } from "lucide-react";
import { NotesViewer } from "@/components/notes-viewer";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "./ui/card";
import useWindowSize from "@/hooks/use-window-size";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

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

const DisplayRating = ({ rating }: { rating: number | undefined }) => {
    const effectiveRating = rating || 0;
    if (effectiveRating === 0) return <span className="text-xs text-muted-foreground">Sin calificar</span>;

    const getColorClass = () => {
        if (effectiveRating === 1) return "text-red-500 fill-red-500";
        if (effectiveRating === 2) return "text-orange-400 fill-orange-400";
        return "text-yellow-400 fill-yellow-400";
    };

    return (
        <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, index) => (
                <Star
                    key={index}
                    className={cn(
                        "h-4 w-4",
                        index < effectiveRating ? getColorClass() : "text-gray-300"
                    )}
                />
            ))}
        </div>
    );
};

function ProviderActions({ provider, onDataChanged, onEditProvider }: { provider: Provider, onDataChanged: () => void, onEditProvider: (provider: Provider) => void }) {
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const waLink = formatWhatsAppLink(provider.phone, provider.countryCode);
    const telLink = `tel:${(provider.countryCode || '+54').replace('+', '')}${provider.phone?.replace(/[^0-9]/g, '')}`;

    return (
        <div className="flex items-center justify-end gap-1">
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
                            <span className="sr-only">Editar Proveedor</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Editar Proveedor</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <ProviderDeleteForm providerId={provider.id} onProviderDeleted={onDataChanged} />
        </div>
    );
}


function ProviderRow({ provider, category, onDataChanged, onEditProvider }: { provider: Provider, category?: ProviderCategory, onDataChanged: () => void, onEditProvider: (provider: Provider) => void }) {
    const waLink = formatWhatsAppLink(provider.phone, provider.countryCode);
    return (
        <TableRow key={provider.id}>
            <TableCell className="font-medium">
                <div className="flex flex-col gap-1">
                    <span className="text-primary">{provider.name}</span>
                    <DisplayRating rating={provider.rating} />
                </div>
            </TableCell>
            <TableCell>{category ? category.name : 'N/A'}</TableCell>
            <TableCell>
                {provider.email ? (
                    <a href={`mailto:${provider.email}`} className="text-primary hover:underline">
                        {provider.email}
                    </a>
                ) : null}
            </TableCell>
            <TableCell>
                {waLink ? (
                    <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 hover:underline flex items-center gap-1">
                        <WhatsAppIcon className="h-4 w-4" />
                        {provider.countryCode || '+54'} {provider.phone}
                    </a>
                ) : (provider.phone ? `${provider.countryCode || '+54'} ${provider.phone}`: null)}
            </TableCell>
            <TableCell className="hidden md:table-cell">{provider.address || ''}</TableCell>
            <TableCell className="text-right">
                <ProviderActions provider={provider} onDataChanged={onDataChanged} onEditProvider={onEditProvider} />
            </TableCell>
        </TableRow>
    );
}

function ProviderCard({ provider, category, onDataChanged, onEditProvider }: { provider: Provider, category?: ProviderCategory, onDataChanged: () => void, onEditProvider: (provider: Provider) => void }) {
    const waLink = formatWhatsAppLink(provider.phone, provider.countryCode);
    return (
        <Card>
            <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-primary">{provider.name}</CardTitle>
                    {category && (
                         <span className="text-sm text-muted-foreground">{category.name}</span>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-4 grid gap-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Calificación</span>
                    <DisplayRating rating={provider.rating} />
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
                <ProviderActions provider={provider} onDataChanged={onDataChanged} onEditProvider={onEditProvider} />
            </CardFooter>
        </Card>
    );
}


export default function ProvidersList({ providers, categories, onDataChanged, onEditProvider }: ProvidersListProps) {
    const { width } = useWindowSize();
    const useCardView = width < 1024;

    if (providers.length === 0) {
        return <p className="text-sm text-center text-muted-foreground py-8">No hay proveedores para mostrar con los filtros seleccionados.</p>;
    }

    const categoriesMap = new Map(categories.map(o => [o.id, o]));
    
    const CardView = () => (
         <div className="space-y-4">
            {providers.map((provider: Provider) => (
                <ProviderCard key={provider.id} provider={provider} category={provider.categoryId ? categoriesMap.get(provider.categoryId) : undefined} onDataChanged={onDataChanged} onEditProvider={onEditProvider} />
            ))}
        </div>
    );

    const TableView = () => (
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead className="hidden md:table-cell">Dirección</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {providers.map((provider: Provider) => (
                    <ProviderRow key={provider.id} provider={provider} category={provider.categoryId ? categoriesMap.get(provider.categoryId) : undefined} onDataChanged={onDataChanged} onEditProvider={onEditProvider} />
                ))}
            </TableBody>
        </Table>
    );
    
    return useCardView ? <CardView /> : <TableView />;
}
