
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateTenant } from '@/lib/actions';
import { Tenant, Origin, getOrigins } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { countries } from '@/lib/countries';

const initialState = {
  message: '',
  success: false,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? (
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

interface TenantEditFormProps {
    tenant: Tenant;
    onTenantUpdated: () => void;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function TenantEditForm({ tenant, onTenantUpdated, isOpen, onOpenChange }: TenantEditFormProps) {
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const [origins, setOrigins] = useState<Origin[]>([]);

  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await updateTenant(initialState, formData);
        setState(result);
    });
  };

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
      onTenantUpdated();
    }
  }, [state, onTenantUpdated, onOpenChange]);

  useEffect(() => {
    if (isOpen) {
      getOrigins().then(setOrigins);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
          <DialogTitle>Editar Inquilino</DialogTitle>
          <DialogDescription>
              Modifica los datos del inquilino. Haz clic en guardar cuando termines.
          </DialogDescription>
          </DialogHeader>
          <form action={formAction}>
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
                      <div className="col-span-3 flex items-center gap-2">
                          <Select name="countryCode" defaultValue={tenant.countryCode || "+54"}>
                              <SelectTrigger className="w-[120px]">
                                  <SelectValue placeholder="+54" />
                              </SelectTrigger>
                              <SelectContent>
                                  {countries.map(country => (
                                      <SelectItem key={country.code} value={country.dial_code}>
                                          {country.name} ({country.dial_code})
                                      </SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                          <Input id="phone" name="phone" defaultValue={tenant.phone} className="flex-grow" />
                      </div>
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
                  <SubmitButton />
              </DialogFooter>
          </form>
          {state.message && !state.success && (
              <p className="text-red-500 text-sm mt-2">{state.message}</p>
          )}
      </DialogContent>
    </Dialog>
  );
}
