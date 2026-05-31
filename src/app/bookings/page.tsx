
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    BookingWithDetails, Property, Tenant, Origin, Provider, DateBlock,
    getBookings, getProperties, getTenants, getOrigins, getProviders, getDateBlocks
} from "@/lib/data";
import BookingsClient, { Filters } from "@/components/bookings-client";
import { useAuth } from "@/components/auth-provider";
import { useEffect, useState, useCallback, Suspense, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { BookingAddForm } from "@/components/booking-add-form";
import { DateBlockAddForm } from "@/components/date-block-add-form";
import { Loader2, PlusCircle, CalendarX } from 'lucide-react';
import { useTranslation } from "@/i18n/useTranslation";
import { Button } from "@/components/ui/button";

interface BookingsData {
    allBookings: BookingWithDetails[];
    properties: Property[];
    tenants: Tenant[];
    origins: Origin[];
    providers: Provider[];
    blocks: DateBlock[];
}

function BookingsPageContent() {
  const { user, appUser, orgId } = useAuth();
  const { t } = useTranslation();
  const [data, setData] = useState<BookingsData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [key, setKey] = useState(0);
  const [isBlockOpen, setIsBlockFormOpen] = useState(false);

  const isPersonalFlavor = appUser?.appFlavor !== 'commercial';

  const fetchData = useCallback(async () => {
    if (!user || !orgId) return;
    if (!data) setLoading(true);
    try {
        const currentOrgId = orgId || 'global';
        
        const [bookingsRaw, propertiesRaw, tenantsRaw, originsRaw, providersRaw, blocksRaw] = await Promise.all([
            getBookings(currentOrgId),
            getProperties(currentOrgId),
            getTenants(currentOrgId),
            getOrigins(currentOrgId),
            getProviders(currentOrgId),
            getDateBlocks(currentOrgId),
        ]);

        const sortByName = (a: any, b: any) => (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' });

        const properties = propertiesRaw.sort(sortByName) as Property[];
        const tenants = tenantsRaw.sort(sortByName) as Tenant[];
        const origins = originsRaw.sort(sortByName) as Origin[];
        const providers = providersRaw.sort(sortByName) as Provider[];
        const blocks = blocksRaw as DateBlock[];
        
        const propsMap = new Map(properties.map(p => [p.id, p]));
        const tenantsMap = new Map(tenants.map(t => [t.id, t]));

        const enrichedBookings: BookingWithDetails[] = bookingsRaw.map((b: any) => {
            return {
                ...b,
                property: propsMap.get(b.propertyId) || { name: 'Desconocida', address: 'N/A' } as Property,
                tenant: tenantsMap.get(b.tenantId) || { name: 'Desconocido' } as Tenant,
            };
        });

        setData({ allBookings: enrichedBookings, properties, tenants, origins, providers, blocks });
    } catch (error) {
        console.error("Failed to fetch bookings data:", error);
    } finally {
        setLoading(false);
    }
  }, [user, orgId, data]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData, key]);

  const handleDataChanged = useCallback(() => {
    setKey(prevKey => prevKey + 1);
  }, []);
  
  const handleFiltersChange = useCallback((newFilters: Partial<Filters>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newFilters).forEach(([key, value]) => {
      if (key === 'statusFilters') {
        if (typeof value === 'object' && value !== null) {
          Object.entries(value).forEach(([statusKey, statusValue]) => {
            if (statusValue) {
              params.set(statusKey, 'true');
            } else {
              params.delete(statusKey);
            }
          });
        }
      } else if (value === undefined || value === null || value === '' || value === 'all') {
        params.delete(key);
      } else if (value instanceof Date) {
        params.set(key, value.toISOString().split('T')[0]);
      } else {
        params.set(key, String(value));
      }
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  const contractStatusOptions: Readonly<string[]> = ['all', 'not_sent', 'sent', 'signed', 'not_required'];
  const guaranteeStatusOptions: Readonly<string[]> = ['all', 'not_solicited', 'solicited', 'received', 'returned', 'not_applicable'];
  const sortOrderOptions: Readonly<string[]> = ['upcoming', 'distant'];

  const getValidFilterValue = <T extends string>(
    value: string | null,
    allowedValues: Readonly<T[]>,
    defaultValue: T
  ): T => {
    if (value && (allowedValues as readonly string[]).includes(value as T)) {
      return value as T;
    }
    return defaultValue;
  };

  const currentFilters = useMemo((): Filters => ({
    searchTerm: searchParams.get('searchTerm') || '',
    from: searchParams.get('from') ? new Date(searchParams.get('from')!.replace(/-/g, '/')) : undefined,
    to: searchParams.get('to') ? new Date(searchParams.get('to')!.replace(/-/g, '/')) : undefined,
    statusFilters: {
        current: searchParams.get('current') === 'true',
        upcoming: searchParams.get('upcoming') === 'true',
        closed: searchParams.get('closed') === 'true',
        'with-debt': searchParams.get('with-debt') === 'true',
        cancelled: searchParams.get('cancelled') === 'true',
        pending: searchParams.get('pending') === 'true',
    },
    propertyIdFilter: searchParams.get('propertyIdFilter') || 'all',
    contractStatusFilter: getValidFilterValue(searchParams.get('contractStatusFilter'), contractStatusOptions as any, 'all'),
    guaranteeStatusFilter: getValidFilterValue(searchParams.get('guaranteeStatusFilter'), guaranteeStatusOptions as any, 'all'),
    originIdFilter: searchParams.get('originIdFilter') || 'all',
    sortOrder: getValidFilterValue(searchParams.get('sortOrder'), sortOrderOptions as any, 'distant'),
    tenantIdFilter: searchParams.get('tenantId') || undefined
  }), [searchParams]);

  const renderSkeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
        {[...Array(8)].map((_, i) => (
            <Card key={i} className="h-[220px] overflow-hidden border-2 border-zinc-100 p-4 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-2/3" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                </div>
                <div className="flex justify-end pt-4">
                    <Skeleton className="h-8 w-32" />
                </div>
            </Card>
        ))}
    </div>
  );

  const tenant = currentFilters.tenantIdFilter && data ? data.tenants.find(t => t.id === currentFilters.tenantIdFilter) : null;
  const pageTitle = tenant ? `${t('bookings.title_of')} ${tenant.name}` : t('bookings.title');
  const pageDescription = tenant
    ? t('bookings.description_of').replace('{{name}}', tenant.name)
    : t('bookings.description');

  return (
    <div className="flex-1 space-y-4">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
              <h2 className="text-3xl font-bold tracking-tight text-primary">
                  {pageTitle}
              </h2>
              <p className="text-muted-foreground">{pageDescription}</p>
          </div>
          {!loading && data && isPersonalFlavor && (
            <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <DateBlockAddForm
                    properties={data.properties}
                    allBookings={data.allBookings.map(b => ({ ...b } as any))}
                    allBlocks={data.blocks}
                    isOpen={isBlockOpen}
                    onOpenChange={setIsBlockFormOpen}
                    onDataChanged={handleDataChanged}
                >
                    <Button variant="outline">
                        <CalendarX className="mr-2 h-4 w-4" />
                        {t('bookings.block_dates')}
                    </Button>
                </DateBlockAddForm>
                <BookingAddForm 
                    tenants={data.tenants}
                    allBookings={data.allBookings.map(b => ({ ...b } as any))}
                    allBlocks={data.blocks}
                    properties={data.properties}
                    onDataChanged={handleDataChanged}
                >
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t('bookings.new_booking')}
                    </Button>
                </BookingAddForm>
            </div>
          )}
      </div>
      <Card>
        <CardContent className="pt-6">
            {loading && !data ? renderSkeletons() : data && (
                <BookingsClient 
                    initialBookings={data.allBookings} 
                    properties={data.properties} 
                    tenants={data.tenants} 
                    origins={data.origins}
                    providers={data.providers}
                    onDataChanged={handleDataChanged}
                    filters={currentFilters}
                    onFiltersChange={handleFiltersChange}
                />
            )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function BookingsPage() {
    const { t } = useTranslation();
    return (
        <Suspense fallback={<div className="flex h-48 items-center justify-center">{t('common.loading')}</div>}>
            <BookingsPageContent />
        </Suspense>
    );
}
