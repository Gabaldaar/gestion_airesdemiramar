
'use client';

import { useTransition, useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { TableRow, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Property } from '@/lib/data';
import { updateProperty } from '@/lib/actions';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { PropertyDeleteForm } from './property-delete-form';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import useWindowSize from '@/hooks/use-window-size';
import { useToast } from './ui/use-toast';


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

export function PropertyEditForm({ property }: { property: Property }) {
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await updateProperty(initialState, formData);
        setState(result);
    });
  }

  useEffect(() => {
    if (state.message) {
        toast({
            title: state.success ? 'Éxito' : 'Error',
            description: state.message,
            variant: state.success ? 'default' : 'destructive',
        });
    }
  }, [state, toast]);

  return (
    <div className="py-4">
        <form action={formAction} className="space-y-4">
            <input type="hidden" name="id" value={property.id} />
             <h4 className="text-lg font-semibold text-primary">{property.name}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1">
                    <Label htmlFor={`name-${property.id}`}>Nombre</Label>
                    <Input id={`name-${property.id}`} type="text" name="name" defaultValue={property.name} />
                </div>
                <div className="col-span-1">
                    <Label htmlFor={`address-${property.id}`}>Dirección</Label>
                    <Input id={`address-${property.id}`} type="text" name="address" defaultValue={property.address} />
                </div>
                <div className="col-span-1">
                    <Label htmlFor={`imageUrl-${property.id}`}>URL de Foto</Label>
                    <Input id={`imageUrl-${property.id}`} type="text" name="imageUrl" defaultValue={property.imageUrl} />
                </div>
                <div className="col-span-1">
                    <Label htmlFor={`propertyUrl-${property.id}`}>Web de la Propiedad</Label>
                    <Input id={`propertyUrl-${property.id}`} type="text" name="propertyUrl" defaultValue={property.propertyUrl} placeholder="Ej: https://airbnb.com/h/mi-depto"/>
                </div>
                <div className="col-span-1">
                    <Label htmlFor={`priceSheetName-${property.id}`}>Nombre en Hoja de Precios</Label>
                    <Input id={`priceSheetName-${property.id}`} type="text" name="priceSheetName" defaultValue={property.priceSheetName} placeholder="Nombre exacto en la App Script"/>
                </div>
                <div className="col-span-1 md:col-span-2">
                    <Label htmlFor={`notes-${property.id}`}>Notas</Label>
                    <Textarea id={`notes-${property.id}`} name="notes" defaultValue={property.notes} />
                </div>
                <div className="col-span-1 md:col-span-2">
                    <Label htmlFor={`contractTemplate-${property.id}`}>Plantilla de Contrato</Label>
                    <Textarea id={`contractTemplate-${property.id}`} name="contractTemplate" defaultValue={property.contractTemplate} className="h-40" />
                </div>
                
                {/* Custom Fields */}
                <div className="col-span-1 md:col-span-2 border-t pt-4 mt-2">
                  <h4 className="text-md font-medium mb-4 text-center">Campos Personalizados</h4>
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
                <SubmitButton />
            </div>
             {state.message && !state.success && (
                <p className="text-red-500 text-sm">{state.message}</p>
            )}
        </form>
    </div>
  );
}
