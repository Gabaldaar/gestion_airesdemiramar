
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
  selectedStart.setHours(0, 0, 0, 0);

  const selectedEnd = new Date(selectedRange.to);
  selectedEnd.setHours(0, 0, 0, 0);

  for (const booking of existingBookings) {
    // Ignore the booking we are currently editing
    if (booking.id === currentBookingId) {
      continue;
    }

    const bookingStart = new Date(booking.startDate);
    bookingStart.setHours(0, 0, 0, 0);
    
    const bookingEnd = new Date(booking.endDate);
    bookingEnd.setHours(0, 0, 0, 0);
    
    // A contiguous booking where the new one starts on the same day the old one ends is NOT a conflict.
    if (isSameDay(selectedStart, bookingEnd)) {
      continue;
    }
    
    // A contiguous booking where the new one ends on the same day the old one starts is NOT a conflict.
    if (isSameDay(selectedEnd, bookingStart)) {
      continue;
    }

    // A true conflict exists if the selected range starts BEFORE an existing one ends,
    // AND the selected range ends AFTER an existing one starts.
    if (selectedStart.getTime() < bookingEnd.getTime() && selectedEnd.getTime() > bookingStart.getTime()) {
       return booking;
    }
  }

  return null; // No conflict
}
