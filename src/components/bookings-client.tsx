
'use client';

import { useState, useMemo } from 'react';
import { BookingWithDetails, ContractStatus, Property, Tenant } from '@/lib/data';
import BookingsList from '@/components/bookings-list';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from './ui/label';

type StatusFilter = 'all' | 'current' | 'upcoming' | 'closed' | 'with-debt';
type ContractStatusFilter = 'all' | ContractStatus;


interface BookingsClientProps {
  initialBookings: BookingWithDetails[];
  properties: Property[];
  tenants: Tenant[];
  initialTenantIdFilter?: string;
}

export default function BookingsClient({ initialBookings, properties, tenants, initialTenantIdFilter }: BookingsClientProps) {
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [propertyIdFilter, setPropertyIdFilter] = useState<string>('all');
  const [contractStatusFilter, setContractStatusFilter] = useState<ContractStatusFilter>('all');
  
  // Apply the initial tenant filter if it exists
  const bookingsForTenant = useMemo(() => {
    if (!initialTenantIdFilter) {
      return initialBookings;
    }
    return initialBookings.filter(b => b.tenantId === initialTenantIdFilter);
  }, [initialBookings, initialTenantIdFilter]);


  const filteredBookings = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return bookingsForTenant.filter(booking => {
      const bookingStartDate = new Date(booking.startDate);
      const bookingEndDate = new Date(booking.endDate);

      // Property Filter
      if (propertyIdFilter !== 'all' && booking.propertyId !== propertyIdFilter) {
        return false;
      }
      
      // Contract Status Filter
      if (contractStatusFilter !== 'all' && (booking.contractStatus || 'not_sent') !== contractStatusFilter) {
          return false;
      }

      // Date Range Filter
      if (fromDate && bookingStartDate < fromDate) {
        return false;
      }
      if (toDate && bookingStartDate > toDate) {
        return false;
      }

      // Status Filter
      if (statusFilter !== 'all') {
         const isCurrent = bookingStartDate <= today && bookingEndDate >= today;
         const isUpcoming = bookingStartDate > today;
         const isClosed = bookingEndDate < today;
         const hasDebt = booking.balance > 0;

         if (statusFilter === 'current' && !isCurrent) return false;
         if (statusFilter === 'upcoming' && !isUpcoming) return false;
         if (statusFilter === 'closed' && !isClosed) return false;
         if (statusFilter === 'with-debt' && !hasDebt) return false;
      }
      
      return true;
    });
  }, [bookingsForTenant, fromDate, toDate, statusFilter, propertyIdFilter, contractStatusFilter]);

  const handleClearFilters = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setStatusFilter('all');
    setPropertyIdFilter('all');
    setContractStatusFilter('all');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg bg-muted/50 flex-wrap">
        <div className="grid gap-2">
            <Label>Propiedad</Label>
            <Select value={propertyIdFilter} onValueChange={setPropertyIdFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Propiedad" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {properties.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="grid gap-2">
            <Label>Desde</Label>
            <DatePicker date={fromDate} onDateSelect={setFromDate} placeholder="Desde" />
        </div>
        <div className="grid gap-2">
            <Label>Hasta</Label>
            <DatePicker date={toDate} onDateSelect={setToDate} placeholder="Hasta" />
        </div>
        <div className="grid gap-2">
            <Label>Estado</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="current">En Curso</SelectItem>
                    <SelectItem value="upcoming">Próximas</SelectItem>
                    <SelectItem value="closed">Cerradas</SelectItem>
                    <SelectItem value="with-debt">Con Deuda</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="grid gap-2">
            <Label>Contrato</Label>
            <Select value={contractStatusFilter} onValueChange={(value) => setContractStatusFilter(value as ContractStatusFilter)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Contrato" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="not_sent">S/Enviar</SelectItem>
                    <SelectItem value="sent">Enviado</SelectItem>
                    <SelectItem value="signed">Firmado</SelectItem>
                    <SelectItem value="not_required">N/A</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="self-end">
             <Button variant="outline" onClick={handleClearFilters}>Limpiar Filtros</Button>
        </div>
      </div>
      <BookingsList bookings={filteredBookings} properties={properties} tenants={tenants} showProperty={true} />
    </div>
  );
}
