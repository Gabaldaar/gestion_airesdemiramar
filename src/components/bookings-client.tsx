

'use client';

import { useState, useMemo, useEffect } from 'react';
import { BookingWithDetails, ContractStatus, Property, Tenant, getEmailSettings, Origin } from '@/lib/data';
import BookingsList from '@/components/bookings-list';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from './ui/label';
import { Download, Mail, ChevronDown } from 'lucide-react';
import { format, isWithinInterval, isPast } from 'date-fns';
import { useToast } from './ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { parseDateSafely } from '@/lib/utils';


type ContractStatusFilter = 'all' | ContractStatus;
type SortOrder = 'upcoming' | 'distant';

interface StatusFilters {
  current: boolean;
  upcoming: boolean;
  closed: boolean;
  'with-debt': boolean;
  cancelled: boolean;
  pending: boolean;
}

const initialStatusFilters: StatusFilters = {
    current: false,
    upcoming: false,
    closed: false,
    'with-debt': false,
    cancelled: false,
    pending: false,
};


interface BookingsClientProps {
  initialBookings: BookingWithDetails[];
  properties: Property[];
  tenants: Tenant[];
  origins: Origin[];
  initialTenantIdFilter?: string;
  onFilteredBookingsChange: (count: number) => void;
  onDataChanged: () => void;
}

