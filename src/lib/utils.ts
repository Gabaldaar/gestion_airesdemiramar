
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { DateRange } from "react-day-picker";
import { Booking } from "./data";
import { isSameDay } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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

  // A conflict exists if the selected range starts before an existing one ends,
  // AND the selected range ends after an existing one starts.
  // This is the classic interval overlap check.
  for (const booking of existingBookings) {
    if (booking.id === currentBookingId) {
      continue;
    }

    const bookingStart = new Date(booking.startDate);
    const bookingEnd = new Date(booking.endDate);
    
    if (selectedStart < bookingEnd && selectedEnd > bookingStart) {
       return booking;
    }
  }

  return null; // No conflict
}
