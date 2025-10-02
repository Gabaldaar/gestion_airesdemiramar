
'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
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
import { addTenant, Tenant, Origin, getOrigins } from '@/lib/data';
import { PlusCircle, Loader2 } from 'lucide-react';
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
                'Guardar Inquilino'
            )}
        </Button>
    )
}

export function TenantAddForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [origins, setOrigins] = useState<Origin[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
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
    const newTenant: Omit<Tenant, 'id'> = {
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
            await addTenant(newTenant);
            toast({ title: 'Éxito', description: 'Inquilino añadido.' });
            setIsOpen(false);
            formRef.current?.reset();
            window.location.reload();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: `No se pudo añadir el inquilino: ${error.message}` });
        }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Inquilino
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Inquilino</DialogTitle>
          <DialogDescription>
            Completa los datos del nuevo inquilino. Haz clic en guardar cuando termines.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} ref={formRef}>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                    Nombre
                    </Label>
                    <Input id="name" name="name" className="col-span-3" required />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="dni" className="text-right">
                    DNI
                    </Label>
                    <Input id="dni" name="dni" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                    Email
                    </Label>
                    <Input id="email" name="email" type="email" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">
                    Teléfono
                    </Label>
                    <Input id="phone" name="phone" className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="address" className="text-right">
                    Dirección
                    </Label>
                    <Input id="address" name="address" className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="city" className="text-right">
                    Ciudad
                    </Label>
                    <Input id="city" name="city" className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="country" className="text-right">
                    País
                    </Label>
                    <Input id="country" name="country" defaultValue="Argentina" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="originId" className="text-right">
                        Origen
                    </Label>
                    <Select name="originId" defaultValue="none">
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
                    <Textarea id="notes" name="notes" className="col-span-3" />
                </div>
            </div>
            <DialogFooter>
                <SubmitButton isPending={isPending} />
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    