
import { getBookingsByPropertyId, getPropertyById, getTenantById } from '@/lib/data';
import { NextRequest } from 'next/server';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';


function formatICalDate(date: Date): string {
    // Format for an all-day event: YYYYMMDD
    return date.toISOString().split('T')[0].replace(/-/g, '');
}

function escapeICalText(text: string): string {
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
      const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      // --- Create Check-in Event ---
      const checkinDate = new Date(booking.startDate);
      const checkinSummary = `Check-in: ${tenantName} - ${property.name}`;
      const checkinDescription = `Llegada de ${escapeICalText(tenantName)} a ${escapeICalText(property.name)}.\n\nFecha: ${format(checkinDate, "dd/MM/yyyy", { locale: es })}`;
      
      icalContent.push('BEGIN:VEVENT');
      icalContent.push(`UID:${booking.id}-checkin@airesdemiramar.app`);
      icalContent.push(`DTSTAMP:${timestamp}`);
      icalContent.push(`DTSTART;VALUE=DATE:${formatICalDate(checkinDate)}`); // All-day event
      icalContent.push(`SUMMARY:${escapeICalText(checkinSummary)}`);
      icalContent.push(`DESCRIPTION:${checkinDescription}`);
      icalContent.push('END:VEVENT');

      // --- Create Check-out Event ---
      const checkoutDate = new Date(booking.endDate);
      const checkoutSummary = `Check-out: ${tenantName} - ${property.name}`;
      const checkoutDescription = `Salida de ${escapeICalText(tenantName)} de ${escapeICalText(property.name)}.\n\nFecha: ${format(checkoutDate, "dd/MM/yyyy", { locale: es })}`;

      icalContent.push('BEGIN:VEVENT');
      icalContent.push(`UID:${booking.id}-checkout@airesdemiramar.app`);
      icalContent.push(`DTSTAMP:${timestamp}`);
      icalContent.push(`DTSTART;VALUE=DATE:${formatICalDate(checkoutDate)}`); // All-day event
      icalContent.push(`SUMMARY:${escapeICalText(checkoutSummary)}`);
      icalContent.push(`DESCRIPTION:${checkoutDescription}`);
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
