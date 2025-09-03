
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTenants, Tenant } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { TenantAddForm } from "@/components/tenant-add-form";
import { TenantEditForm } from "@/components/tenant-edit-form";
import { TenantDeleteForm } from "@/components/tenant-delete-form";
import { History } from "lucide-react";


export default async function TenantsPage() {
  const tenants = await getTenants();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Inquilinos</CardTitle>
          <CardDescription>
            Administra la información de tus inquilinos.
          </CardDescription>
        </div>
        <TenantAddForm />
      </CardHeader>
      <CardContent>
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
              <TableRow key={tenant.id}>
                <TableCell className="font-medium">{tenant.name}</TableCell>
                <TableCell>{tenant.dni}</TableCell>
                <TableCell>{tenant.email}</TableCell>
                <TableCell>{tenant.phone}</TableCell>
                <TableCell>{`${tenant.address}, ${tenant.city}, ${tenant.country}`}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
