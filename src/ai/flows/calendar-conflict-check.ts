'use server';

/**
 * @fileOverview A flow to check for calendar conflicts in Google Calendar.
 *
 * - calendarConflictCheck - A function that checks for conflicts in a Google Calendar.
 * - CalendarConflictCheckInput - The input type for the calendarConflictCheck function.
 * - CalendarConflictCheckOutput - The return type for the calendarConflictCheck function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalendarConflictCheckInputSchema = z.object({
  calendarId: z.string().describe('The Google Calendar ID to check.'),
  startDate: z.string().describe('The start date of the event to check (ISO format).'),
  endDate: z.string().describe('The end date of the event to check (ISO format).'),
});
export type CalendarConflictCheckInput = z.infer<typeof CalendarConflictCheckInputSchema>;

const CalendarConflictCheckOutputSchema = z.object({
  hasConflict: z.boolean().describe('Whether there is a conflict in the calendar.'),
  conflictDescription: z.string().optional().describe('Description of the conflict, if any.'),
});
export type CalendarConflictCheckOutput = z.infer<typeof CalendarConflictCheckOutputSchema>;

export async function calendarConflictCheck(input: CalendarConflictCheckInput): Promise<CalendarConflictCheckOutput> {
  return calendarConflictCheckFlow(input);
}

const calendarConflictCheckPrompt = ai.definePrompt({
  name: 'calendarConflictCheckPrompt',
  input: {schema: CalendarConflictCheckInputSchema},
  output: {schema: CalendarConflictCheckOutputSchema},
  prompt: `You are a calendar assistant. You will determine if a given time range conflicts with any existing events in a Google Calendar.

  Calendar ID: {{{calendarId}}}
  Proposed Start Date: {{{startDate}}}
  Proposed End Date: {{{endDate}}}

  Determine if there are any conflicts with existing events in the calendar for the given time range. Return whether a conflict exists and a description of the conflict if one is found. If there is no conflict, return hasConflict: false.

  If the calendar ID is invalid or inaccessible, return hasConflict: true and a generic error message.
`,
});

const calendarConflictCheckFlow = ai.defineFlow(
  {
    name: 'calendarConflictCheckFlow',
    inputSchema: CalendarConflictCheckInputSchema,
    outputSchema: CalendarConflictCheckOutputSchema,
  },
  async input => {
    const {output} = await calendarConflictCheckPrompt(input);
    return output!;
  }
);
