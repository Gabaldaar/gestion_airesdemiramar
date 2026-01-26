

'use client';

import { useState, useMemo } from 'react';
import { PaymentWithDetails, Property } from '@/lib/data';
import PaymentsList from '@/components/payments-list';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from './ui/label';
import { parseDateSafely } from '@/lib/utils';

interface PaymentsClientProps {
  initialPayments: PaymentWithDetails[];
  properties: Property[];
}

export default function PaymentsClient({ initialPayments, properties }: PaymentsClientProps) {
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [propertyIdFilter, setPropertyIdFilter] = useState<string>('all');

  const filteredPayments = useMemo(() => {
    return initialPayments.filter(payment => {
      const paymentDate = parseDateSafely(payment.date);
      if (!paymentDate) return false;

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
  }, [initialPayments, fromDate, toDate, propertyIdFilter]);

  const handleClearFilters = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setPropertyIdFilter('all');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
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
          <div className="self-end">
              <Button variant="outline" onClick={handleClearFilters}>Limpiar Filtros</Button>
          </div>
        </div>
      </div>
      <PaymentsList payments={filteredPayments} />
    </div>
  );
}

    

    
