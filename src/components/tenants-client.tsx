

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Tenant, BookingWithDetails, getEmailSettings, Origin, getTenants } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from './ui/label';
import { Button } from './ui/button';
import TenantsList from './tenants-list';
import { TenantEditForm } from './tenant-edit-form';
import { Mail } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { isWithinInterval } from 'date-fns';
import { parseDateSafely } from '@/lib/utils';

type BookingStatusFilter = 'all' | 'current' | 'upcoming' | 'closed' | 'cancelled' | 'pending';

interface TenantsClientProps {
  initialTenants: Tenant[];
  allBookings: BookingWithDetails[];
  origins: Origin[];
  onFilteredTenantsChange: (count: number) => void;
}

export default function TenantsClient({ initialTenants, allBookings, origins, onFilteredTenantsChange }: TenantsClientProps) {
  const [tenants, setTenants] = useState(initialTenants);
  const [statusFilter, setStatusFilter] = useState<BookingStatusFilter>('all');
  const [originFilter, setOriginFilter] = useState<string>('all');
  const [replyToEmail, setReplyToEmail] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  const [editingTenant, setEditingTenant] = useState<Tenant | undefined>(undefined);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  useEffect(() => {
    getEmailSettings().then(settings => {
        if (settings?.replyToEmail) {
            setReplyToEmail(settings.replyToEmail);
        }
    });
  }, []);

  // When initialTenants changes (due to a server action revalidating the page), update our state
  useEffect(() => {
    setTenants(initialTenants);
  }, [initialTenants]);

  const refreshTenants = useCallback(async () => {
    const updatedTenants = await getTenants();
    setTenants(updatedTenants);
  }, []);

  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setIsEditDialogOpen(true);
  };


  const filteredTenants = useMemo(() => {
    let currentTenants = tenants;

    // Filter by Origin
    if (originFilter !== 'all') {
      currentTenants = currentTenants.filter(tenant => tenant.originId === originFilter);
    }

    // Filter by Booking Status
    if (statusFilter !== 'all') {
      const now = new Date();
      const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

      const tenantIdsWithMatchingBookings = new Set<string>();

      allBookings.forEach(booking => {
        const bookingStartDate = parseDateSafely(booking.startDate);
        const bookingEndDate = parseDateSafely(booking.endDate);
        if (!bookingStartDate || !bookingEndDate) return;

        const isActive = !booking.status || booking.status === 'active';
        
        const isCurrent = isActive && isWithinInterval(todayUTC, { start: bookingStartDate, end: bookingEndDate });
        const isUpcoming = isActive && bookingStartDate > todayUTC;
        const isClosed = isActive && bookingEndDate < todayUTC;
        const isCancelled = booking.status === 'cancelled';
        const isPending = booking.status === 'pending';

        if (statusFilter === 'current' && isCurrent) {
          tenantIdsWithMatchingBookings.add(booking.tenantId);
        } else if (statusFilter === 'upcoming' && isUpcoming) {
          tenantIdsWithMatchingBookings.add(booking.tenantId);
        } else if (statusFilter === 'closed' && isClosed) {
          tenantIdsWithMatchingBookings.add(booking.tenantId);
        } else if (statusFilter === 'cancelled' && isCancelled) {
            tenantIdsWithMatchingBookings.add(booking.tenantId);
        } else if (statusFilter === 'pending' && isPending) {
            tenantIdsWithMatchingBookings.add(booking.tenantId);
        }
      });
      currentTenants = currentTenants.filter(tenant => tenantIdsWithMatchingBookings.has(tenant.id));
    }
    
    return currentTenants;
  }, [tenants, allBookings, statusFilter, originFilter]);

  // Effect to update the count in the parent component
  useEffect(() => {
    onFilteredTenantsChange(filteredTenants.length);
  }, [filteredTenants, onFilteredTenantsChange]);


  const handleClearFilters = () => {
    setStatusFilter('all');
    setOriginFilter('all');
  };
  
  const handleEmailAll = () => {
    const recipients = filteredTenants
      .map(tenant => tenant.email)
      .filter((email): email is string => !!email);
    
    const uniqueRecipients = [...new Set(recipients)];

    if (uniqueRecipients.length > 0) {
        let mailtoLink = `mailto:?bcc=${uniqueRecipients.join(',')}`;
        const params = [];
        params.push(`subject=${encodeURIComponent("Miramar te espera")}`);

        if (replyToEmail) {
            params.push(`reply-to=${encodeURIComponent(replyToEmail)}`);
        }
        
        mailtoLink += `&${params.join('&')}`;
        window.location.href = mailtoLink;
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: "No hay inquilinos con email en la selección actual.",
        });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/50 sm:flex-row sm:items-end">
        <div className="grid gap-2">
            <Label>Estado de la Reserva</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as BookingStatusFilter)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrar por reserva" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="current">Con Reserva en Curso</SelectItem>
                    <SelectItem value="upcoming">Con Reserva Próxima</SelectItem>
                    <SelectItem value="closed">Con Reserva Cerrada</SelectItem>
                    <SelectItem value="cancelled">Con Reserva Cancelada</SelectItem>
                    <SelectItem value="pending">Con Reserva en Espera</SelectItem>
                </SelectContent>
            </Select>
        </div>
         <div className="grid gap-2">
            <Label>Origen</Label>
            <Select value={originFilter} onValueChange={setOriginFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrar por origen" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {origins.map(origin => (
                      <SelectItem key={origin.id} value={origin.id}>{origin.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={handleClearFilters}>Limpiar Filtros</Button>
            <Button onClick={handleEmailAll}>
                <Mail className="mr-2 h-4 w-4"/>
                Email a Todos
            </Button>
        </div>
      </div>
      <TenantsList 
        tenants={filteredTenants} 
        origins={origins} 
        onDataChanged={refreshTenants} 
        onEditTenant={handleEditTenant}
      />
      {editingTenant && (
        <TenantEditForm
            tenant={editingTenant}
            onTenantUpdated={refreshTenants}
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
        />
      )}
    </div>
  );
}

    
