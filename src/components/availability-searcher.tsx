

'use client';

import { useState } from 'react';
import { Property, Booking, PriceConfig, PriceRange, MinimumStay, Discount } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Search, BedDouble, CalendarX, Calculator, Tag, Loader2, AlertTriangle, Info } from 'lucide-react';
import Image from 'next/image';
import { differenceInDays, addDays, getYear, parseISO, isWithinInterval as isWithinIntervalDateFns } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface PriceBreakdown {
    rawPrice: number;
    appliedDiscount: {
        percentage: number;
        nights: number;
    } | null;
    minNightsRequired: number;
    priceConfigUsed: PriceConfig | null;
}

interface PriceResult {
  totalPrice: number;
  currency: 'USD';
  nights: number;
  error?: string;
  minNightsError?: string;
  breakdown: PriceBreakdown;
}

interface AvailabilitySearcherProps {
    allProperties: Property[];
    allBookings: Booking[];
}


// --- New Pricing Logic ---
const calculatePriceForStay = (
  config: PriceConfig | undefined,
  startDate: Date,
  endDate: Date
): PriceResult => {
    
  const nights = differenceInDays(endDate, startDate);
  
  const initialBreakdown: PriceBreakdown = {
        rawPrice: 0,
        appliedDiscount: null,
        minNightsRequired: 0,
        priceConfigUsed: config || null
  };

  if (!config) {
    return { totalPrice: 0, currency: 'USD', nights: 0, error: 'No se encontraron reglas de precios.', breakdown: initialBreakdown };
  }

  if (nights <= 0) {
    return { totalPrice: 0, currency: 'USD', nights: 0, error: 'La fecha de salida debe ser posterior a la de entrada.', breakdown: initialBreakdown };
  }

  // 1. Check minimum stay requirement
  let requiredMinNights = config.minimoBase || 1;
  if (config.minimos && config.minimos.length > 0) {
      for (const min of config.minimos) {
            // Ensure fields exist before processing
            if (!min.desde || !min.hasta || !min.minimo) continue;
            
            try {
                // Parse dates assuming they are at the start of the day in a neutral timezone
                const fromDate = parseISO(min.desde + 'T00:00:00');
                const toDate = parseISO(min.hasta + 'T23:59:59');

                if (isWithinIntervalDateFns(startDate, { start: fromDate, end: toDate })) {
                    requiredMinNights = min.minimo;
                    break;
                }
            } catch (e) {
                console.error("Error parsing min-stay dates: ", min, e);
                continue;
            }
      }
  }
  
  initialBreakdown.minNightsRequired = requiredMinNights;

  if (nights < requiredMinNights) {
      return { totalPrice: 0, currency: 'USD', nights, minNightsError: `Se requiere un mínimo de ${requiredMinNights} noches.`, breakdown: initialBreakdown };
  }

  // 2. Calculate raw total price by iterating through each night
  let rawPrice = 0;
  for (let i = 0; i < nights; i++) {
      const currentDate = addDays(startDate, i);
      let nightPrice = config.base; // Default to base price

      if (config.rangos && config.rangos.length > 0) {
          for (const range of config.rangos) {
                // Ensure fields exist
                if (!range.desde || !range.hasta || !range.precio) continue;

                try {
                    const fromDate = parseISO(range.desde + 'T00:00:00');
                    const toDate = parseISO(range.hasta + 'T23:59:59');
                
                    if (isWithinIntervalDateFns(currentDate, { start: fromDate, end: toDate })) {
                        nightPrice = range.precio;
                        break;
                    }
                } catch (e) {
                    console.error("Error parsing price-range dates: ", range, e);
                    continue;
                }
          }
      }
      rawPrice += nightPrice;
  }
  initialBreakdown.rawPrice = rawPrice;

  // 3. Apply discount
  let finalPrice = rawPrice;
  let appliedDiscount: { percentage: number; nights: number; } | null = null;
  
  if (config.descuentos && config.descuentos.length > 0) {
      const applicableDiscounts = config.descuentos
          .filter(d => d.noches && d.porcentaje && nights >= d.noches)
          .sort((a, b) => (b.porcentaje || 0) - (a.porcentaje || 0)); // Sort by highest percentage
      
      if (applicableDiscounts.length > 0) {
          const bestDiscount = applicableDiscounts[0];
          if (bestDiscount.porcentaje && bestDiscount.noches) {
            finalPrice = rawPrice * (1 - bestDiscount.porcentaje / 100);
            appliedDiscount = { percentage: bestDiscount.porcentaje, nights: bestDiscount.noches };
          }
      }
  }
  initialBreakdown.appliedDiscount = appliedDiscount;
  
  return { 
      totalPrice: finalPrice, 
      currency: 'USD', 
      nights, 
      breakdown: initialBreakdown
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
          const bookingStart = new Date(booking.startDate);
          const bookingEnd = new Date(booking.endDate);
          // Check for overlap: new booking starts before old one ends AND new booking ends after old one starts
          return fromDate < bookingEnd && toDate > bookingStart;
        });
        return !hasConflict;
      });

      // 3. Calculate price for each available property
      const resultsWithPrices = available.map(property => {
        const lookupName = property.priceSheetName || property.name;
        const propertyRules = priceConfigs[lookupName];
        let priceResult: PriceResult;
        
        priceResult = calculatePriceForStay(propertyRules, fromDate, toDate);
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
    // Check if amount is a valid number before formatting
    if (isNaN(amount) || amount === null) {
      return 'US$ NaN';
    }
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
                                   <p>Precio sin dto: {formatCurrency(priceResult.breakdown.rawPrice, priceResult.currency)}</p>
                                    {priceResult.breakdown.appliedDiscount ? (
                                        <p className="text-green-600 font-semibold">Descuento aplicado: {priceResult.breakdown.appliedDiscount.percentage}% por {priceResult.breakdown.appliedDiscount.nights}+ noches</p>
                                    ) : (
                                        <p>No se aplicaron descuentos.</p>
                                    )}
                                    <p>Estadía mínima requerida: {priceResult.breakdown.minNightsRequired} noches</p>
                                    <div className="pt-2">
                                        <h4 className="font-semibold text-foreground">Reglas de Precios Usadas:</h4>
                                        <pre className="text-wrap bg-white dark:bg-black p-1 rounded-sm text-xs max-h-40 overflow-auto">
                                            {JSON.stringify(priceResult.breakdown.priceConfigUsed, null, 2)}
                                        </pre>
                                    </div>
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
