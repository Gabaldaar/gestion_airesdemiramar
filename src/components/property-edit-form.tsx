
'use client';

import { useActionState } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Property } from '@/lib/data';
import { updateProperty } from '@/lib/actions';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

const initialState = {
  message: '',
  success: false,
};

export function PropertyEditForm({ property }: { property: Property }) {
  const [state, formAction] = useActionState(updateProperty, initialState);
  const formId = `property-edit-form-${property.id}`;

  return (
    <TableRow>
        <TableCell colSpan={5}>
            <form id={formId} action={formAction} className="space-y-4">
                <input type="hidden" name="id" value={property.id} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <Label htmlFor={`name-${property.id}`}>Nombre</Label>
                        <Input id={`name-${property.id}`} type="text" name="name" defaultValue={property.name} />
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor={`address-${property.id}`}>Dirección</Label>
                        <Input id={`address-${property.id}`} type="text" name="address" defaultValue={property.address} />
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor={`googleCalendarId-${property.id}`}>ID Calendario Google</Label>
                        <Input id={`googleCalendarId-${property.id}`} type="text" name="googleCalendarId" defaultValue={property.googleCalendarId} />
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor={`imageUrl-${property.id}`}>URL de Foto</Label>
                        <Input id={`imageUrl-${property.id}`} type="text" name="imageUrl" defaultValue={property.imageUrl} />
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor={`notes-${property.id}`}>Notas</Label>
                        <Textarea id={`notes-${property.id}`} name="notes" defaultValue={property.notes} />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button type="submit">Guardar</Button>
                </div>
                 {state.message && !state.success && (
                    <p className="text-red-500 text-sm">{state.message}</p>
                )}
            </form>
        </TableCell>
    </TableRow>
  );
}
