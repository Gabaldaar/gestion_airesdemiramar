
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Tenant, Booking, getEmailSettings, Origin } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from './ui/label';
import { Button } from './ui/button';
import TenantsList from './tenants-list';
import { TenantEditForm } from './tenant-edit-form';
import { Mail, Search, X, ListFilter, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { isWithinInterval } from 'date-fns';
import { parseDateSafely } from '@/lib/utils';
import { useAuth } from './auth-provider';
import { Input } from './ui/input';
import { APP_CONFIG } from '@/lib/app-config';
import { useTranslation } from '@/i18n/useTranslation';
import useWindowSize from '@/hooks/use-window-size';

type BookingStatusFilter = 'all' | 'current' | 'upcoming' | 'closed' | 'cancelled' | 'pending';
type RatingFilter = 'all' | 'none' | '1' | '2' | '3' | '4' | '5';

interface TenantsClientProps {
  initialTenants: Tenant[];
  allBookings: Booking[];
  origins: Origin[];
  onFilteredTenantsChange: (count: number) => void;
  onDataChanged: () => void;
}

export default function TenantsClient({ initialTenants, allBookings, origins, onFilteredTenantsChange, onDataChanged }: TenantsClientProps) {
  const { orgId } = useAuth();
  const { t } = useTranslation();
  const { width } = useWindowSize();
  const isMobile = typeof width === 'number' ? width < 768 : false;

  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatusFilter>('all');
  const [originFilter, setOriginFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [replyToEmail, setReplyToEmail] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  const [editingTenant, setEditingTenant] = useState<Tenant | undefined>(undefined);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const lastCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (orgId) {
        getEmailSettings(orgId).then(settings => {
            if (settings?.replyToEmail) {
                setReplyToEmail(settings.replyToEmail);
            }
        });
    }
  }, [orgId]);

  // Set initial filter state based on device: always closed on mobile
  useEffect(() => {
    if (width !== undefined) {
      setIsFilterExpanded(!isMobile);
    }
  }, [isMobile, width]);

  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setIsEditDialogOpen(true);
  };

  const filteredTenants = useMemo(() => {
    let currentTenants = [...initialTenants];

    if (searchTerm) {
        const lowerercasedFilter = searchTerm.toLowerCase();
        currentTenants = currentTenants.filter(tenant => {
            return (
                tenant.name.toLowerCase().includes(lowerercasedFilter) ||
                (tenant.dni && tenant.dni.toLowerCase().includes(lowerercasedFilter)) ||
                (tenant.email && tenant.email.toLowerCase().includes(lowerercasedFilter)) ||
                (tenant.phone && tenant.phone.includes(lowerercasedFilter))
            );
        });
    }

    if (originFilter !== 'all') {
      currentTenants = currentTenants.filter(tenant => tenant.originId === originFilter);
    }

    if (ratingFilter !== 'all') {
      if (ratingFilter === 'none') {
        currentTenants = currentTenants.filter(tenant => !tenant.rating || tenant.rating === 0);
      } else {
        const rating = parseInt(ratingFilter, 10);
        currentTenants = currentTenants.filter(tenant => tenant.rating === rating);
      }
    }

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
    
    return currentTenants.sort((a, b) => a.name.localeCompare(b.name));
  }, [initialTenants, allBookings, statusFilter, originFilter, ratingFilter, searchTerm]);

  useEffect(() => {
    const currentLength = filteredTenants.length;
    if (lastCountRef.current !== currentLength) {
        lastCountRef.current = currentLength;
        onFilteredTenantsChange(currentLength);
    }
  }, [filteredTenants.length, onFilteredTenantsChange]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setOriginFilter('all');
    setRatingFilter('all');
  };
  
  const handleEmailAll = () => {
    const recipients = filteredTenants
      .map(tenant => tenant.email)
      .filter((email): email is string => !!email);
    
    const uniqueRecipients = [...new Set(recipients)];

    if (uniqueRecipients.length > 0) {
        let mailtoLink = `mailto:?bcc=${uniqueRecipients.join(',')}`;
        const params = [];
        params.push(`subject=${encodeURIComponent(`Novedades - ${APP_CONFIG.name}`)}`);
        if (replyToEmail) {
            params.push(`reply-to=${encodeURIComponent(replyToEmail)}`);
        }
        mailtoLink += `&${params.join('&')}`;
        window.location.href = mailtoLink;
    } else {
        toast({
            variant: "destructive",
            title: t('common.error'),
            description: "No hay inquilinos con email en la selección actual.",
        });
    }
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
                {filteredTenants.length} / {initialTenants.length}
            </span>
        </div>
        
        {isFilterExpanded && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end flex-wrap animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid gap-2 flex-1 min-w-[200px]">
                    <Label htmlFor="search">{t('common.search')}</Label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="search"
                            placeholder={t('tenants.filters.placeholder_search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-background"
                        />
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label>{t('tenants.filters.status')}</Label>
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as BookingStatusFilter)}>
                        <SelectTrigger className="w-full sm:w-[180px] bg-background">
                            <SelectValue placeholder="Filtrar por reserva" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('tenants.filters.booking_status.all')}</SelectItem>
                            <SelectItem value="current">{t('tenants.filters.booking_status.current')}</SelectItem>
                            <SelectItem value="upcoming">{t('tenants.filters.booking_status.upcoming')}</SelectItem>
                            <SelectItem value="closed">{t('tenants.filters.booking_status.closed')}</SelectItem>
                            <SelectItem value="cancelled">{t('tenants.filters.booking_status.cancelled')}</SelectItem>
                            <SelectItem value="pending">{t('tenants.filters.booking_status.pending')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>{t('tenants.filters.origin')}</Label>
                    <Select value={originFilter} onValueChange={setOriginFilter}>
                        <SelectTrigger className="w-full sm:w-[180px] bg-background">
                            <SelectValue placeholder="Filtrar por origen" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('common.all')}</SelectItem>
                            {origins.map(origin => (
                            <SelectItem key={origin.id} value={origin.id}>{origin.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>{t('tenants.filters.rating')}</Label>
                    <Select value={ratingFilter} onValueChange={(value) => setRatingFilter(value as RatingFilter)}>
                        <SelectTrigger className="w-full sm:w-[180px] bg-background">
                            <SelectValue placeholder="Filtrar por calificación" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('tenants.filters.rating_options.all')}</SelectItem>
                            <SelectItem value="none">{t('tenants.filters.rating_options.none')}</SelectItem>
                            <SelectItem value="5">5 {t('tenants.filters.rating_options.stars')}</SelectItem>
                            <SelectItem value="4">4 {t('tenants.filters.rating_options.stars')}</SelectItem>
                            <SelectItem value="3">3 {t('tenants.filters.rating_options.stars')}</SelectItem>
                            <SelectItem value="2">2 {t('tenants.filters.rating_options.stars')}</SelectItem>
                            <SelectItem value="1">1 {t('tenants.filters.rating_options.star')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-9 px-2 text-muted-foreground hover:bg-background/50">
                        <X className="h-4 w-4 mr-1" /> {t('common.clean')}
                    </Button>
                    <Button onClick={handleEmailAll}>
                        <Mail className="mr-2 h-4 w-4"/>
                        {t('common.email_all')}
                    </Button>
                </div>
            </div>
        )}
      </div>
      <TenantsList 
        tenants={filteredTenants} 
        allBookings={allBookings}
        origins={origins} 
        onDataChanged={onDataChanged} 
        onEditTenant={handleEditTenant}
      />
      {editingTenant && (
        <TenantEditForm
            tenant={editingTenant}
            onTenantUpdated={onDataChanged}
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
        />
      )}
    </div>
  );
}
