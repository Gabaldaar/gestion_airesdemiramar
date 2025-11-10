
import { getBookingsByPropertyId, getPropertyById, getTenantById } from '@/lib/data';
import { NextRequest } from 'next/server';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';


function formatICalDate(date: Date): string {
    // Format for an all-day event: YYYYMMDD
    return date.toISOString().split('T')[0].replace(/-/g, '');
}

function formatICalDateTime(date: Date): string