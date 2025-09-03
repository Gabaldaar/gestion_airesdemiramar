
'use client';

import { useActionState, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateTenant } from '@/lib/actions';
import { Tenant } from '@/lib/data';
import { Pencil } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { NotesDialog } from './notes-dialog';

const initialState = {
  message: '',
  success: false,
};

export function TenantEditForm({ tenant }: { tenant: Tenant }) {
  const [state, formAction] = useActionState(updateTenant, initialState);
  const [isOpen, setIsOpen] = useState(false);
  const formId = `tenant-edit-form-${tenant.id}`;

  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
    }
  }, [state]);

  return (
    <>
        <NotesDialog 
            formId={formId}
            notes={tenant.notes}
        />
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Editar Inquilino</span>
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
            <DialogTitle>Editar Inquilino</DialogTitle>
            <DialogDescription>
                Modifica los datos del inquilino. Haz clic en guardar cuando termines.
            </DialogDescription>
            </DialogHeader>
            <form id={formId} action={formAction}>
                <input type="hidden" name="id" value={tenant.id} />
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                        Nombre
                        </Label>
                        <Input id="name" name="name" defaultValue={tenant.name} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="dni" className="text-right">
                        DNI
                        </Label>
                        <Input id="dni" name="dni" defaultValue={tenant.dni} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                        Email
                        </Label>
                        <Input id="email" name="email" type="email" defaultValue={tenant.email} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">
                        Teléfono
                        </Label>
                        <Input id="phone" name="phone" defaultValue={tenant.phone} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="address" className="text-right">
                        Dirección
                        </Label>
                        <Input id="address" name="address" defaultValue={tenant.address} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="city" className="text-right">
                        Ciudad
                        </Label>
                        <Input id="city" name="city" defaultValue={tenant.city} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="country" className="text-right">
                        País
                        </Label>
                        <Input id="country" name="country" defaultValue={tenant.country} className="col-span-3" />
                    </div>
                </div>
            </form>
            <DialogFooter>
                <Button type="submit" form={formId}>Guardar Cambios</Button>
            </DialogFooter>
            {state.message && !state.success && (
                <p className="text-red-500 text-sm mt-2">{state.message}</p>
            )}
        </DialogContent>
        </Dialog>
    </>
  );
}
