
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
import { addProperty, Property } from '@/lib/data';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Textarea } from './ui/textarea';
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
                'Guardar Propiedad'
            )}
        </Button>
    )
}

export function PropertyAddForm() {
  const [isOpen, setIsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newProperty: Omit<Property, 'id'> = {
        name: formData.get('name') as string,
        address: formData.get('address') as string,
        googleCalendarId: formData.get('googleCalendarId') as string,
        imageUrl: formData.get('imageUrl') as string,
        notes: formData.get('notes') as string,
        contractTemplate: formData.get('contractTemplate') as string,
        customField1Label: formData.get('customField1Label') as string,
        customField1Value: formData.get('customField1Value') as string,
        customField2Label: formData.get('customField2Label') as string,
        customField2Value: formData.get('customField2Value') as string,
        customField3Label: formData.get('customField3Label') as string,
        customField3Value: formData.get('customField3Value') as string,
        customField4Label: formData.get('customField4Label') as string,
        customField4Value: formData.get('customField4Value') as string,
        customField5Label: formData.get('customField5Label') as string,
        customField5Value: formData.get('customField5Value') as string,
        customField6Label: formData.get('customField6Label') as string,
        customField6Value: formData.get('customField6Value') as string,
    };

    startTransition(async () => {
        try {
            await addProperty(newProperty);
            toast({ title: 'Éxito', description: 'Propiedad creada.' });
            setIsOpen(false);
            formRef.current?.reset();
            window.location.reload();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: `No se pudo crear la propiedad: ${error.message}` });
        }
    });
  };

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
        <form onSubmit={handleSubmit} ref={formRef}>
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
                <SubmitButton isPending={isPending} />
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    