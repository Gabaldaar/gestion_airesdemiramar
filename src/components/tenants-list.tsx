
'use client';

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tenant, Origin } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { TenantDeleteForm } from "@/components/tenant-delete-form";
import { History, FileText, Mail, Phone, Pencil, Star } from "lucide-react";
import { NotesViewer } from "@/components/notes-viewer";
import { useState } from "react";
import { Badge } from "./ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./ui/card";
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


interface TenantsListProps {
    tenants: Tenant[];
    origins: Origin[];
    onDataChanged: () => void;
    onEditTenant: (tenant: Tenant) => void;
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

function TenantActions({ tenant, onDataChanged, onEditTenant }: { tenant: Tenant, onDataChanged: () => void, onEditTenant: (tenant: Tenant) => void }) {
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const waLink = formatWhatsAppLink(tenant.phone, tenant.countryCode);
    const telLink = `tel:${(tenant.countryCode || '+54').replace('+', '')}${tenant.phone?.replace(/[^0-9]/g, '')}`;

    return (
        <div className="flex items-center justify-end gap-1">
            <NotesViewer 
                notes={tenant.notes} 
                title={`Notas sobre ${tenant.name}`}
                isOpen={isNotesOpen}
                onOpenChange={setIsNotesOpen}
            >
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setIsNotesOpen(true)} disabled={!tenant.notes}>
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

            {tenant.phone && (
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
                        <Button variant="ghost" size="icon" onClick={() => onEditTenant(tenant)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar Inquilino</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Editar Inquilino</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TenantDeleteForm tenantId={tenant.id} onTenantDeleted={onDataChanged} />
            
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Button asChild variant="ghost" size="icon">
                            <Link href={`/bookings?tenantId=${tenant.id}`}>
                                <History className="h-4 w-4" />
                                <span className="sr-only">Ver Historial</span>
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Ver Historial de Reservas</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}


function TenantRow({ tenant, origin, onDataChanged, onEditTenant }: { tenant: Tenant, origin?: Origin, onDataChanged: () => void, onEditTenant: (tenant: Tenant) => void }) {
    const waLink = formatWhatsAppLink(tenant.phone, tenant.countryCode);
    return (
        <TableRow key={tenant.id}>
            <TableCell className="font-medium">
                <div className="flex flex-col gap-1">
                    <a href={`mailto:${tenant.email}`} className="text-primary hover:underline">
                        {tenant.name}
                    </a>
                    <DisplayRating rating={tenant.rating} />
                </div>
            </TableCell>
            <TableCell>
                {origin ? (
                    <Badge style={{ backgroundColor: origin.color, color: 'white' }}>
                        {origin.name}
                    </Badge>
                ) : null}
            </TableCell>
            <TableCell className="hidden md:table-cell">{tenant.dni}</TableCell>
            <TableCell>
                {tenant.email ? (
                    <a href={`mailto:${tenant.email}`} className="text-primary hover:underline">
                        {tenant.email}
                    </a>
                ) : null}
            </TableCell>
            <TableCell>
                {waLink ? (
                    <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 hover:underline flex items-center gap-1">
                        <WhatsAppIcon className="h-4 w-4" />
                        {tenant.countryCode || '+54'} {tenant.phone}
                    </a>
                ) : (tenant.phone ? `${tenant.countryCode || '+54'} ${tenant.phone}`: null)}
            </TableCell>
            <TableCell className="hidden md:table-cell">{`${tenant.address || ''}, ${tenant.city || ''}`.replace(/^, |, $/g, '')}</TableCell>
            <TableCell className="text-right">
                <TenantActions tenant={tenant} onDataChanged={onDataChanged} onEditTenant={onEditTenant} />
            </TableCell>
        </TableRow>
    );
}

function TenantCard({ tenant, origin, onDataChanged, onEditTenant }: { tenant: Tenant, origin?: Origin, onDataChanged: () => void, onEditTenant: (tenant: Tenant) => void }) {
    const waLink = formatWhatsAppLink(tenant.phone, tenant.countryCode);
    return (
        <Card>
            <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                        <a href={`mailto:${tenant.email}`} className="text-primary hover:underline">
                            {tenant.name}
                        </a>
                    </CardTitle>
                    {origin && (
                         <Badge style={{ backgroundColor: origin.color, color: 'white' }}>
                            {origin.name}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-4 grid gap-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Calificación</span>
                    <DisplayRating rating={tenant.rating} />
                </div>
                {tenant.dni && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">DNI</span>
                        <span className="font-medium">{tenant.dni}</span>
                    </div>
                )}
                 {tenant.email && (
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Email</span>
                        <a href={`mailto:${tenant.email}`} className="text-primary hover:underline font-medium truncate flex items-center gap-1">
                           <Mail className="h-3 w-3"/> {tenant.email}
                        </a>
                    </div>
                )}
                {tenant.phone && (
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Teléfono</span>
                         {waLink ? (
                            <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
                                <WhatsAppIcon className="h-3 w-3"/> {tenant.countryCode || '+54'} {tenant.phone}
                            </a>
                        ) : (
                            <span className="font-medium">{tenant.countryCode || '+54'} {tenant.phone}</span>
                        )}
                    </div>
                )}
                 {(tenant.address || tenant.city) && (
                    <div className="flex justify-between text-right">
                        <span className="text-muted-foreground">Dirección</span>
                        <span className="font-medium">{`${tenant.address || ''}, ${tenant.city || ''}`.replace(/^, |, $/g, '')}</span>
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-2 justify-end">
                <TenantActions tenant={tenant} onDataChanged={onDataChanged} onEditTenant={onEditTenant} />
            </CardFooter>
        </Card>
    );
}


export default function TenantsList({ tenants, origins, onDataChanged, onEditTenant }: TenantsListProps) {
    const { width } = useWindowSize();
    const useCardView = width < 1280;

    if (tenants.length === 0) {
        return <p className="text-sm text-center text-muted-foreground py-8">No hay inquilinos para mostrar con los filtros seleccionados.</p>;
    }

    const originsMap = new Map(origins.map(o => [o.id, o]));
    
    const CardView = () => (
         <div className="space-y-4">
            {tenants.map((tenant: Tenant) => (
                <TenantCard key={tenant.id} tenant={tenant} origin={tenant.originId ? originsMap.get(tenant.originId) : undefined} onDataChanged={onDataChanged} onEditTenant={onEditTenant} />
            ))}
        </div>
    );

    const TableView = () => (
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead className="hidden md:table-cell">DNI</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead className="hidden md:table-cell">Dirección</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {tenants.map((tenant: Tenant) => (
                    <TenantRow key={tenant.id} tenant={tenant} origin={tenant.originId ? originsMap.get(tenant.originId) : undefined} onDataChanged={onDataChanged} onEditTenant={onEditTenant} />
                ))}
            </TableBody>
        </Table>
    );
    
    return useCardView ? <CardView /> : <TableView />;
}
