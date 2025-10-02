
'use client';

import { useEffect, useState, useTransition } from 'react';
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
import { updateTenant } from '@/lib/data';
import { Tenant, Origin, getOrigins } from '@/lib/data';
import { Pencil, Loader2 } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from './ui/use-toast';

function SubmitButton({ isPending }: { isPending: boolean }) {
    return (
        <Button type="submit" disabled={isPending}>
            {isPending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                </>
            ) : (
                'Guardar Cambios'
            )}
        </Button>
    )
}

export function TenantEditForm({ tenant, onTenantUpdated }: { tenant: Tenant, onTenantUpdated: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      getOrigins().then(setOrigins);
    }
  }, [isOpen]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updatedTenant: Tenant = {
        id: tenant.id,
        name: formData.get('name') as string,
        dni: formData.get('dni') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string,
        city: formData.get('city') as string,
        country: formData.get('country') as string,
        notes: formData.get('notes') as string,
        originId: formData.get('originId') === 'none' ? undefined : formData.get('originId') as string,
    };

    startTransition(async () => {
        try {
            await updateTenant(updatedTenant);
            toast({ title: 'Éxito', description: 'Inquilino actualizado.' });
            setIsOpen(false);
            onTenantUpdated();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: `No se pudo actualizar el inquilino: ${error.message}` });
        }
    });
  }

  return (
    <>
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
          <form onSubmit={handleSubmit}>
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
                      <Input id="dni" name="dni" defaultValue={tenant.dni} className="col-span-3" />
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
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="originId" className="text-right">
                          Origen
                      </Label>
                      <Select name="originId" defaultValue={tenant.originId || 'none'}>
                          <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Selecciona un origen" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="none">Ninguno</SelectItem>
                              {origins.map(origin => (
                                  <SelectItem key={origin.id} value={origin.id}>
                                      {origin.name}
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="notes" className="text-right pt-2">
                        Notas
                    </Label>
                    <Textarea id="notes" name="notes" defaultValue={tenant.notes} className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                  <SubmitButton isPending={isPending} />
              </DialogFooter>
          </form>
      </DialogContent>
      </Dialog>
    </>
  );
}

    