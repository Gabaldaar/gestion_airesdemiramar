

'use client';

import { useState } from 'react';
import { Property, Booking, PriceConfig } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Search, BedDouble, CalendarX, Calculator, Tag, Loader2, AlertTriangle, Info } from 'lucide-react';
import Image from 'next/image';
import { differenceInDays, addDays, getYear, parseISO, isWithinInterval as isWithinIntervalDateFns } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface AvailabilitySearcherProps {
  allProperties: Property[];
  allBookings: Booking[];
}

interface PriceResult {
  totalPrice: number;
  currency: 'USD';
  nights: number;
  error?: string;
  minNightsError?: string;
  // Debug fields
  rawPrice: number;
  appliedDiscountPercentage: number;
  appliedDiscountNights: number;
  minNightsRequired: number;
}


// --- New Pricing Logic ---
const calculatePriceForStay = (
  config: PriceConfig,
  startDate: Date,
  endDate: Date
): PriceResult => {
  const nights = differenceInDays(endDate, startDate);
  if (nights <= 0) {
    return { totalPrice: 0, currency: 'USD', nights: 0, error: 'La fecha de salida debe ser posterior a la de entrada.', rawPrice: 0, appliedDiscountPercentage: 0, appliedDiscountNights: 0, minNightsRequired: 0 };
  }

  // 1. Check minimum stay requirement
  let requiredMinNights = config.minimoBase || 1;
  const currentYear = getYear(startDate);

  if (config.minimos && config.minimos.length > 0) {
      for (const min of config.minimos) {
           // Skip if from/to dates are missing
          if (!min['minimo-desde'] || !min['minimo-hasta']) {
            continue;
          }
          // The date from the sheet is DD/MM, we need to create a valid date object.
          // We assume the year of the start date of the stay.
          const fromParts = min['minimo-desde'].split('/');
          const toParts = min['minimo-hasta'].split('/');
          
          if(fromParts.length !== 2 || toParts.length !== 2) continue;

          const fromDate = new Date(currentYear, parseInt(fromParts[1]) - 1, parseInt(fromParts[0]));
          let toDate = new Date(currentYear, parseInt(toParts[1]) - 1, parseInt(toParts[0]));
          
          // Handle ranges that cross a year boundary (e.g., Dec to Jan)
          if (fromDate > toDate) toDate.setFullYear(currentYear + 1);

          if (isWithinIntervalDateFns(startDate, { start: fromDate, end: toDate })) {
              requiredMinNights = min['minimo-valor'];
              break;
          }
      }
  }
  
  if (nights < requiredMinNights) {
      return { totalPrice: 0, currency: 'USD', nights, minNightsError: `Se requiere un mínimo de ${requiredMinNights} noches.`, rawPrice: 0, appliedDiscountPercentage: 0, appliedDiscountNights: 0, minNightsRequired: requiredMinNights };
  }

  // 2. Calculate raw total price
  let totalPrice = 0;
  for (let i = 0; i < nights; i++) {
      const currentDate = addDays(startDate, i);
      const currentDayYear = getYear(currentDate);
      let nightPrice = config.base;

      if (config.rangos && config.rangos.length > 0) {
          for (const range of config.rangos) {
              // Skip if from/to dates are missing
              if (!range['rango-desde'] || !range['rango-hasta']) {
                continue;
              }
              const fromParts = range['rango-desde'].split('/');
              const toParts = range['rango-hasta'].split('/');
              
              if(fromParts.length !== 2 || toParts.length !== 2) continue;

              const fromDate = new Date(currentDayYear, parseInt(fromParts[1]) - 1, parseInt(fromParts[0]));
              let toDate = new Date(currentDayYear, parseInt(toParts[1]) - 1, parseInt(toParts[0]));
             
              if (fromDate > toDate) toDate.setFullYear(currentDayYear + 1);
              
              if (isWithinIntervalDateFns(currentDate, { start: fromDate, end: toDate })) {
                  nightPrice = range['rango-precio'];
                  break;
              }
          }
      }
      totalPrice += nightPrice;
  }

  // 3. Apply discount
  let finalPrice = totalPrice;
  let appliedDiscount = { percentage: 0, nights: 0 };
  if (config.descuentos && config.descuentos.length > 0) {
      const applicableDiscounts = config.descuentos
          .filter(d => nights >= d['descuento-noches'])
          // Sort by highest discount percentage first to get the best deal for the user
          .sort((a, b) => b['descuento-porcentaje'] - a['descuento-porcentaje']);
      
      if (applicableDiscounts.length > 0) {
          const bestDiscount = applicableDiscounts[0];
          finalPrice = totalPrice * (1 - bestDiscount['descuento-porcentaje'] / 100);
          appliedDiscount = { percentage: bestDiscount['descuento-porcentaje'], nights: bestDiscount['descuento-noches'] };
      }
  }
  
  return { 
      totalPrice: finalPrice, 
      currency: 'USD', 
      nights, 
      rawPrice: totalPrice, 
      appliedDiscountPercentage: appliedDiscount.percentage,
      appliedDiscountNights: appliedDiscount.nights,
      minNightsRequired: requiredMinNights,
    };
};


