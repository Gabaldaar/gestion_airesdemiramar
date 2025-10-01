
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

// This is the scope we'll need to manage calendar events
const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

// Function to get the Google Auth client
const getGoogleAuth = () => {
    // These environment variables need to be set in your deployment environment
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const serviceAccountPrivateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!serviceAccountEmail || !serviceAccountPrivateKey) {
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
    const auth = getGoogleAuth();
    return google.calendar({ version: 'v3', auth });
}


/**
 * Adds an event to a specified Google Calendar.
 * @param calendarId The ID of the calendar to add the event to.
 * @param eventDetails Details of the event to create.
 * @returns The ID of the created event, or null if it fails.
 */
export async function addEventToCalendar(calendarId: string, eventDetails: CalendarEventDetails): Promise<string | null> {
    if (!calendarId) return null;

    const calendar = getCalendarClient();
    
    try {
        // Correctly handle dates by splitting the ISO string and ignoring timezones
        const startDateString = eventDetails.startDate.split('T')[0];
        // The end date for all-day events is exclusive, so we add 1 day to the checkout date.
        const endDateExclusive = addDays(new Date(eventDetails.endDate.split('T')[0]), 1);
        const endDateString = format(endDateExclusive, 'yyyy-MM-dd');


        const event = {
            summary: `Reserva - ${eventDetails.tenantName} - ${eventDetails.propertyName}`,
            description: `Notas: ${eventDetails.notes || 'N/A'}`,
            start: {
                date: startDateString,
            },
            end: {
                date: endDateString,
            },
        };

        const response = await calendar.events.insert({
            calendarId: calendarId,
            requestBody: event,
        });

        return response.data.id || null;
    } catch (error) {
        console.error(`Error creating calendar event in ${calendarId}:`, error);
        // We throw the error so the calling action can decide how to handle it.
        throw new Error('Failed to create Google Calendar event.');
    }
}

/**
 * Updates an existing event in a specified Google Calendar.
 * @param calendarId The ID of the calendar where the event exists.
 * @param eventId The ID of the event to update.
 * @param eventDetails The new details for the event.
 */
export async function updateEventInCalendar(calendarId: string, eventId: string, eventDetails: CalendarEventDetails): Promise<void> {
    if (!calendarId || !eventId) return;

    const calendar = getCalendarClient();

    try {
        // Correctly handle dates by splitting the ISO string and ignoring timezones
        const startDateString = eventDetails.startDate.split('T')[0];
        // The end date for all-day events is exclusive, so we add 1 day to the checkout date.
        const endDateExclusive = addDays(new Date(eventDetails.endDate.split('T')[0]), 1);
        const endDateString = format(endDateExclusive, 'yyyy-MM-dd');

        const event = {
            summary: `Reserva - ${eventDetails.tenantName} - ${eventDetails.propertyName}`,
            description: `Notas: ${eventDetails.notes || 'N/A'}`,
            start: {
                date: startDateString,
            },
            end: {
                date: endDateString,
            },
        };

        await calendar.events.update({
            calendarId: calendarId,
            eventId: eventId,
            requestBody: event,
        });

    } catch (error) {
        console.error(`Error updating calendar event ${eventId} in ${calendarId}:`, error);
        throw new Error('Failed to update Google Calendar event.');
    }
}


/**
 * Deletes an event from a specified Google Calendar.
 * @param calendarId The ID of the calendar to delete the event from.
 * @param eventId The ID of the event to delete.
 */
export async function deleteEventFromCalendar(calendarId: string, eventId: string): Promise<void> {
    if (!calendarId || !eventId) return;

    const calendar = getCalendarClient();
    
    try {
        await calendar.events.delete({
            calendarId: calendarId,
            eventId: eventId,
        });
    } catch (error: any) {
        // If the event is already gone, Google sends a 410 error. We can safely ignore it.
        if (error.code === 410) {
            console.log(`Event ${eventId} was already deleted from calendar ${calendarId}. Ignoring.`);
            return;
        }
        console.error(`Error deleting calendar event ${eventId} from ${calendarId}:`, error);
        throw new Error('Failed to delete Google Calendar event.');
    }
}
