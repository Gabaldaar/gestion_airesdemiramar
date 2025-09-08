
'use client';

import { useState, useMemo, useEffect } from 'react';
import { BookingWithDetails, ContractStatus, Property, Tenant, getEmailSettings } from '@/lib/data';
import BookingsList from '@/components/bookings-list';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from './ui/label';
import { Download, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from './ui/use-toast';

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

    const rows = filteredBookings.map(booking => [
      escapeCSV(booking.property?.name),
      escapeCSV(booking.tenant?.name),
      format(new Date(booking.startDate), 'yyyy-MM-dd'),
      format(new Date(booking.endDate), 'yyyy-MM-dd'),
      escapeCSV(booking.tenant?.phone),
      escapeCSV(booking.notes)
    ].join(','));

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
        const bcc = uniqueRecipients.join(',');
        const subject = "Miramar te espera";
        
        let mailtoLink = `mailto:?bcc=${bcc}&subject=${encodeURIComponent(subject)}`;
        
        if (replyToEmail) {
            mailtoLink += `&reply-to=${encodeURIComponent(replyToEmail)}`;
        }
        
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
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label>Desde</Label>
                <DatePicker date={fromDate} onDateSelect={setFromDate} placeholder="Desde" />
            </div>
            <div className="grid gap-2">
                <Label>Hasta</Label>
                <DatePicker date={toDate} onDateSelect={setToDate} placeholder="Hasta" />
            </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-wrap">
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
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                  <SelectTrigger>
                      <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="current">En Curso</SelectItem>
                      <SelectItem value="upcoming">Próximas</SelectItem>
                      <SelectItem value="closed">Cumplidas</SelectItem>
                      <SelectItem value="with-debt">Con Deuda</SelectItem>
                  </SelectContent>
              </Select>
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
      <BookingsList bookings={filteredBookings} properties={properties} tenants={tenants} showProperty={true} />
    </div>
  );
}
