
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { DateRange } from "react-day-picker";
import { Booking, PriceConfig } from "./data";
import { isSameDay, differenceInDays, addDays, parse, isWithinInterval as isWithinIntervalDateFns } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const parseDateSafely = (dateInput: string | null | undefined): Date | undefined => {
    if (!dateInput) {
        return undefined;
    }
    // Tries to parse YYYY-MM-DD by constructing a local date to avoid timezone shifts during display.
    const parts = dateInput.split('T')[0].split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
        const day = parseInt(parts[2], 10);

        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            // IMPORTANT: Create a date that is interpreted as local midnight.
            // new Date(year, month, day) does this.
            // This prevents the date from shifting when displayed in the user's timezone.
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
    }
    
    // Fallback for other formats, though risky. This might be timezone-sensitive.
    const fallbackDate = new Date(dateInput);
    if (isNaN(fallbackDate.getTime())) {
        return undefined;
    }
    return fallbackDate;
};

export function checkDateConflict(
  selectedRange: DateRange,
  existingBookings: Booking[],
  currentBookingId: string
): Booking | null {
  if (!selectedRange.from || !selectedRange.to) {
    return null;
  }

  const selectedStart = selectedRange.from;
  const selectedEnd = selectedRange.to;

  // Filter for active bookings only, excluding the one being edited
  const activeBookings = existingBookings.filter(booking => 
    (!booking.status || booking.status === 'active') && booking.id !== currentBookingId
  );

  // A conflict exists if the selected range starts before an existing one ends,
  // AND the selected range ends after an existing one starts.
  for (const booking of activeBookings) {
    const bookingStart = parseDateSafely(booking.startDate);
    const bookingEnd = parseDateSafely(booking.endDate);

    if (!bookingStart || !bookingEnd) continue;
    
    // Check for overlap: new booking starts before old one ends AND new booking ends after old one starts
    if (selectedStart < bookingEnd && selectedEnd > bookingStart) {
       return booking;
    }
  }

  return null; // No conflict
}


// --- Pricing Logic ---

export interface PriceBreakdown {
    rawPrice: number;
    appliedDiscount: {
        percentage: number;
        nights: number;
    } | null;
    minNightsRequired: number;
    priceConfigUsed: PriceConfig | null;
}

export interface PriceResult {
  totalPrice: number;
  currency: 'USD';
  nights: number;
  error?: string;
  minNightsError?: string;
  breakdown: PriceBreakdown;
}

export const calculatePriceForStay = (
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
  let requiredMinNights = config.minimoNoches || 1;
  if (config.minimos) {
      for (const min of config.minimos) {
            if (!min.desde || !min.hasta || !min.minimo) continue;
            
            try {
                // Parse dates as YYYY-MM-DD
                const fromDate = parse(min.desde, 'yyyy-MM-dd', new Date());
                const toDate = parse(min.hasta, 'yyyy-MM-dd', new Date());

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

      if (config.rangos) {
          for (const range of config.rangos) {
                if (!range.desde || !range.hasta || !range.precio) continue;

                try {
                    const fromDate = parse(range.desde, 'yyyy-MM-dd', new Date());
                    const toDate = parse(range.hasta, 'yyyy-MM-dd', new Date());
                
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
  
  if (config.descuentos) {
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

    

    
