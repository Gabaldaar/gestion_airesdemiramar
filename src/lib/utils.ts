
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { DateRange } from "react-day-picker";
import { Booking } from "./data";

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
    // The check-in day of a new booking cannot be the same as the check-out day of an old one.
    // A new booking can start on the same day an old one ends.
    if (selectedStart.getTime() < bookingEnd.getTime() && selectedEnd.getTime() > bookingStart.getTime()) {
       return booking; // Found a conflict
    }
  }

  return null; // No conflict
}
