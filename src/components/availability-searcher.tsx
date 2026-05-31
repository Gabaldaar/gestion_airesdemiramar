
'use client';

import { useState } from 'react';
import { Property, Booking, PriceConfig, DateBlock, Contrato } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Search, BedDouble, CalendarX, Calculator, Tag, Loader2, AlertTriangle, Info, Check, Home } from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { calculatePriceForStay, PriceResult, parseDateSafely } from '@/lib/utils';
import { differenceInDays } from 'date-fns';
import { useTranslation } from '@/i18n/useTranslation';

interface AvailabilitySearcherProps {
    allProperties: Property[];
    allBookings: Booking[];
    allBlocks: DateBlock[];
    allContratos: Contrato[];
    isPersonalFlavor: boolean;
}

export default function AvailabilitySearcher({ allProperties, allBookings, allBlocks, allContratos, isPersonalFlavor }: AvailabilitySearcherProps) {
  const { t } = useTranslation();
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

    const nights = differenceInDays(toDate, fromDate);

    try {
      // 1. Find available properties
      const available = allProperties.filter(property => {
        // Check Short-term Bookings
        const propertyBookings = allBookings.filter(
          b => b.propertyId === property.id && (!b.status || b.status === 'active')
        );
        
        const hasBookingConflict = propertyBookings.some(booking => {
          const bookingStart = parseDateSafely(booking.startDate);
          const bookingEnd = parseDateSafely(booking.endDate);
          if (!bookingStart || !bookingEnd) return false;
          return fromDate < bookingEnd && toDate > bookingStart;
        });

        if (hasBookingConflict) return false;

        // Check Date Blocks
        const propertyBlocks = allBlocks.filter(b => b.propertyId === property.id);
        const hasBlockConflict = propertyBlocks.some(block => {
            const blockStart = parseDateSafely(block.startDate);
            const blockEnd = parseDateSafely(block.endDate);
            if (!blockStart || !blockEnd) return false;
            return fromDate < blockEnd && toDate > blockStart;
        });

        if (hasBlockConflict) return false;

        // Check Long-term Contracts
        const propertyContratos = allContratos.filter(
          c => c.propertyId === property.id && (c.status === 'active' || c.status === 'draft')
        );

        const hasContractConflict = propertyContratos.some(contrato => {
          const contratoStart = parseDateSafely(contrato.fechaInicio);
          const contratoEnd = parseDateSafely(contrato.fechaFin);
          if (!contratoStart || !contratoEnd) return false;
          return fromDate < contratoEnd && toDate > contratoStart;
        });

        return !hasContractConflict;
      });
      
      let resultsWithPrices: { property: Property, priceResult: PriceResult }[] = [];

      // 2. Calculate prices only for personal flavor
      if (isPersonalFlavor) {
          const response = await fetch('/api/get-price-configurations');
          if (!response.ok) {
            throw new Error('No se pudieron obtener las configuraciones de precios.');
          }
          const priceConfigs: Record<string, PriceConfig> = await response.json();
          
          resultsWithPrices = available.map(property => {
            const lookupName = property.priceSheetName || property.name;
            const propertyRules = priceConfigs[lookupName];
            let priceResult: PriceResult;
            
            priceResult = calculatePriceForStay(propertyRules, fromDate, toDate);
            return { property, priceResult };
          });
      } else {
          // For commercial flavor, just return availability without price
          resultsWithPrices = available.map(property => ({
              property,
              priceResult: {
                  totalPrice: 0,
                  currency: 'USD',
                  nights,
                  breakdown: { rawPrice: 0, appliedDiscount: null, minNightsRequired: 0, priceConfigUsed: null }
              }
          }));
      }
      
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
    <Card className="bg-blue-100/50 dark:bg-blue-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Search className="h-6 w-6" />
            {isPersonalFlavor ? t('dashboard.searcher.title') : t('dashboard.searcher.title_only')}
        </CardTitle>
        <CardDescription>
          {isPersonalFlavor ? t('dashboard.searcher.desc') : t('dashboard.searcher.desc_only')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
          <div className="grid gap-1.5 flex-1">
            <label className="text-sm font-medium">{t('dashboard.searcher.from')}</label>
            <DatePicker date={fromDate} onDateSelect={setFromDate} placeholder={t('dashboard.searcher.from')} />
          </div>
          <div className="grid gap-1.5 flex-1">
            <label className="text-sm font-medium">{t('dashboard.searcher.to')}</label>
            <DatePicker date={toDate} onDateSelect={setToDate} placeholder={t('dashboard.searcher.to')} defaultMonth={fromDate} />
          </div>
          <Button onClick={handleSearch} disabled={!fromDate || !toDate || isSearching}>
            {isSearching ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}
                </>
            ) : (
                <>
                    <Search className="mr-2 h-4 w-4" />
                    {t('dashboard.searcher.button')}
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
              {t('dashboard.searcher.results')} ({results.length})
            </h3>
            {isSearching && results.length === 0 ? (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span>{t('dashboard.searcher.calculating')}</span>
                </div>
            ) : results.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {results.map(({ property, priceResult }) => (
                  <Link href={`/properties/${property.id}`} key={property.id} className="group">
                    <Card className="flex flex-col h-full overflow-hidden transition-all group-hover:shadow-lg">
                      <CardHeader className="p-0">
                          <div className="relative aspect-video w-full">
                              {property.imageUrl ? (
                                  <Image
                                      src={property.imageUrl}
                                      alt={`Foto de ${property.name}`}
                                      fill
                                      className="rounded-t-lg object-cover transition-transform group-hover:scale-105"
                                  />
                              ) : (
                                  <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-2 rounded-t-lg">
                                      <Home className="h-10 w-10 text-muted-foreground opacity-20" />
                                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest opacity-40">
                                          {t('common.no_image')}
                                      </span>
                                  </div>
                              )}
                          </div>
                      </CardHeader>
                      <CardContent className="p-4 flex-grow">
                          <CardTitle className="text-base">{property.name}</CardTitle>
                          <CardDescription>{property.address}</CardDescription>
                      </CardContent>
                      <CardFooter className="flex flex-col items-start p-4 border-t bg-muted/50">
                        {isPersonalFlavor ? (
                            <>
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
                                                {formatCurrency(Math.round(priceResult.totalPrice), priceResult.currency)}
                                            </span>
                                        </div>
                                        
                                        <div className="text-xs text-muted-foreground space-y-1 pl-2 border-l-2">
                                        <p>Precio sin dto: {formatCurrency(Math.round(priceResult.breakdown.rawPrice), priceResult.currency)}</p>
                                            {priceResult.breakdown.appliedDiscount ? (
                                                <p className="text-green-600 font-semibold">Descuento aplicado: {priceResult.breakdown.appliedDiscount.percentage}% por {priceResult.breakdown.appliedDiscount.nights}+ noches</p>
                                            ) : (
                                                <p>No se aplicaron descuentos.</p>
                                            )}
                                            <p>Estadía mínima requerida: {priceResult.breakdown.minNightsRequired} noches</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center text-sm font-semibold text-green-600">
                                <Check className="mr-2 h-4 w-4" />
                                <span>{t('dashboard.searcher.available')}</span>
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
                        <p className="font-semibold">{t('dashboard.searcher.no_results')}</p>
                        <p className="text-sm text-muted-foreground">{t('dashboard.searcher.no_results_desc')}</p>
                    </div>
                )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
