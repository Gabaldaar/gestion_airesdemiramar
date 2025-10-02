
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

  // Set hours to 0 to compare dates only
  const selectedStart = new Date(selectedRange.from);
  selectedStart.setUTCHours(0, 0, 0, 0);

  const selectedEnd = new Date(selectedRange.to);
  selectedEnd.setUTCHours(0, 0, 0, 0);

  for (const booking of existingBookings) {
    // Ignore the booking we are currently editing
    if (booking.id === currentBookingId) {
      continue;
    }

    const bookingStart = new Date(booking.startDate);
    bookingStart.setUTCHours(0, 0, 0, 0);
    
    const bookingEnd = new Date(booking.endDate);
    bookingEnd.setUTCHours(0, 0, 0, 0);
    
    // A conflict exists if the selected range starts BEFORE an existing one ends,
    // AND the selected range ends AFTER an existing one starts.
    // This allows the end of one booking to be the start of another.
    if (selectedStart < bookingEnd && selectedEnd > bookingStart) {
       return booking;
    }
  }

  return null; // No conflict
}
