
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

  // Use dates as is, assuming they are correctly set by the calendar component
  const selectedStart = selectedRange.from;
  const selectedEnd = selectedRange.to;
  
  if (selectedStart >= selectedEnd) {
    return null; // Invalid range
  }


  for (const booking of existingBookings) {
    if (booking.id === currentBookingId) {
      continue;
    }

    const bookingStart = new Date(booking.startDate);
    const bookingEnd = new Date(booking.endDate);
    
    // A true overlap conflict exists if the selected range starts strictly before an existing one ends,
    // AND the selected range ends strictly after an existing one starts.
    // This will now correctly flag back-to-back bookings as a conflict to be interpreted by the caller.
    if (selectedStart < bookingEnd && selectedEnd > bookingStart) {
       return booking;
    }
  }

  return null; // No conflict
}


