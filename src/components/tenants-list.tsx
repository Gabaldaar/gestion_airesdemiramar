
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
import { TenantEditForm } from "@/components/tenant-edit-form";
import { TenantDeleteForm } from "@/components/tenant-delete-form";
import { History, FileText, Mail, Phone } from "lucide-react";
import { NotesViewer } from "@/components/notes-viewer";
import { useState, useEffect } from "react";
import { Badge } from "./ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./ui/card";
import useWindowSize from "@/hooks/use-window-size";
import { cn } from "@/lib/utils";

interface TenantsListProps {
    tenants: Tenant[];
    origins: Origin[];
}

const formatWhatsAppLink = (phone: string | null | undefined) => {
    if (!phone) return null;
    const cleanedPhone = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanedPhone}`;
};

// A simple page refresh is enough when server actions handle revalidation
const handleAction = () => {
    window.location.reload();
};

function TenantActions({ tenant }: { tenant: Tenant }) {
    const [isNotesOpen, setIsNotesOpen] = useState(false);

    return (
        <div className="flex items-center justify-end gap-1">
            <NotesViewer 
                notes={tenant.notes} 
                title={`Notas sobre ${tenant.name}`}
                isOpen={isNotesOpen}
                onOpenChange={setIsNotesOpen}
            >
                 <Button variant="ghost" size="icon" onClick={() => setIsNotesOpen(true)} disabled={!tenant.notes}>
                    <FileText className="h-4 w-4" />
                    <span className="sr-only">Ver Notas</span>
                </Button>
            </NotesViewer>
            <TenantEditForm tenant={tenant} onTenantUpdated={handleAction} />
            <TenantDeleteForm tenantId={tenant.id} onTenantDeleted={handleAction} />
            <Button asChild variant="ghost" size="icon">
              <Link href={`/bookings?tenantId=${tenant.id}`}>
                <History className="h-4 w-4" />
                <span className="sr-only">Ver Historial</span>
              </Link>
            </Button>
        </div>
    );
}


function TenantRow({ tenant, origin }: { tenant: Tenant, origin?: Origin }) {
    const waLink = formatWhatsAppLink(tenant.phone);
    return (
        <TableRow key={tenant.id}>
            <TableCell className="font-medium">{tenant.name}</TableCell>
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
                    <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {tenant.phone}
                    </a>
                ) : (tenant.phone || null)}
            </TableCell>
            <TableCell className="hidden md:table-cell">{`${tenant.address || ''}, ${tenant.city || ''}`.replace(/^, |, $/g, '')}</TableCell>
            <TableCell className="text-right">
                <TenantActions tenant={tenant} />
            </TableCell>
        </TableRow>
    );
}

function TenantCard({ tenant, origin }: { tenant: Tenant, origin?: Origin }) {
    const waLink = formatWhatsAppLink(tenant.phone);
    return (
        <Card>
            <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{tenant.name}</CardTitle>
                    {origin && (
                         <Badge style={{ backgroundColor: origin.color, color: 'white' }}>
                            {origin.name}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-4 grid gap-2 text-sm">
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
                            <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium flex items-center gap-1">
                                <Phone className="h-3 w-3"/> {tenant.phone}
                            </a>
                        ) : (
                            <span className="font-medium">{tenant.phone}</span>
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
                <TenantActions tenant={tenant} />
            </CardFooter>
        </Card>
    );
}


export default function TenantsList({ tenants, origins }: TenantsListProps) {
    const { width } = useWindowSize();
    const useCardView = width < 1280;

    if (tenants.length === 0) {
        return <p className="text-sm text-center text-muted-foreground py-8">No hay inquilinos para mostrar con los filtros seleccionados.</p>;
    }

    const originsMap = new Map(origins.map(o => [o.id, o]));
    
    const CardView = () => (
         <div className="space-y-4">
            {tenants.map((tenant: Tenant) => (
                <TenantCard key={tenant.id} tenant={tenant} origin={tenant.originId ? originsMap.get(tenant.originId) : undefined} />
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
                    <TenantRow key={tenant.id} tenant={tenant} origin={tenant.originId ? originsMap.get(tenant.originId) : undefined} />
                ))}
            </TableBody>
        </Table>
    );
    
    return useCardView ? <CardView /> : <TableView />;
}
