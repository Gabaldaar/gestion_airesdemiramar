
'use client';

import { useState, useMemo, useEffect } from 'react';
import { BookingWithDetails, ContractStatus, Property, Tenant, getEmailSettings, Origin, GuaranteeStatus, Provider } from '@/lib/data';
import BookingsList from '@/components/bookings-list';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from './ui/label';
import { Download, Mail, ChevronDown, Copy, ListFilter, ChevronUp } from 'lucide-react';
import { format, isWithinInterval, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
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
import { useAuth } from './auth-provider';
import { Input } from './ui/input';
import { APP_CONFIG } from '@/lib/app-config';
import { useTranslation } from '@/i18n/useTranslation';
import useWindowSize from '@/hooks/use-window-size';

type ContractStatusFilter = 'all' | ContractStatus;
type GuaranteeStatusFilter = 'all' | GuaranteeStatus;
type SortOrder = 'upcoming' | 'distant';

interface StatusFilters {
  current: boolean;
  upcoming: boolean;
  closed: boolean;
  'with-debt': boolean;
  cancelled: boolean;
  pending: boolean;
}

export interface Filters {
    searchTerm: string;
    from?: Date;
    to?: Date;
    statusFilters: StatusFilters;
    propertyIdFilter: string;
    contractStatusFilter: ContractStatusFilter;
    guaranteeStatusFilter: GuaranteeStatusFilter;
    originIdFilter: string;
    sortOrder: SortOrder;
    tenantIdFilter?: string;
}

interface BookingsClientProps {
  initialBookings: BookingWithDetails[];
  properties: Property[];
  tenants: Tenant[];
  origins: Origin[];
  providers: Provider[];
  onDataChanged: () => void;
  filters: Filters;
  onFiltersChange: (newFilters: Partial<Filters>) => void;
}

export default function BookingsClient({ initialBookings, properties, tenants, origins, providers, onDataChanged, filters, onFiltersChange }: BookingsClientProps) {
  const { appUser, orgId } = useAuth();
  const { t } = useTranslation();
  const { width } = useWindowSize();
  const isMobile = typeof width === 'number' ? width < 768 : false;
  const isPersonalFlavor = appUser?.appFlavor !== 'commercial';

  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [replyToEmail, setReplyToEmail] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  const [localSearchTerm, setLocalSearchTerm] = useState(filters.searchTerm);

  const statusLabels: Record<string, string> = {
    current: t('bookings.status.current'),
    upcoming: t('bookings.status.upcoming'),
    closed: t('bookings.status.closed'),
    'with-debt': t('bookings.status.with_debt'),
    cancelled: t('bookings.status.cancelled'),
    pending: t('bookings.status.pending'),
  };
  
  useEffect(() => {
    if (orgId) {
      getEmailSettings(orgId).then(settings => {
          if (settings?.replyToEmail) {
              setReplyToEmail(settings.replyToEmail);
          }
      });
    }
  }, [orgId]);
  
  useEffect(() => {
    setLocalSearchTerm(filters.searchTerm);
  }, [filters.searchTerm]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearchTerm !== filters.searchTerm) {
        onFiltersChange({ searchTerm: localSearchTerm });
      }
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [localSearchTerm, onFiltersChange, filters.searchTerm]);

  // Set initial filter state based on device
  useEffect(() => {
    if (width !== undefined) {
      setIsFilterExpanded(!isMobile);
    }
  }, [isMobile, width]);


  const filteredBookings = useMemo(() => {
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const { searchTerm, from, to, statusFilters, propertyIdFilter, contractStatusFilter, guaranteeStatusFilter, originIdFilter, sortOrder, tenantIdFilter } = filters;
    
    let bookingsToFilter = tenantIdFilter ? initialBookings.filter(b => b.tenantId === tenantIdFilter) : initialBookings;

    const activeStatusFilters = Object.entries(statusFilters)
        .filter(([, isActive]) => isActive)
        .map(([status]) => status);
    
    const hasActiveStatusFilter = activeStatusFilters.length > 0;

    const filtered = bookingsToFilter.filter(booking => {
        const bookingStartDate = parseDateSafely(booking.startDate);
        if (!bookingStartDate) return false;
        
        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            const tenantName = booking.tenant?.name.toLowerCase() || '';
            const propertyName = booking.property?.name.toLowerCase() || '';
            const notes = booking.notes?.toLowerCase() || '';
            if (!tenantName.includes(lowercasedFilter) && !propertyName.includes(lowercasedFilter) && !notes.includes(lowercasedFilter)) {
                return false;
            }
        }
      
      if (propertyIdFilter !== 'all' && booking.propertyId !== propertyIdFilter) {
        return false;
      }
      
      if (contractStatusFilter !== 'all' && (booking.contractStatus || 'not_sent') !== contractStatusFilter) {
          return false;
      }

      if (guaranteeStatusFilter !== 'all' && (booking.guaranteeStatus || 'not_solicited') !== guaranteeStatusFilter) {
        return false;
      }

      if (originIdFilter !== 'all' && (booking.originId || 'none') !== originIdFilter) {
        return false;
      }

      if (from) {
        const fromDateUTC = new Date(Date.UTC(from.getFullYear(), from.getMonth(), from.getDate()));
        if (bookingStartDate < fromDateUTC) return false;
      }
      if (to) {
        const toDateUTC = new Date(Date.UTC(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999));
        if (bookingStartDate > toDateUTC) return false;
      }

      if (hasActiveStatusFilter) {
        const bookingEndDate = parseDateSafely(booking.endDate);
        if (!bookingEndDate) return false;
        const bookingVisualStatuses = new Set<string>();

        if (booking.status === 'cancelled') {
            bookingVisualStatuses.add('cancelled');
        } else if (booking.status === 'pending') {
            bookingVisualStatuses.add('pending');
        } else {
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
        
        return activeStatusFilters.some(filter => bookingVisualStatuses.has(filter));
      }
      
      return true;
    });

    return filtered.sort((a, b) => {
        const dateA = parseDateSafely(a.startDate)?.getTime() ?? 0;
        const dateB = parseDateSafely(b.startDate)?.getTime() ?? 0;
        
        return sortOrder === 'upcoming' ? dateA - dateB : dateB - dateA;
    });

  }, [initialBookings, filters]);

  const handleClearFilters = () => {
    const clearedFilters: Partial<Filters> = {
        searchTerm: '',
        from: undefined,
        to: undefined,
        statusFilters: { current: false, upcoming: false, closed: false, 'with-debt': false, cancelled: false, pending: false },
        propertyIdFilter: 'all',
        contractStatusFilter: 'all',
        guaranteeStatusFilter: 'all',
        originIdFilter: 'all',
        sortOrder: 'distant'
    };
    onFiltersChange(clearedFilters);
    setLocalSearchTerm('');
  };
  
  const handleStatusFilterChange = (status: keyof StatusFilters, checked: boolean) => {
    const newStatusFilters = { ...filters.statusFilters, [status]: checked };
    onFiltersChange({ statusFilters: newStatusFilters });
  };

  const handleDownloadCSV = () => {
    const headers = ["Propiedad", "Inquilino", "Check-in", "Check-out", "Teléfono", "Observaciones"];
    const escapeCSV = (str: string | undefined | null): string => {
        if (!str) return '""';
        const newStr = str.replace(/"/g, '""');
        return `"${newStr}"`;
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

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reservas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEmailAll = () => {
    const recipients = filteredBookings.map(booking => booking.tenant?.email).filter((email): email is string => !!email);
    const uniqueRecipients = [...new Set(recipients)];
    if (uniqueRecipients.length > 0) {
        let mailtoLink = `mailto:?bcc=${uniqueRecipients.join(',')}`;
        const params = [];
        params.push(`subject=${encodeURIComponent(`${APP_CONFIG.name} te espera`)}`);
        if (replyToEmail) {
            params.push(`reply-to=${encodeURIComponent(replyToEmail)}`);
        }
        mailtoLink += `&${params.join('&')}`;
        window.location.href = mailtoLink;
    } else {
        toast({ variant: "destructive", title: t('common.error'), description: "No hay inquilinos con email en la selección actual." });
    }
  };

  const handleCopySummary = (type: 'check-ins' | 'check-outs') => {
    const today = startOfToday();
    const formatDateForDisplay = (date: Date | undefined): string => {
        if (!date) return 'Fecha inv.';
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth();
        const day = date.getUTCDate();
        const localDate = new Date(year, month, day);
        return format(localDate, "dd/MM/yyyy", { locale: es });
    };
    let textToCopy = '';
    let bookingsToCopy: BookingWithDetails[] = [];
    if (type === 'check-ins') {
        bookingsToCopy = filteredBookings.filter(b => {
            const startDate = parseDateSafely(b.startDate);
            return startDate && startDate >= today && (!b.status || b.status === 'active');
        }).sort((a, b) => (parseDateSafely(a.startDate)?.getTime() || 0) - (parseDateSafely(b.startDate)?.getTime() || 0));
        textToCopy = `*Próximos Check-ins:*\n` + bookingsToCopy.map(b => `- ${b.property?.name}: *${b.tenant?.name}* llega el *${formatDateForDisplay(parseDateSafely(b.startDate))}*. Tel: ${b.tenant.countryCode || '+54'} ${b.tenant.phone}`).join('\n');
    } else if (type === 'check-outs') {
        bookingsToCopy = filteredBookings.filter(b => {
            const endDate = parseDateSafely(b.endDate);
            return endDate && endDate >= today && (!b.status || b.status === 'active');
        }).sort((a, b) => (parseDateSafely(a.endDate)?.getTime() || 0) - (parseDateSafely(b.endDate)?.getTime() || 0));
        textToCopy = `*Próximos Check-outs:*\n` + bookingsToCopy.map(b => `- ${b.property?.name}: *${b.tenant?.name}* se retira el *${formatDateForDisplay(parseDateSafely(b.endDate))}*. Tel: ${b.tenant.countryCode || '+54'} ${b.tenant.phone}`).join('\n');
    }
    if (bookingsToCopy.length === 0) {
        toast({ title: t('common.none'), description: `No hay ${type} próximos en la selección actual.`, variant: 'destructive' });
        return;
    }
    navigator.clipboard.writeText(textToCopy);
    toast({ title: t('common.success'), description: `Resumen de ${bookingsToCopy.length} ${type} copiado.` });
  };
  
  return (
    <div className="space-y-4">
        <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/70 shadow-sm">
            <div className="flex items-center justify-between mb-1 w-full">
                <button 
                    onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary hover:opacity-80 transition-opacity"
                >
                    <ListFilter className="h-4 w-4" /> 
                    {t('common.filters')}
                    {isFilterExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                <span className="text-[10px] font-bold bg-background/50 px-2 py-0.5 rounded-full text-primary border border-primary/20">
                    {filteredBookings.length} / {initialBookings.length}
                </span>
            </div>
            
            {isFilterExpanded && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid gap-2">
                        <Label>{t('common.search')}</Label>
                        <Input placeholder={t('bookings.filters.property') + ", " + t('bookings.table.tenant') + "..."} value={localSearchTerm} onChange={(e) => setLocalSearchTerm(e.target.value)} className="bg-background" />
                    </div>
                    <div className="grid gap-2">
                        <Label>{t('common.from')}</Label>
                        <DatePicker date={filters.from} onDateSelect={(date) => onFiltersChange({ from: date })} placeholder={t('common.from')} />
                    </div>
                    <div className="grid gap-2">
                        <Label>{t('common.to')}</Label>
                        <DatePicker date={filters.to} onDateSelect={(date) => onFiltersChange({ to: date })} placeholder={t('common.to')} />
                    </div>
                    <div className="grid gap-2">
                        <Label>{t('bookings.filters.property')}</Label>
                        <Select value={filters.propertyIdFilter} onValueChange={(value) => onFiltersChange({ propertyIdFilter: value })}>
                            <SelectTrigger className="bg-background"><SelectValue placeholder={t('bookings.filters.property')} /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('common.all')}</SelectItem>
                                {properties.map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>{t('bookings.filters.status')}</Label>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button type="button" variant="outline" className="w-full justify-between bg-background">
                                    <span>{Object.values(filters.statusFilters).filter(Boolean).length === 0 ? t('common.all') : `${Object.values(filters.statusFilters).filter(Boolean).length} seleccionados`}</span>
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                <DropdownMenuLabel>{t('bookings.filters.status')}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {Object.keys(filters.statusFilters).map((status) => (
                                    <DropdownMenuCheckboxItem key={status} checked={filters.statusFilters[status as keyof StatusFilters]} onCheckedChange={(checked) => handleStatusFilterChange(status as keyof StatusFilters, !!checked)} onSelect={(event) => event.preventDefault()}>
                                        {statusLabels[status] || status}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="grid gap-2">
                        <Label>{t('bookings.filters.contract')}</Label>
                        <Select value={filters.contractStatusFilter} onValueChange={(value) => onFiltersChange({ contractStatusFilter: value as ContractStatusFilter })}>
                            <SelectTrigger className="bg-background"><SelectValue placeholder={t('bookings.filters.contract')} /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('common.all')}</SelectItem>
                                <SelectItem value="not_sent">{t('bookings.contract_status.not_sent')}</SelectItem>
                                <SelectItem value="sent">{t('bookings.contract_status.sent')}</SelectItem>
                                <SelectItem value="signed">{t('bookings.contract_status.signed')}</SelectItem>
                                <SelectItem value="not_required">{t('bookings.contract_status.not_required')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>{t('bookings.filters.guarantee')}</Label>
                        <Select value={filters.guaranteeStatusFilter} onValueChange={(value) => onFiltersChange({ guaranteeStatusFilter: value as GuaranteeStatusFilter })}>
                            <SelectTrigger className="bg-background"><SelectValue placeholder={t('bookings.filters.guarantee')} /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('common.all')}</SelectItem>
                                <SelectItem value="not_solicited">{t('bookings.guarantee_status.not_solicited')}</SelectItem>
                                <SelectItem value="solicited">{t('bookings.guarantee_status.solicited')}</SelectItem>
                                <SelectItem value="received">{t('bookings.guarantee_status.received')}</SelectItem>
                                <SelectItem value="returned">{t('bookings.guarantee_status.returned')}</SelectItem>
                                <SelectItem value="not_applicable">{t('bookings.guarantee_status.not_applicable')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>{t('bookings.filters.origin')}</Label>
                        <Select value={filters.originIdFilter} onValueChange={(value) => onFiltersChange({ originIdFilter: value })}>
                            <SelectTrigger className="bg-background"><SelectValue placeholder={t('bookings.filters.origin')} /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('common.all')}</SelectItem>
                                <SelectItem value="none">{t('common.none')}</SelectItem>
                                {origins.map(o => (<SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>))}
                            </SelectContent>
                    </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>{t('bookings.filters.sort')}</Label>
                        <Select value={filters.sortOrder} onValueChange={(value) => onFiltersChange({ sortOrder: value as SortOrder })}>
                            <SelectTrigger className="bg-background"><SelectValue placeholder={t('bookings.filters.sort')} /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="distant">{t('bookings.filters.sort_options.distant')}</SelectItem>
                                <SelectItem value="upcoming">{t('bookings.filters.sort_options.upcoming')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {isFilterExpanded && (
                <div className="flex flex-col sm:flex-row sm:justify-end gap-2 border-t pt-4 mt-2">
                    <Button type="button" variant="outline" onClick={handleClearFilters} className="w-full sm:w-auto bg-background">{t('common.clean')}</Button>
                    <Button type="button" onClick={() => handleCopySummary('check-ins')} className="w-full sm:w-auto"><Copy className="mr-2 h-4 w-4"/>Check-ins</Button>
                    <Button type="button" onClick={() => handleCopySummary('check-outs')} className="w-full sm:w-auto"><Copy className="mr-2 h-4 w-4"/>Check-outs</Button>
                    <Button type="button" onClick={handleDownloadCSV} className="w-full sm:w-auto"><Download className="mr-2 h-4 w-4"/>CSV</Button>
                    <Button type="button" onClick={handleEmailAll} className="w-full sm:w-auto"><Mail className="mr-2 h-4 w-4"/>{t('common.email_all')}</Button>
                </div>
            )}
        </div>
        <BookingsList bookings={filteredBookings} properties={properties} tenants={tenants} origins={origins} providers={providers} showProperty={true} onDataChanged={onDataChanged} isPersonalFlavor={isPersonalFlavor} />
    </div>
  );
}
