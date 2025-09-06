
'use client';

import { useState, useMemo } from 'react';
import { PaymentWithDetails, Property } from '@/lib/data';
import PaymentsList from '@/components/payments-list';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from './ui/label';
import { revalidatePath } from 'next/cache';

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
      const paymentDate = new Date(payment.date);

      // Property Filter
      if (propertyIdFilter !== 'all' && payment.propertyId !== propertyIdFilter) {
        return false;
      }
      
      // Date Range Filter
      if (fromDate && paymentDate < fromDate) {
        return false;
      }
      if (toDate) {
        const normalizedToDate = new Date(toDate);
        normalizedToDate.setHours(23, 59, 59, 999);
        if (paymentDate > normalizedToDate) {
            return false;
        }
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
