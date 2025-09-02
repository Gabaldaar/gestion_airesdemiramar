
"use client";

import { useEffect, useState } from "react";
import { getTenants, getBookings, getProperties, type Tenant, type Booking, type Property } from "@/lib/data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, History } from "lucide-react";
import { TenantForm } from "./_components/tenant-form";
import { useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";

function TenantHistoryDialog({ tenant, bookings, properties }: { tenant: Tenant, bookings: Booking[], properties: Property[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const tenantBookings = bookings.filter(b => b.tenantId === tenant.id);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <History className="h-4 w-4" />
          <span className="sr-only">Ver Historial</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Historial de Alquileres de {tenant.name}</DialogTitle>
          <DialogDescription>
            Un resumen de todas las propiedades que este inquilino ha alquilado.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {tenantBookings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenantBookings.map(booking => {
                  const property = properties.find(p => p.id === booking.propertyId);
                  return (
                    <TableRow key={booking.id}>
                      <TableCell>{property?.name || 'N/A'}</TableCell>
                      <TableCell>{format(new Date(booking.checkIn), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{format(new Date(booking.checkOut), "dd/MM/yyyy")}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">Este inquilino no tiene reservas registradas.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const searchParams = useSearchParams()

  const fetchData = () => {
    setTenants(getTenants());
    setBookings(getBookings());
    setProperties(getProperties());
  };

  useEffect(() => {
    fetchData();
    if(searchParams.get('new') === 'true') {
        handleOpenForm(null);
    }
  }, [searchParams]);

  const handleOpenForm = (tenant: Tenant | null) => {
    setSelectedTenant(tenant);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedTenant(null);
  };
  
  const handleTenantSaved = () => {
    fetchData();
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Inquilinos</h1>
        <Button onClick={() => handleOpenForm(null)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Inquilino
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell className="font-medium">{tenant.name}</TableCell>
                <TableCell>{tenant.email}</TableCell>
                <TableCell>{tenant.phone}</TableCell>
                <TableCell>{tenant.city}</TableCell>
                <TableCell className="text-right">
                  <TenantHistoryDialog tenant={tenant} bookings={bookings} properties={properties} />
                  <Button variant="ghost" size="icon" onClick={() => handleOpenForm(tenant)}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {isFormOpen && (
        <TenantForm
          tenant={selectedTenant}
          open={isFormOpen}
          onOpenChange={handleFormClose}
          onTenantSaved={handleTenantSaved}
        />
      )}
    </div>
  );
}