export default function BookingsClient({ initialBookings, properties, tenants, origins, initialTenantIdFilter, onFilteredBookingsChange, onDataChanged }: BookingsClientProps) {
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [statusFilters, setStatusFilters] = useState<StatusFilters>(initialStatusFilters);
  const [propertyIdFilter, setPropertyIdFilter] = useState<string>('all');
  const [contractStatusFilter, setContractStatusFilter] = useState<ContractStatusFilter>('all');
  const [originIdFilter, setOriginIdFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('upcoming');
  const [replyToEmail, setReplyToEmail] = useState<string | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    getEmailSettings().then(settings => {
        if (settings?.replyToEmail) {
            setReplyToEmail(settings.replyToEmail);
        }
    });
  }, []);
  
  // Apply the initial tenant filter if it exists
  const bookingsForTenant = useMemo(() => {
    if (!initialTenantIdFilter) {
      return initialBookings;
    }
    return initialBookings.filter(b => b.tenantId === initialTenantIdFilter);
  }, [initialBookings, initialTenantIdFilter]);


  const filteredBookings = useMemo(() => {
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    const activeStatusFilters = Object.entries(statusFilters)
        .filter(([, isActive]) => isActive)
        .map(([status]) => status);
    
    const hasActiveStatusFilter = activeStatusFilters.length > 0;

    const filtered = bookingsForTenant.filter(booking => {
        const bookingStartDate = parseDateSafely(booking.startDate);
        if (!bookingStartDate) return false;
        
      // Property Filter
      if (propertyIdFilter !== 'all' && booking.propertyId !== propertyIdFilter) {
        return false;
      }
      
      // Contract Status Filter
      if (contractStatusFilter !== 'all' && (booking.contractStatus || 'not_sent') !== contractStatusFilter) {
          return false;
      }

      // Origin Filter
      if (originIdFilter !== 'all' && (booking.originId || 'none') !== originIdFilter) {
        return false;
      }

      // Date Range Filter
      if (fromDate) {
        const fromDateUTC = new Date(Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()));
        if (bookingStartDate < fromDateUTC) return false;
      }
      if (toDate) {
        const toDateUTC = new Date(Date.UTC(toDate.getFullYear(), toDate.getMonth(), toDate.getDate()));
        if (bookingStartDate > toDateUTC) return false;
      }

      // Status Filter
      if (hasActiveStatusFilter) {
        const bookingEndDate = parseDateSafely(booking.endDate);
        if (!bookingEndDate) return false;
        const bookingVisualStatuses = new Set<string>();

        if (booking.status === 'cancelled') {
            bookingVisualStatuses.add('cancelled');
        } else if (booking.status === 'pending') {
            bookingVisualStatuses.add('pending');
        } else { // status is 'active' or undefined
            if (isWithinInterval(todayUTC, { start: bookingStartDate, end: bookingEndDate })) {
                bookingVisualStatuses.add('current');
            } else if (bookingStartDate > todayUTC) {
                bookingVisualStatuses.add('upcoming');
            } else {
                bookingVisualStatuses.add('closed');
            }

            if (booking.balance >= 1) {
                 bookingVisualStatuses.add('with-debt');
            }
        }
        
        // Return true if ANY of the booking's statuses match ANY of the active filters
        return activeStatusFilters.some(filter => bookingVisualStatuses.has(filter));
      }
      
      return true;
    });

    // Apply sorting
    return filtered.sort((a, b) => {
        const getStatusPriority = (booking: BookingWithDetails): number => {
            const bookingEndDate = parseDateSafely(booking.endDate);
            if (!bookingEndDate) return 2;
            if (booking.status === 'cancelled' || bookingEndDate < todayUTC) return 2; // Cumplidas y canceladas al final
            if (booking.status === 'pending') return 1; // Pendientes en el medio
            return 0; // Activas y futuras primero
        };

        const priorityA = getStatusPriority(a);
        const priorityB = getStatusPriority(b);

        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }

        // If priorities are the same, sort by date
        const dateA = parseDateSafely(a.startDate)?.getTime() || 0;
        const dateB = parseDateSafely(b.startDate)?.getTime() || 0;
        return sortOrder === 'upcoming' ? dateA - dateB : dateB - a;
    });

  }, [bookingsForTenant, fromDate, toDate, statusFilters, propertyIdFilter, contractStatusFilter, originIdFilter, sortOrder]);
  
  // Effect to update the count in the parent component
  useEffect(() => {
    onFilteredBookingsChange(filteredBookings.length);
  }, [filteredBookings, onFilteredBookingsChange]);


  const handleClearFilters = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setStatusFilters(initialStatusFilters);
    setPropertyIdFilter('all');
    setContractStatusFilter('all');
    setOriginIdFilter('all');
    setSortOrder('upcoming');
  };

  const handleDownloadCSV = () => {
    const headers = [
      "Propiedad",
      "Inquilino",
      "Check-in",
      "Check-out",
      "Teléfono",
      "Observaciones"
    ];

    const escapeCSV = (str: string | undefined | null): string => {
        if (!str) return '""';
        const newStr = str.replace(/"/g, '""'); // Escape double quotes
        return `"${newStr}"`; // Enclose in double quotes
    };

    const rows = filteredBookings.map(booking => {
        const checkInDate = parseDateSafely(booking.startDate);
        const checkOutDate = parseDateSafely(booking.endDate);
        
        return [
          escapeCSV(booking.property?.name),
          escapeCSV(booking.tenant?.name),
          checkInDate ? format(checkInDate, 'yyyy-MM-dd') : '',
          checkOutDate ? format(checkOutDate, 'yyyy-MM-dd') : '',
          escapeCSV(booking.tenant?.phone),
          escapeCSV(booking.notes)
        ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + "\n" 
      + rows.join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reservas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEmailAll = () => {
    const recipients = filteredBookings
      .map(booking => booking.tenant?.email)
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

  const selectedStatusCount = Object.values(statusFilters).filter(Boolean).length;


  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <div className="grid gap-2">
                <Label>Desde</Label>
                <DatePicker date={fromDate} onDateSelect={setFromDate} placeholder="Desde" />
            </div>
            <div className="grid gap-2">
                <Label>Hasta</Label>
                <DatePicker date={toDate} onDateSelect={setToDate} placeholder="Hasta" />
            </div>
            <div className="grid gap-2">
              <Label>Propiedad</Label>
              <Select value={propertyIdFilter} onValueChange={setPropertyIdFilter}>
                  <SelectTrigger>
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
              <Label>Estado</Label>
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                        <span>
                            {selectedStatusCount === 0
                            ? "Seleccionar estado..."
                            : `${selectedStatusCount} estado(s) seleccionado(s)`}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={statusFilters.current}
                      onCheckedChange={(checked) => setStatusFilters(prev => ({ ...prev, current: !!checked }))}
                    >
                      En Curso
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={statusFilters.upcoming}
                      onCheckedChange={(checked) => setStatusFilters(prev => ({ ...prev, upcoming: !!checked }))}
                    >
                      Próximas
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={statusFilters.closed}
                      onCheckedChange={(checked) => setStatusFilters(prev => ({ ...prev, closed: !!checked }))}
                    >
                      Cumplidas
                    </DropdownMenuCheckboxItem>
                     <DropdownMenuCheckboxItem
                      checked={statusFilters['with-debt']}
                      onCheckedChange={(checked) => setStatusFilters(prev => ({ ...prev, 'with-debt': !!checked }))}
                    >
                      Con Deuda
                    </DropdownMenuCheckboxItem>
                     <DropdownMenuCheckboxItem
                      checked={statusFilters.pending}
                      onCheckedChange={(checked) => setStatusFilters(prev => ({ ...prev, pending: !!checked }))}
                    >
                      En Espera
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={statusFilters.cancelled}
                      onCheckedChange={(checked) => setStatusFilters(prev => ({ ...prev, cancelled: !!checked }))}
                    >
                      Canceladas
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
          </div>
          <div className="grid gap-2">
              <Label>Contrato</Label>
              <Select value={contractStatusFilter} onValueChange={(value) => setContractStatusFilter(value as ContractStatusFilter)}>
                  <SelectTrigger>
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
          <div className="grid gap-2">
              <Label>Origen</Label>
              <Select value={originIdFilter} onValueChange={setOriginIdFilter}>
                  <SelectTrigger>
                      <SelectValue placeholder="Origen" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="none">Sin Origen</SelectItem>
                      {origins.map(o => (
                          <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
          </div>
          <div className="grid gap-2">
              <Label>Ordenar Por</Label>
              <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
                  <SelectTrigger>
                      <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="upcoming">Próximas Primero</SelectItem>
                      <SelectItem value="distant">Lejanas Primero</SelectItem>
                  </SelectContent>
              </Select>
          </div>
        </div>
         <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
              <Button variant="outline" onClick={handleClearFilters} className="w-full sm:w-auto">Limpiar Filtros</Button>
              <Button onClick={handleDownloadCSV} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4"/>
                Descargar CSV
              </Button>
              <Button onClick={handleEmailAll} className="w-full sm:w-auto">
                <Mail className="mr-2 h-4 w-4"/>
                Email a Todos
              </Button>
          </div>
      </div>
      <BookingsList bookings={filteredBookings} properties={properties} tenants={tenants} origins={origins} showProperty={true} onDataChanged={onDataChanged} />
    </div>
  );
}

    

    
