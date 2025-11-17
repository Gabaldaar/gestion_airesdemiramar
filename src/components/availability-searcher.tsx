
'use client';

import { useState } from 'react';
import { Property, Booking } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Search, BedDouble, CalendarX } from 'lucide-react';
import Image from 'next/image';

interface AvailabilitySearcherProps {
  allProperties: Property[];
  allBookings: Booking[];
}

export default function AvailabilitySearcher({ allProperties, allBookings }: AvailabilitySearcherProps) {
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    if (!fromDate || !toDate) {
      // Maybe show a toast or message to the user
      return;
    }

    const available = allProperties.filter(property => {
      const propertyBookings = allBookings.filter(
        b => b.propertyId === property.id && (!b.status || b.status === 'active')
      );

      const hasConflict = propertyBookings.some(booking => {
        const bookingStart = new Date(booking.startDate);
        const bookingEnd = new Date(booking.endDate);
        // A conflict exists if the selected range overlaps with the booking range.
        // Overlap condition: (StartA < EndB) and (EndA > StartB)
        return fromDate < bookingEnd && toDate > bookingStart;
      });

      return !hasConflict;
    });

    setAvailableProperties(available);
    setHasSearched(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buscar Disponibilidad</CardTitle>
        <CardDescription>
          Encuentra qué propiedades están libres en un rango de fechas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
          <div className="grid gap-1.5 flex-1">
            <label className="text-sm font-medium">Desde</label>
            <DatePicker date={fromDate} onDateSelect={setFromDate} placeholder="Fecha de Check-in" />
          </div>
          <div className="grid gap-1.5 flex-1">
            <label className="text-sm font-medium">Hasta</label>
            <DatePicker date={toDate} onDateSelect={setToDate} placeholder="Fecha de Check-out" />
          </div>
          <Button onClick={handleSearch} disabled={!fromDate || !toDate}>
            <Search className="mr-2 h-4 w-4" />
            Buscar
          </Button>
        </div>

        {hasSearched && (
          <div className="border-t pt-4">
            <h3 className="mb-4 text-lg font-semibold tracking-tight">
              Resultados de la Búsqueda ({availableProperties.length})
            </h3>
            {availableProperties.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableProperties.map(property => (
                  <Link href={`/properties/${property.id}`} key={property.id} className="group">
                    <Card className="h-full overflow-hidden transition-all group-hover:shadow-lg">
                      <CardHeader className="p-0">
                          <div className="relative aspect-video w-full">
                              <Image
                                  src={property.imageUrl || 'https://picsum.photos/600/400'}
                                  alt={`Foto de ${property.name}`}
                                  fill
                                  className="rounded-t-lg object-cover transition-transform group-hover:scale-105"
                                  data-ai-hint="apartment building exterior"
                              />
                          </div>
                      </CardHeader>
                      <CardContent className="p-4">
                          <CardTitle className="text-base">{property.name}</CardTitle>
                          <CardDescription>{property.address}</CardDescription>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                <CalendarX className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="font-semibold">No se encontraron propiedades disponibles</p>
                <p className="text-sm text-muted-foreground">Intenta con otro rango de fechas.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
