
'use server';

import { google } from 'googleapis';
import { addDays, format } from 'date-fns';

interface CalendarEventDetails {
    startDate: string;
    endDate: string;
    tenantName: string;
    propertyName: string;
    notes?: string;
}

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

const getGoogleAuth = () => {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const serviceAccountPrivateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!serviceAccountEmail || !serviceAccountPrivateKey) {
        console.error("Google service account credentials are not set in environment variables.");
        throw new Error("Google service account credentials are not set in environment variables.");
    }
    
    return new google.auth.GoogleAuth({
        credentials: {
            client_email: serviceAccountEmail,
            private_key: serviceAccountPrivateKey,
        },
        scopes: SCOPES,
    });
};

const getCalendarClient = () => {
    try {
        const auth = getGoogleAuth();
        return google.calendar({ version: 'v3', auth });
    } catch (error) {
        console.error("Failed to get Google Calendar client:", error);
        throw error;
    }
}


export async function addEventToCalendar(calendarId: string, eventDetails: CalendarEventDetails): Promise<string | null> {
    if (!calendarId) return null;

    try {
        const calendar = getCalendarClient();
        
        const startDateString = eventDetails.startDate.split('T')[0];
        
        // Timezone-safe way to add a day for the exclusive end date
        const [year, month, day] = eventDetails.endDate.split('T')[0].split('-').map(Number);
        const endDateObj = new Date(Date.UTC(year, month - 1, day));
        const endDateExclusive = addDays(endDateObj, 1);
        const endDateString = format(endDateExclusive, 'yyyy-MM-dd');


        const event = {
            summary: `Reserva - ${eventDetails.tenantName} - ${eventDetails.propertyName}`,
            description: `Notas: ${eventDetails.notes || 'N/A'}`,
            start: {
                date: startDateString,
                timeZone: 'UTC',
            },
            end: {
                date: endDateString,
                timeZone: 'UTC',
            },
        };

        const response = await calendar.events.insert({
            calendarId: calendarId,
            requestBody: event,
        });

        console.log(`Event created successfully in calendar ${calendarId}: ${response.data.id}`);
        return response.data.id || null;
    } catch (error) {
        console.error(`Error creating calendar event in ${calendarId}:`, error);
        return null;
    }
}

export async function updateEventInCalendar(calendarId: string, eventId: string, eventDetails: CalendarEventDetails): Promise<void> {
    if (!calendarId || !eventId) return;

    try {
        const calendar = getCalendarClient();

        const startDateString = eventDetails.startDate.split('T')[0];
        
        const [year, month, day] = eventDetails.endDate.split('T')[0].split('-').map(Number);
        const endDateObj = new Date(Date.UTC(year, month - 1, day));
        const endDateExclusive = addDays(endDateObj, 1);
        const endDateString = format(endDateExclusive, 'yyyy-MM-dd');

        const event = {
            summary: `Reserva - ${eventDetails.tenantName} - ${eventDetails.propertyName}`,
            description: `Notas: ${eventDetails.notes || 'N/A'}`,
            start: {
                date: startDateString,
                timeZone: 'UTC',
            },
            end: {
                date: endDateString,
                timeZone: 'UTC',
            },
        };

        await calendar.events.update({
            calendarId: calendarId,
            eventId: eventId,
            requestBody: event,
        });

        console.log(`Event ${eventId} updated successfully in calendar ${calendarId}`);

    } catch (error) {
        console.error(`Error updating calendar event ${eventId} in ${calendarId}:`, error);
    }
}


export async function deleteEventFromCalendar(calendarId: string, eventId: string): Promise<void> {
    if (!calendarId || !eventId) return;

    try {
        const calendar = getCalendarClient();
        await calendar.events.delete({
            calendarId: calendarId,
            eventId: eventId,
        });
        console.log(`Event ${eventId} deleted successfully from calendar ${calendarId}`);
    } catch (error: any) {
        if (error.code === 410) {
            console.log(`Event ${eventId} was already deleted from calendar ${calendarId}. Ignoring.`);
            return;
        }
        console.error(`Error deleting calendar event ${eventId} from ${calendarId}:`, error);
    }
}
