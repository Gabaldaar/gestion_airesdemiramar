
import { getBookingsByPropertyId, getPropertyById, getTenantById } from '@/lib/data';
import { NextRequest } from 'next/server';

function formatICalDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
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
    
    // Fetch all tenants in parallel to optimize
    const tenantIds = [...new Set(bookings.map(b => b.tenantId))];
    const tenants = await Promise.all(tenantIds.map(id => getTenantById(id)));
    const tenantsMap = new Map(tenants.map(t => [t.id, t]));

    let icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Aires de Miramar//Property Booking Calendar//EN',
      `X-WR-CALNAME:${escapeICalText(property.name)}`,
      'CALSCALE:GREGORIAN',
    ];

    bookings.forEach(booking => {
      const tenant = tenantsMap.get(booking.tenantId);
      const tenantName = tenant ? tenant.name : 'Inquilino Desconocido';
      const startDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);
      const now = new Date();

      // For all-day events, the end date should be the day *after* the last day of the event.
      // We assume bookings are for the full day.
      const eventEndDate = new Date(endDate);

      icalContent.push('BEGIN:VEVENT');
      icalContent.push(`UID:${booking.id}@airesdemiramar.app`);
      icalContent.push(`DTSTAMP:${formatICalDate(now)}`);
      icalContent.push(`DTSTART;VALUE=DATE:${formatICalDate(startDate).substring(0, 8)}`);
      icalContent.push(`DTEND;VALUE=DATE:${formatICalDate(eventEndDate).substring(0, 8)}`);
      icalContent.push(`SUMMARY:${escapeICalText(tenantName)}`);
      
      let description = `Reserva para ${escapeICalText(tenantName)} en la propiedad ${escapeICalText(property.name)}.`;
      if (booking.notes) {
          description += `\\n\\nNotas: ${escapeICalText(booking.notes)}`;
      }
      icalContent.push(`DESCRIPTION:${description}`);
      icalContent.push('END:VEVENT');
    });

    icalContent.push('END:VCALENDAR');

    return new Response(icalContent.join('\r\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${property.name}.ics"`,
      },
    });

  } catch (error) {
    console.error(`Error generating iCal feed for property ${propertyId}:`, error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
