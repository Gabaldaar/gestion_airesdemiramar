
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

  // Normalize selected dates to the start of the day in UTC
  const selectedStart = new Date(selectedRange.from);
  selectedStart.setUTCHours(0, 0, 0, 0);

  const selectedEnd = new Date(selectedRange.to);
  selectedEnd.setUTCHours(0, 0, 0, 0);
  
  if (selectedStart >= selectedEnd) {
    return null; // Invalid range
  }


  for (const booking of existingBookings) {
    if (booking.id === currentBookingId) {
      continue;
    }

    const bookingStart = new Date(booking.startDate);
    bookingStart.setUTCHours(0, 0, 0, 0);
    
    const bookingEnd = new Date(booking.endDate);
    bookingEnd.setUTCHours(0, 0, 0, 0);
    
    // A true overlap conflict exists if the selected range starts strictly before an existing one ends,
    // AND the selected range ends strictly after an existing one starts.
    if (selectedStart < bookingEnd && selectedEnd > bookingStart) {
       // This condition detects any overlap, including back-to-back.
       // We let the form component decide if it's a "warning" or a "blocking error".
       return booking;
    }
  }

  return null; // No conflict
}
