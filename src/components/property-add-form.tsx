'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
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
import { addProperty } from '@/lib/actions';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Textarea } from './ui/textarea';

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
                'Guardar Propiedad'
            )}
        </Button>
    )
}

export function PropertyAddForm() {
  const [state, formAction] = useActionState(addProperty, initialState);
  const [isOpen, setIsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva Propiedad
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Añadir Nueva Propiedad</DialogTitle>
          <DialogDescription>
            Completa los datos de la nueva propiedad. Haz clic en guardar cuando termines.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef}>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                    Nombre
                    </Label>
                    <Input id="name" name="name" className="col-span-3" required />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="address" className="text-right">
                    Dirección
                    </Label>
                    <Input id="address" name="address" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="googleCalendarId" className="text-right">
                    ID Calendario Google
                    </Label>
                    <Input id="googleCalendarId" name="googleCalendarId" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="imageUrl" className="text-right">
                    URL de Foto
                    </Label>
                    <Input id="imageUrl" name="imageUrl" defaultValue="https://picsum.photos/600/400" className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="notes" className="text-right pt-2">
                        Notas
                    </Label>
                    <Textarea id="notes" name="notes" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="contractTemplate" className="text-right pt-2">
                        Plantilla de Contrato
                    </Label>
                    <Textarea id="contractTemplate" name="contractTemplate" className="col-span-3 h-32" />
                </div>
                
                {/* Custom Fields */}
                <div className="col-span-4 border-t pt-4 mt-2">
                  <h4 className="text-md font-medium mb-4 text-center">Campos Personalizados</h4>
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="grid grid-cols-2 gap-4 mb-4">
                        <div className='space-y-1'>
                            <Label htmlFor={`customField${i}Label`} className="text-sm">Etiqueta Campo {i}</Label>
                            <Input id={`customField${i}Label`} name={`customField${i}Label`} placeholder={`Ej: WiFi Pass`} />
                        </div>
                        <div className='space-y-1'>
                            <Label htmlFor={`customField${i}Value`} className="text-sm">Valor Campo {i}</Label>
                            <Input id={`customField${i}Value`} name={`customField${i}Value`} placeholder="Valor" />
                        </div>
                    </div>
                  ))}
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
