
'use client';

import { useFormState } from 'react-dom';
import { TableRow, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Property } from '@/lib/data';
import { updateProperty } from '@/lib/actions';

const initialState = {
  message: '',
  success: false,
};

export function PropertyEditForm({ property }: { property: Property }) {
  const [state, formAction] = useFormState(updateProperty, initialState);

  return (
    <TableRow>
      <form action={formAction} className="contents">
        <input type="hidden" name="id" value={property.id} />
        <TableCell className="font-medium">
          <Input type="text" name="name" defaultValue={property.name} />
        </TableCell>
        <TableCell>
          <Input type="text" name="address" defaultValue={property.address} />
        </TableCell>
        <TableCell>
          <Input type="text" name="googleCalendarId" defaultValue={property.googleCalendarId} />
        </TableCell>
        <TableCell className="text-right">
          <Button type="submit">Guardar</Button>
        </TableCell>
      </form>
    </TableRow>
  );
}
