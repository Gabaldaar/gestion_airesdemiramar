
'use client';

import { useState, useMemo } from 'react';
import { Tenant, BookingWithDetails } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from './ui/label';
import { Button } from './ui/button';
import TenantsList from './tenants-list';
import { Mail } from 'lucide-react';

type BookingStatusFilter = 'all' | 'current' | 'upcoming' | 'closed';

interface TenantsClientProps {
  initialTenants: Tenant[];
  allBookings: BookingWithDetails[];
}

export default function TenantsClient({ initialTenants, allBookings }: TenantsClientProps) {
  const [statusFilter, setStatusFilter] = useState<BookingStatusFilter>('all');

  const filteredTenants = useMemo(() => {
    if (statusFilter === 'all') {
      return initialTenants;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tenantIdsWithMatchingBookings = new Set<string>();

    allBookings.forEach(booking => {
      const bookingStartDate = new Date(booking.startDate);
      const bookingEndDate = new Date(booking.endDate);

      const isCurrent = bookingStartDate <= today && bookingEndDate >= today;
      const isUpcoming = bookingStartDate > today;
      const isClosed = bookingEndDate < today;

      if (statusFilter === 'current' && isCurrent) {
        tenantIdsWithMatchingBookings.add(booking.tenantId);
      } else if (statusFilter === 'upcoming' && isUpcoming) {
        tenantIdsWithMatchingBookings.add(booking.tenantId);
      } else if (statusFilter === 'closed' && isClosed) {
        tenantIdsWithMatchingBookings.add(booking.tenantId);
      }
    });

    return initialTenants.filter(tenant => tenantIdsWithMatchingBookings.has(tenant.id));
  }, [initialTenants, allBookings, statusFilter]);

  const handleClearFilters = () => {
    setStatusFilter('all');
  };
  
  const handleEmailAll = () => {
    const recipients = filteredTenants
      .map(tenant => tenant.email)
      .filter((email): email is string => !!email);
    
    const uniqueRecipients = [...new Set(recipients)];

    if (uniqueRecipients.length > 0) {
        const bcc = uniqueRecipients.join(',');
        const subject = encodeURIComponent("Miramar te espera");
        window.location.href = `mailto:?bcc=${bcc}&subject=${subject}`;
    } else {
        alert("No hay inquilinos con email en la selección actual para enviar correos.");
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
      <TenantsList tenants={filteredTenants} />
    </div>
  );
}
