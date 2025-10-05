
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
import { History, FileText } from "lucide-react";
import { NotesViewer } from "@/components/notes-viewer";
import { useState } from "react";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

interface TenantsListProps {
    tenants: Tenant[];
    origins: Origin[];
}

function TenantRow({ tenant, origin }: { tenant: Tenant, origin?: Origin }) {
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    
    const formatWhatsAppLink = (phone: string) => {
        const cleanedPhone = phone.replace(/[^0-9]/g, '');
        return `https://wa.me/${cleanedPhone}`;
    }

    // A simple page refresh is enough when server actions handle revalidation
    const handleAction = () => {
        window.location.reload();
    };

    return (
        <TableRow key={tenant.id} className="block md:table-row border-b md:border-b-0 last:border-b-0">
            <TableCell data-label="Nombre" className="font-medium">{tenant.name}</TableCell>
            <TableCell data-label="Origen">
                {origin ? (
                    <Badge style={{ backgroundColor: origin.color, color: 'white' }}>
                        {origin.name}
                    </Badge>
                ) : null}
            </TableCell>
            <TableCell data-label="DNI">{tenant.dni}</TableCell>
            <TableCell data-label="Email">
                {tenant.email ? (
                    <a href={`mailto:${tenant.email}`} className="text-primary hover:underline">
                        {tenant.email}
                    </a>
                ) : null}
            </TableCell>
            <TableCell data-label="Teléfono">
                {tenant.phone ? (
                    <a href={formatWhatsAppLink(tenant.phone)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {tenant.phone}
                    </a>
                ) : null}
            </TableCell>
            <TableCell data-label="Dirección">{`${tenant.address || ''}, ${tenant.city || ''}, ${tenant.country || ''}`.replace(/^, |, $/g, '')}</TableCell>
            <TableCell data-label="Acciones" className="text-right">
              <div className="flex items-center justify-end gap-2">
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
            </TableCell>
        </TableRow>
    );
}


export default function TenantsList({ tenants, origins }: TenantsListProps) {
    if (tenants.length === 0) {
        return <p className="text-sm text-center text-muted-foreground py-8">No hay inquilinos para mostrar con los filtros seleccionados.</p>;
    }

    const originsMap = new Map(origins.map(o => [o.id, o]));

  return (
        <div>
            <Table className="block md:table">
            <TableHeader className="hidden md:table-header-group">
                <TableRow className="hidden md:table-row">
                <TableHead>Nombre</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody className="block md:table-row-group">
                {tenants.map((tenant: Tenant) => (
                <TenantRow key={tenant.id} tenant={tenant} origin={tenant.originId ? originsMap.get(tenant.originId) : undefined} />
                ))}
            </TableBody>
            </Table>
             <style jsx>{`
                @media (max-width: 767px) {
                    .block.md\\:table > .block.md\\:table-row-group > .block.md\\:table-row {
                        display: block;
                        padding: 1rem 0.5rem;
                        position: relative;
                    }
                    .block.md\\:table > .block.md\\:table-row-group > .block.md\\:table-row > [data-label] {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 0.5rem 0.5rem;
                        border-bottom: 1px solid hsl(var(--border));
                        text-align: right;
                        word-break: break-word;
                    }
                    .block.md\\:table > .block.md\\:table-row-group > .block.md\\:table-row > [data-label]::before {
                        content: attr(data-label);
                        font-weight: bold;
                        margin-right: 1rem;
                        text-align: left;
                    }
                    .block.md\\:table > .block.md\\:table-row-group > .block.md\\:table-row > [data-label="Acciones"] {
                        justify-content: flex-end;
                    }
                    .block.md\\:table > .block.md\\:table-row-group > .block.md\\:table-row > [data-label="Acciones"]::before {
                        display: none;
                    }
                    .block.md\\:table > .block.md\\:table-row-group > .block.md\\:table-row:first-child {
                        border-top: 1px solid hsl(var(--border));
                    }
                }
            `}</style>
        </div>
  );
}
