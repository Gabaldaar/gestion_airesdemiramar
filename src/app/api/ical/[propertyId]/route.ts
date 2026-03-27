
import { getBookingsByPropertyId, getPropertyById, getTenantById, getDateBlocksByPropertyId } from '@/lib/data';
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
    const [property, bookings, blocks] = await Promise.all([
      getPropertyById(propertyId),
      getBookingsByPropertyId(propertyId),
      getDateBlocksByPropertyId(propertyId),
    ]);

    if (!property) {
      return new Response('Property not found', { status: 404 });
    }

    const tenantIds = [...new Set(bookings.map(b => b.tenantId))];
    const tenants = await Promise.all(tenantIds.map(id => getTenantById(id)));
    const tenantsMap = new Map(tenants.map(t => t && [t.id, t]));

    const events: string[] = [];

    // Process Bookings
    bookings.forEach(booking => {
        if (booking.status && booking.status !== 'active') {
            return; // Skip cancelled or pending bookings
        }

        const tenant = tenantsMap.get(booking.tenantId);
        const tenantName = tenant ? tenant.name : 'Inquilino Desconocido';
        
        // Corrected start date for blocking. The event starts on the check-in day.
        const startBlockingDate = new Date(booking.startDate);
        // End date is exclusive for all-day events. The check-out day is available.
        const endBlockingDate = new Date(booking.endDate);
        const eventUID = `${booking.id}@adm.com`;

        events.push(
        `BEGIN:VEVENT`,
        `UID:${eventUID}`,
        `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
        `DTSTART;VALUE=DATE:${formatICalDate(startBlockingDate)}`,
        `DTEND;VALUE=DATE:${formatICalDate(endBlockingDate)}`,
        `SUMMARY:Reserva - ${tenantName}`,
        `DESCRIPTION:Reserva para ${tenantName}. Check-in el ${format(new Date(booking.startDate), 'yyyy-MM-dd')}, Check-out el ${format(new Date(booking.endDate), 'yyyy-MM-dd')}.`,
        `END:VEVENT`
        );
    });
    
    // Process Date Blocks
    blocks.forEach(block => {
        const startDate = new Date(block.startDate);
        // For iCal all-day events, DTEND is exclusive. Add one day to block the full range including the end date.
        const endDate = addDays(new Date(block.endDate), 1);
        const eventUID = `block-${block.id}@adm.com`;
        const summary = `Bloqueado - ${block.reason || 'No Disponible'}`;
        
        events.push(
        `BEGIN:VEVENT`,
        `UID:${eventUID}`,
        `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
        `DTSTART;VALUE=DATE:${formatICalDate(startDate)}`,
        `DTEND;VALUE=DATE:${formatICalDate(endDate)}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:Período no disponible. Razón: ${block.reason || 'No especificada'}.`,
        `END:VEVENT`
        );
    });

    const safeFilename = property.name.replace(/[^a-zA-Z0-9]/g, '_');

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
        'Content-Disposition': `attachment; filename="calendar_${safeFilename}.ics"`,
      },
    });
  } catch (error) {
    console.error('Error generating iCal feed:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