export default function AvailabilitySearcher({ allProperties, allBookings }: AvailabilitySearcherProps) {
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<{ property: Property, priceResult: PriceResult }[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!fromDate || !toDate) {
      setSearchError("Por favor, selecciona un rango de fechas.");
      return;
    }
    if (fromDate >= toDate) {
        setSearchError("La fecha de 'Desde' debe ser anterior a la de 'Hasta'.");
        return;
    }

    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);
    setResults([]);

    try {
      // 1. Fetch pricing configurations
      const response = await fetch('/api/get-price-configurations');
      if (!response.ok) {
        throw new Error('No se pudieron obtener las configuraciones de precios.');
      }
      const priceConfigs: Record<string, PriceConfig> = await response.json();

      // 2. Find available properties
      const available = allProperties.filter(property => {
        const propertyBookings = allBookings.filter(
          b => b.propertyId === property.id && (!b.status || b.status === 'active')
        );
        const hasConflict = propertyBookings.some(booking => {
          const bookingStart = parseISO(booking.startDate);
          const bookingEnd = parseISO(booking.endDate);
          return fromDate < bookingEnd && toDate > bookingStart;
        });
        return !hasConflict;
      });

      // 3. Calculate price for each available property
      const resultsWithPrices = available.map(property => {
        const lookupName = property.priceSheetName || property.name;
        const propertyRules = priceConfigs[lookupName];
        let priceResult: PriceResult;
        
        if (propertyRules && typeof propertyRules === 'object') {
          priceResult = calculatePriceForStay(propertyRules, fromDate, toDate);
        } else {
          priceResult = { totalPrice: 0, currency: 'USD', nights: 0, error: 'No se encontraron reglas de precios.', rawPrice: 0, appliedDiscountPercentage: 0, appliedDiscountNights: 0, minNightsRequired: 0 };
        }
        return { property, priceResult };
      });
      
      setResults(resultsWithPrices);

    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Ocurrió un error inesperado."
      setSearchError(`Error al buscar: ${message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const formatCurrency = (amount: number, currency: 'USD') => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0
    }).format(amount);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            Buscar Disponibilidad y Precios
        </CardTitle>
        <CardDescription>
          Encuentra propiedades libres en un rango de fechas y calcula el costo de la estadía.
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
          <Button onClick={handleSearch} disabled={!fromDate || !toDate || isSearching}>
            {isSearching ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buscando...
                </>
            ) : (
                <>
                    <Search className="mr-2 h-4 w-4" />
                    Buscar
                </>
            )}
          </Button>
        </div>

        {searchError && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error en la Búsqueda</AlertTitle>
                <AlertDescription>{searchError}</AlertDescription>
            </Alert>
        )}

        {hasSearched && (
          <div className="border-t pt-4">
            <h3 className="mb-4 text-lg font-semibold tracking-tight">
              Resultados de la Búsqueda ({results.length})
            </h3>
            {isSearching && results.length === 0 ? (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span>Calculando precios...</span>
                </div>
            ) : results.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {results.map(({ property, priceResult }) => (
                  <Link href={`/properties/${property.id}`} key={property.id} className="group">
                    <Card className="flex flex-col h-full overflow-hidden transition-all group-hover:shadow-lg">
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
                      <CardContent className="p-4 flex-grow">
                          <CardTitle className="text-base">{property.name}</CardTitle>
                          <CardDescription>{property.address}</CardDescription>
                      </CardContent>
                      <CardFooter className="flex flex-col items-start p-4 border-t bg-muted/50">
                        {priceResult.error ? (
                            <span className="text-sm font-semibold text-destructive">{priceResult.error}</span>
                        ) : priceResult.minNightsError ? (
                            <span className="text-sm font-semibold text-yellow-600">{priceResult.minNightsError}</span>
                        ) : (
                            <div className="w-full space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 font-semibold">
                                        <Tag className="h-4 w-4 text-muted-foreground" />
                                        <span>{priceResult.nights} {priceResult.nights === 1 ? 'noche' : 'noches'}</span>
                                    </div>
                                    <span className="text-lg font-bold text-primary">
                                        {formatCurrency(priceResult.totalPrice, priceResult.currency)}
                                    </span>
                                </div>
                                <div className="text-xs text-muted-foreground space-y-1 pl-2 border-l-2">
                                   <p>Precio base: {formatCurrency(priceResult.rawPrice, priceResult.currency)}</p>
                                    {priceResult.appliedDiscountPercentage > 0 && (
                                        <p className="text-green-600">Descuento: {priceResult.appliedDiscountPercentage}% por {priceResult.appliedDiscountNights}+ noches</p>
                                    )}
                                    <p>Mínimo: {priceResult.minNightsRequired} noches</p>
                                </div>
                            </div>
                        )}
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
                !isSearching && (
                    <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                        <CalendarX className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="font-semibold">No se encontraron propiedades disponibles</p>
                        <p className="text-sm text-muted-foreground">Intenta con otro rango de fechas.</p>
                    </div>
                )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
