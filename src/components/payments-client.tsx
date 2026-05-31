
'use client';

import { useState, useMemo, useEffect } from 'react';
import { PaymentWithDetails, Property } from '@/lib/data';
import PaymentsList from '@/components/payments-list';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { parseDateSafely } from '@/lib/utils';
import { Search, ListFilter, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useTranslation } from "@/i18n/useTranslation";
import useWindowSize from '@/hooks/use-window-size';

interface PaymentsClientProps {
  initialPayments: PaymentWithDetails[];
  properties: Property[];
}

export default function PaymentsClient({ initialPayments, properties }: PaymentsClientProps) {
  const { t } = useTranslation();
  const { width } = useWindowSize();
  const isMobile = typeof width === 'number' ? width < 768 : false;

  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [propertyIdFilter, setPropertyIdFilter] = useState<string>('all');

  // Set initial filter state based on device
  useEffect(() => {
    if (width !== undefined) {
      setIsFilterExpanded(!isMobile);
    }
  }, [isMobile, width]);

  const filteredPayments = useMemo(() => {
    const filtered = initialPayments.filter(payment => {
      const paymentDate = parseDateSafely(payment.date);
      if (!paymentDate) return false;

      // Text Search
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        const propName = payment.propertyName?.toLowerCase() || '';
        const tenantName = payment.tenantName?.toLowerCase() || '';
        const description = payment.description?.toLowerCase() || '';
        
        if (!propName.includes(lowerSearch) && 
            !tenantName.includes(lowerSearch) && 
            !description.includes(lowerSearch)) {
          return false;
        }
      }

      // Property Filter
      if (propertyIdFilter !== 'all' && payment.propertyId !== propertyIdFilter) {
        return false;
      }
      
      // Date Range Filter
      if (fromDate) {
        const fromDateUTC = new Date(Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()));
        if (paymentDate < fromDateUTC) return false;
      }
      if (toDate) {
        const toDateUTC = new Date(Date.UTC(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999));
        if (paymentDate > toDateUTC) return false;
      }
      
      return true;
    });

    // Ordenar por fecha descendente (más reciente primero)
    return filtered.sort((a, b) => {
        const dateA = parseDateSafely(a.date)?.getTime() || 0;
        const dateB = parseDateSafely(b.date)?.getTime() || 0;
        return dateB - dateA;
    });
  }, [initialPayments, searchTerm, fromDate, toDate, propertyIdFilter]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFromDate(undefined);
    setToDate(undefined);
    setPropertyIdFilter('all');
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
                {filteredPayments.length} / {initialPayments.length}
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
                            placeholder={t('payments_page.placeholder_search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-background"
                        />
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label>{t('common.from')}</Label>
                    <DatePicker date={fromDate} onDateSelect={setFromDate} placeholder={t('common.from')} />
                </div>
                <div className="grid gap-2">
                    <Label>{t('common.to')}</Label>
                    <DatePicker date={toDate} onDateSelect={setToDate} placeholder={t('common.to')} />
                </div>
                <div className="grid gap-2">
                    <Label>{t('bookings.filters.property')}</Label>
                    <Select value={propertyIdFilter} onValueChange={setPropertyIdFilter}>
                        <SelectTrigger className="w-full sm:w-[180px] bg-background">
                            <SelectValue placeholder={t('bookings.filters.property')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('common.all')}</SelectItem>
                            {properties.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex justify-end sm:justify-start">
                    <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-9 px-2 text-muted-foreground hover:bg-background/50">
                        <X className="h-4 w-4 mr-1" /> {t('common.clean')}
                    </Button>
                </div>
            </div>
        )}
      </div>
      <PaymentsList payments={filteredPayments} />
    </div>
  );
}
