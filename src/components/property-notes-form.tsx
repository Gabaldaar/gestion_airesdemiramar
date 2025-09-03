
'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Property } from '@/lib/data';
import { updateProperty } from '@/lib/actions';
import { NotesDialog } from './notes-dialog';

const initialState = {
  message: '',
  success: false,
};

// This is a new component to encapsulate the form logic for notes on the property detail page.
export function PropertyNotesForm({ property }: { property: Property }) {
  const [state, formAction] = useActionState(updateProperty, initialState);
  const formId = `property-notes-form-${property.id}`;

  return (
    <div>
        <form id={formId} action={formAction} className="space-y-4">
            {/* Hidden fields to pass all property data to the server action */}
            <input type="hidden" name="id" defaultValue={property.id} />
            <input type="hidden" name="name" defaultValue={property.name} />
            <input type="hidden" name="address" defaultValue={property.address} />
            <input type="hidden" name="googleCalendarId" defaultValue={property.googleCalendarId || ''} />
            <input type="hidden" name="imageUrl" defaultValue={property.imageUrl} />
            
            <div className="flex items-center justify-end gap-2">
                 <NotesDialog 
                    formId={formId}
                    notes={property.notes}
                />
                {/* The submit button is inside the dialog now, but we could have a standalone save button here too */}
            </div>
        </form>
         {state?.message && !state.success && (
            <p className="text-sm text-red-500 mt-2">{state.message}</p>
        )}
         {state?.message && state.success && (
            <p className="text-sm text-green-500 mt-2">{state.message}</p>
        )}
    </div>
  );
}
