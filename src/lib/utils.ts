
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

  // Set time to beginning of the day for `from` and end for `to` for accurate comparison
  const selectedStart = new Date(selectedRange.from);
  selectedStart.setHours(0, 0, 0, 0);

  const selectedEnd = new Date(selectedRange.to);
  selectedEnd.setHours(23, 59, 59, 999);


  for (const booking of existingBookings) {
    // Ignore the booking we are currently editing
    if (booking.id === currentBookingId) {
      continue;
    }

    const bookingStart = new Date(booking.startDate);
    bookingStart.setHours(0, 0, 0, 0);
    
    const bookingEnd = new Date(booking.endDate);
    bookingEnd.setHours(23, 59, 59, 999);

    // Check for overlap:
    // A conflict exists if (StartA <= EndB) and (EndA >= StartB)
    if (selectedStart.getTime() < bookingEnd.getTime() && selectedEnd.getTime() > bookingStart.getTime()) {
       return booking; // Found a conflict
    }
  }

  return null; // No conflict
}
