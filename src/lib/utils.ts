
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

  // A checkout on the same day as a check-in is allowed.
  // The conflict happens if the new booking starts *before* an existing one ends,
  // and ends *after* an existing one starts.
  // The last night of a booking is the day before the checkout date.
  
  const selectedStart = selectedRange.from;
  const selectedEnd = selectedRange.to;

  for (const booking of existingBookings) {
    // Ignore the booking we are currently editing
    if (booking.id === currentBookingId) {
      continue;
    }

    const bookingStart = new Date(booking.startDate);
    const bookingEnd = new Date(booking.endDate);

    // Conflict condition:
    // The new booking starts before the existing one ends AND the new booking ends after the existing one starts.
    if (selectedStart < bookingEnd && selectedEnd > bookingStart) {
       return booking;
    }
  }

  return null; // No conflict
}
