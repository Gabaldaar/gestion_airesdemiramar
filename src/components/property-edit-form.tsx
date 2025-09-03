
'use client';

import { useActionState } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Property } from '@/lib/data';
import { updateProperty } from '@/lib/actions';
import { NotesDialog } from './notes-dialog';

const initialState = {
  message: '',
  success: false,
};

export function PropertyEditForm({ property }: { property: Property }) {
  const [state, formAction] = useActionState(updateProperty, initialState);
  const formId = `property-edit-form-${property.id}`;

  return (
    <TableRow>
        <TableCell className="font-medium">
            <form id={formId} action={formAction} className="hidden" />
            <input type="hidden" name="id" value={property.id} form={formId} />
            <Input type="text" name="name" defaultValue={property.name} form={formId} />
        </TableCell>
        <TableCell>
            <Input type="text" name="address" defaultValue={property.address} form={formId} />
        </TableCell>
        <TableCell>
            <Input type="text" name="googleCalendarId" defaultValue={property.googleCalendarId} form={formId} />
        </TableCell>
        <TableCell>
            <Input type="text" name="imageUrl" defaultValue={property.imageUrl} form={formId} />
        </TableCell>
        <TableCell className="text-right">
            <div className="flex items-center justify-end gap-2">
                <NotesDialog 
                    formId={formId}
                    notes={property.notes}
                />
                <Button type="submit" form={formId}>Guardar</Button>
            </div>
        </TableCell>
    </TableRow>
  );
}
