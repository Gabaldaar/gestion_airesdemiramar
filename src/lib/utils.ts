
import { clsx, type ClassValue } from "clsx"
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

  const selectedStart = new Date(selectedRange.from).getTime();
  const selectedEnd = new Date(selectedRange.to).getTime();

  for (const booking of existingBookings) {
    // Ignore the booking we are currently editing
    if (booking.id === currentBookingId) {
      continue;
    }

    const bookingStart = new Date(booking.startDate).getTime();
    const bookingEnd = new Date(booking.endDate).getTime();

    // Check for overlap
    if (selectedStart < bookingEnd && selectedEnd > bookingStart) {
      return booking; // Found a conflict
    }
  }

  return null; // No conflict
}
