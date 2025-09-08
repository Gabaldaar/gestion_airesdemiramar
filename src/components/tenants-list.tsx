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
import { Tenant } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { TenantEditForm } from "@/components/tenant-edit-form";
import { TenantDeleteForm } from "@/components/tenant-delete-form";
import { History, FileText } from "lucide-react";
import { NotesViewer } from "@/components/notes-viewer";
import { useState } from "react";

interface TenantsListProps {
    tenants: Tenant[];
}

function TenantRow({ tenant }: { tenant: Tenant }) {
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    
    const formatWhatsAppLink = (phone: string) => {
        const cleanedPhone = phone.replace(/[^0-9]/g, '');
        return `https://wa.me/${cleanedPhone}`;
    }

    return (
        <TableRow key={tenant.id}>
            <TableCell className="font-medium">{tenant.name}</TableCell>
            <TableCell>{tenant.dni}</TableCell>
            <TableCell>
                {tenant.email ? (
                    <a href={`mailto:${tenant.email}`} className="text-primary hover:underline">
                        {tenant.email}
                    </a>
                ) : null}
            </TableCell>
            <TableCell>
                {tenant.phone ? (
                    <a href={formatWhatsAppLink(tenant.phone)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {tenant.phone}
                    </a>
                ) : null}
            </TableCell>
            <TableCell>{`${tenant.address}, ${tenant.city}, ${tenant.country}`}</TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <NotesViewer 
                    notes={tenant.notes} 
                    title={`Notas sobre ${tenant.name}`}
                    isOpen={isNotesOpen}
                    onOpenChange={setIsNotesOpen}
                />
                 <Button variant="ghost" size="icon" onClick={() => setIsNotesOpen(true)} disabled={!tenant.notes}>
                    <FileText className="h-4 w-4" />
                    <span className="sr-only">Ver Notas</span>
                </Button>
                <TenantEditForm tenant={tenant} />
                <TenantDeleteForm tenantId={tenant.id} />
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


export default function TenantsList({ tenants }: TenantsListProps) {
    if (tenants.length === 0) {
        return <p className="text-sm text-center text-muted-foreground py-8">No hay inquilinos para mostrar con los filtros seleccionados.</p>;
    }

    

  return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant: Tenant) => (
              <TenantRow key={tenant.id} tenant={tenant} />
            ))}
          </TableBody>
        </Table>
  );
}
