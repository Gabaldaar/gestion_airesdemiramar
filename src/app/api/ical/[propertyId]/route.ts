
import { getBookingsByPropertyId, getPropertyById, getTenantById } from '@/lib/data';
import { NextRequest } from 'next/server';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';


function formatICalDate(date: Date): string {
    // Format for an all-day event: YYYYMMDD
    return date.toISOString().split('T')[0].replace(/-/g, '');
}

function formatICalDateTime(date: Date): string {
    // Format for a specific time event: YYYYMMDDTHHMMSSZ
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeICalText(text: string): string {
    if (!text) return '';
    return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export async function GET(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  const propertyId = params.propertyId;

  if (!propertyId) {
    return new Response('Property ID is required', { status: 400 });
  }

  try {
    const [property, bookings] = await Promise.all([
      getPropertyById(propertyId),
      getBookingsByPropertyId(propertyId),
    ]);

    if (!property) {
      return new Response('Property not found', { status: 404 });
    }
    
    const activeBookings = bookings.filter(b => !b.status || b.status === 'active');

    const tenantIds = [...new Set(activeBookings.map(b => b.tenantId))];
    const tenants = await Promise.all(tenantIds.map(id => getTenantById(id)));
    const tenantsMap = new Map(tenants.map(t => [t?.id, t]));

    let icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Aires de Miramar//Property Booking Calendar//EN',
      `X-WR-CALNAME:${escapeICalText(property.name)}`,
      'CALSCALE:GREGORIAN',
    ];

    activeBookings.forEach(booking => {
      const tenant = tenantsMap.get(booking.tenantId);
      const tenantName = tenant ? tenant.name : 'Inquilino Desconocido';
      const now = new Date();
      const timestamp = formatICalDateTime(now);

      const checkinDate = new Date(booking.startDate);
      const checkoutDate = new Date(booking.endDate);
      
      // --- Create Check-out Event (All-day) ---
      const checkoutSummary = `Check-out: ${tenantName}`;
      const checkoutDescription = `Salida de ${escapeICalText(tenantName)} de ${escapeICalText(property.name)}.\n\nFecha: ${format(checkoutDate, "dd/MM/yyyy", { locale: es })}`;

      icalContent.push('BEGIN:VEVENT');
      icalContent.push(`UID:${booking.id}-checkout@airesdemiramar.app`);
      icalContent.push(`DTSTAMP:${timestamp}`);
      icalContent.push(`DTSTART;VALUE=DATE:${formatICalDate(checkoutDate)}`);
      icalContent.push(`SUMMARY:${escapeICalText(checkoutSummary)}`);
      icalContent.push(`DESCRIPTION:${checkoutDescription}`);
      icalContent.push('END:VEVENT');

      // --- Create Full Booking Event (for blocking dates) ---
      // This event starts on the day AFTER check-in and ends the day of check-out
      const bookingStartDay = addDays(checkinDate, 1);
      const bookingSummary = `Ocupado - ${tenantName} - ${property.name}`;
      const bookingDescription = `Reserva a nombre de ${escapeICalText(tenantName)}.\nCheck-in: ${format(checkinDate, "dd/MM/yyyy")}\nCheck-out: ${format(checkoutDate, "dd/MM/yyyy")}`;

      icalContent.push('BEGIN:VEVENT');
      icalContent.push(`UID:${booking.id}-booking@airesdemiramar.app`);
      icalContent.push(`DTSTAMP:${timestamp}`);
      icalContent.push(`DTSTART;VALUE=DATE:${formatICalDate(bookingStartDay)}`);
      // DTEND is exclusive, so it should be the day after the last day of the event.
      icalContent.push(`DTEND;VALUE=DATE:${formatICalDate(addDays(checkoutDate, 1))}`);
      icalContent.push(`SUMMARY:${escapeICalText(bookingSummary)}`);
      icalContent.push(`DESCRIPTION:${bookingDescription}`);
      icalContent.push('END:VEVENT');

    });

    icalContent.push('END:VCALENDAR');

    return new Response(icalContent.join('\r\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="eventos_${property.name}.ics"`,
      },
    });

  } catch (error) {
    console.error(`Error generating iCal feed for property ${propertyId}:`, error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
