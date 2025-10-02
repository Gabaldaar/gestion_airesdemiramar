
'use client';

import { useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Property, updateProperty } from '@/lib/data';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { PropertyDeleteForm } from './property-delete-form';
import { Loader2 } from 'lucide-react';
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

export function PropertyEditForm({ property }: { property: Property }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updatedProperty: Property = {
        id: property.id,
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
            await updateProperty(updatedProperty);
            toast({ title: 'Éxito', description: 'Propiedad actualizada.' });
            window.location.reload();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: `No se pudo actualizar la propiedad: ${error.message}` });
        }
    });
  }

  return (
    <div className="py-4">
        <form onSubmit={handleSubmit} className="space-y-4">
             <h4 className="text-lg font-semibold text-primary">{property.name}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor={`name-${property.id}`}>Nombre</Label>
                    <Input id={`name-${property.id}`} type="text" name="name" defaultValue={property.name} />
                </div>
                <div>
                    <Label htmlFor={`address-${property.id}`}>Dirección</Label>
                    <Input id={`address-${property.id}`} type="text" name="address" defaultValue={property.address} />
                </div>
                <div>
                    <Label htmlFor={`googleCalendarId-${property.id}`}>ID Calendario Google</Label>
                    <Input id={`googleCalendarId-${property.id}`} type="text" name="googleCalendarId" defaultValue={property.googleCalendarId} />
                </div>
                <div>
                    <Label htmlFor={`imageUrl-${property.id}`}>URL de Foto</Label>
                    <Input id={`imageUrl-${property.id}`} type="text" name="imageUrl" defaultValue={property.imageUrl} />
                </div>
                <div className="md:col-span-2">
                    <Label htmlFor={`notes-${property.id}`}>Notas</Label>
                    <Textarea id={`notes-${property.id}`} name="notes" defaultValue={property.notes} />
                </div>
                <div className="md:col-span-2">
                    <Label htmlFor={`contractTemplate-${property.id}`}>Plantilla de Contrato</Label>
                    <Textarea id={`contractTemplate-${property.id}`} name="contractTemplate" defaultValue={property.contractTemplate} className="h-40" />
                </div>
                
                {/* Custom Fields */}
                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <h4 className="text-md font-medium mb-4 text-center">Campos Personalizados</h4>
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="grid grid-cols-2 gap-4 mb-4">
                        <div className='space-y-1'>
                            <Label htmlFor={`customField${i}Label-${property.id}`} className="text-sm">Etiqueta Campo {i}</Label>
                            <Input id={`customField${i}Label-${property.id}`} name={`customField${i}Label`} defaultValue={property[`customField${i}Label` as keyof Property] as string} placeholder={`Ej: WiFi Pass`} />
                        </div>
                        <div className='space-y-1'>
                            <Label htmlFor={`customField${i}Value-${property.id}`} className="text-sm">Valor Campo {i}</Label>
                            <Input id={`customField${i}Value-${property.id}`} name={`customField${i}Value`} defaultValue={property[`customField${i}Value` as keyof Property] as string} placeholder="Valor" />
                        </div>
                    </div>
                  ))}
                </div>
            </div>
            <div className="flex justify-between items-center">
                <PropertyDeleteForm propertyId={property.id} propertyName={property.name} />
                <SubmitButton isPending={isPending} />
            </div>
        </form>
    </div>
  );
}

    