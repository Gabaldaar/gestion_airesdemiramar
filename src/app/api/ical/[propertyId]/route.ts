
import { getBookingsByPropertyId, getPropertyById, getTenantById } from '@/lib/data';
import { NextRequest } from 'next/server';
import { format, addDays } from 'date-fns';

function formatICalDate(date: Date): string {
    // Format for an all-day event: YYYYMMDD
    return date.toISOString().split('T')[0].replace(/-/g, '');
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

    const tenantIds = [...new Set(bookings.map(b => b.tenantId))];
    const tenants = await Promise.all(tenantIds.map(id => getTenantById(id)));
    const tenantsMap = new Map(tenants.map(t => t && [t.id, t]));

    const events: string[] = [];

    bookings.forEach(booking => {
        if (booking.status && booking.status !== 'active') {
            return; // Skip cancelled or pending bookings
        }

        const tenant = tenantsMap.get(booking.tenantId);
        const tenantName = tenant ? tenant.name : 'Inquilino Desconocido';
        const propertyName = property.name;

        // --- Main Blocking Event ---
        const startBookingDate = addDays(new Date(booking.startDate), 1);
        const endBookingDate = addDays(new Date(booking.endDate), 1);
        const eventUID = `${booking.id}@adm.com`;

        events.push(
        `BEGIN:VEVENT`,
        `UID:${eventUID}`,
        `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
        `DTSTART;VALUE=DATE:${formatICalDate(startBookingDate)}`,
        `DTEND;VALUE=DATE:${formatICalDate(endBookingDate)}`,
        `SUMMARY:Ocupado - ${tenantName} - ${propertyName}`,
        `DESCRIPTION:Reserva para ${tenantName}. Check-in el ${format(new Date(booking.startDate), 'yyyy-MM-dd')}, Check-out el ${format(new Date(booking.endDate), 'yyyy-MM-dd')}.`,
        `END:VEVENT`
        );
    });

    const iCalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      `PRODID:-//AiresDeMiramar//GestorDeAlquileres//EN`,
      `NAME:${property.name}`,
      `X-WR-CALNAME:${property.name}`,
      ...events,
      'END:VCALENDAR',
    ].join('\r\n');

    return new Response(iCalContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="calendar_${propertyId}.ics"`,
      },
    });
  } catch (error) {
    console.error('Error generating iCal feed:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
