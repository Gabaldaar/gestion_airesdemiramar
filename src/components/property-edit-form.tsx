
'use client';

import { useTransition, useState, useEffect, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { TableRow, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { Property, Provider } from '@/lib/data';
import { updateProperty } from '@/lib/actions';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { PropertyDeleteForm } from './property-delete-form';
import { Loader2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import useWindowSize from '@/hooks/use-window-size';
import { useToast } from './ui/use-toast';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';


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

export function PropertyEditForm({ property, providers }: { property: Property; providers: Provider[] }) {
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const isPersonalFlavor = process.env.NEXT_PUBLIC_APP_FLAVOR !== 'commercial';

  const [imageUrl, setImageUrl] = useState(property.imageUrl || '');
  const [isUploading, setIsUploading] = useState(false);

  const visitRateProviders = useMemo(() => {
    return providers.filter(p => p.billingType === 'per_visit' || p.billingType === 'hourly_or_visit');
  }, [providers]);

  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await updateProperty(initialState, formData);
        setState(result);
    });
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "Archivo demasiado grande",
        description: "La imagen no debe superar los 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    const filePath = `property_images/${property.id}/main_image.jpg`;
    const storageRef = ref(storage, filePath);

    try {
      const uploadTask = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadTask.ref);
      setImageUrl(downloadURL); // Update state, which updates the input value
      toast({
        title: "¡Éxito!",
        description: "La imagen se ha subido. Guarda los cambios para que sea permanente.",
      });
    } catch (error: any) {
      console.error("Image upload failed:", error);
      let description = "No se pudo completar la subida. Revisa la consola para más detalles.";
      if (error.code === 'storage/unauthorized') {
          description = "Error de permisos. Asegúrate de que Firebase Storage esté habilitado en tu proyecto y que las reglas de seguridad permitan la escritura.";
      } else {
          description = error.message || description;
      }
      toast({
        title: "Error al subir la imagen",
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };


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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="col-span-1 md:col-span-2 lg:col-span-1 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor={`name-${property.id}`}>Nombre</Label>
                        <Input id={`name-${property.id}`} type="text" name="name" defaultValue={property.name} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`address-${property.id}`}>Dirección</Label>
                        <Input id={`address-${property.id}`} type="text" name="address" defaultValue={property.address} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`propertyUrl-${property.id}`}>Web de la Propiedad</Label>
                        <Input id={`propertyUrl-${property.id}`} type="text" name="propertyUrl" defaultValue={property.propertyUrl} placeholder="Ej: https://airbnb.com/h/mi-depto"/>
                    </div>
                    {isPersonalFlavor && (
                        <div className="space-y-2">
                            <Label htmlFor={`priceSheetName-${property.id}`}>Nombre en Hoja de Precios</Label>
                            <Input id={`priceSheetName-${property.id}`} type="text" name="priceSheetName" defaultValue={property.priceSheetName} placeholder="Nombre exacto en la App Script"/>
                        </div>
                    )}
                </div>

                <div className="col-span-1 md:col-span-2 lg:col-span-1">
                    <Label>Imagen de la Propiedad</Label>
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border mt-2">
                        <Image
                        src={imageUrl || 'https://picsum.photos/600/400'}
                        alt="Vista previa de la propiedad"
                        fill
                        className="object-cover"
                        data-ai-hint="apartment building"
                        />
                        {isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                        )}
                    </div>
                    <div className="mt-2">
                        <Label htmlFor={`image-upload-${property.id}`} className={cn(
                            buttonVariants({ variant: 'outline' }),
                            "cursor-pointer w-full md:w-auto",
                            isUploading && "cursor-not-allowed opacity-50"
                        )}>
                            <Upload className="mr-2 h-4 w-4" />
                            {isUploading ? 'Subiendo...' : 'Cambiar Imagen'}
                        </Label>
                        <Input 
                            id={`image-upload-${property.id}`}
                            type="file" 
                            className="hidden" 
                            onChange={handleFileChange}
                            accept="image/png, image/jpeg, image/webp"
                            disabled={isUploading}
                        />
                    </div>
                    <Label htmlFor={`imageUrl-${property.id}`} className="mt-4 block text-xs text-muted-foreground">URL de la imagen (auto-generado)</Label>
                    <Input 
                        id={`imageUrl-${property.id}`}
                        name="imageUrl" 
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        readOnly 
                        className="bg-muted/50 mt-1"
                    />
                </div>

                <div className="col-span-1 md:col-span-2">
                    <Label htmlFor={`notes-${property.id}`}>Notas</Label>
                    <Textarea id={`notes-${property.id}`} name="notes" defaultValue={property.notes} />
                </div>
                
                <div className="col-span-1 md:col-span-2">
                    <Label htmlFor={`contractTemplate-${property.id}`}>Plantilla de Contrato</Label>
                    <Textarea id={`contractTemplate-${property.id}`} name="contractTemplate" defaultValue={property.contractTemplate} className="h-40" />
                    <p className="text-xs text-muted-foreground mt-2">
                        Usa los siguientes marcadores para insertar datos dinámicos en el contrato. Se reemplazarán automáticamente al generarlo.
                        <br />
                        <strong>Inquilino:</strong> <code>&#123;&#123;inquilino.nombre&#125;&#125;</code>, <code>&#123;&#123;inquilino.dni&#125;&#125;</code>, <code>&#123;&#123;inquilino.direccion&#125;&#125;</code>.
                        <br />
                        <strong>Propiedad:</strong> <code>&#123;&#123;propiedad.nombre&#125;&#125;</code>, <code>&#123;&#123;propiedad.direccion&#125;&#125;</code>.
                        <br />
                        <strong>Fechas:</strong> <code>&#123;&#123;fechaCheckIn&#125;&#125;</code>, <code>&#123;&#123;fechaCheckOut&#125;&#125;</code>, <code>&#123;&#123;fechaActual&#125;&#125;</code>.
                        <br />
                        <strong>Montos:</strong> <code>&#123;&#123;monto&#125;&#125;</code>, <code>&#123;&#123;montoEnLetras&#125;&#125;</code>, <code>&#123;&#123;montoGarantia&#125;&#125;</code>, <code>&#123;&#123;montoGarantiaEnLetras&#125;&#125;</code>, <code>&#123;&#123;monedaGarantia&#125;&#125;</code>.
                    </p>
                </div>
                
                {isPersonalFlavor && (
                    <div className="col-span-1 md:col-span-2 border-t pt-4 mt-2">
                        <h4 className="text-md font-medium mb-4 text-center">Campos Personalizados (Para Contratos y Emails)</h4>
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
                )}

                {isPersonalFlavor && (
                    <div className="col-span-1 md:col-span-2 border-t pt-4 mt-2">
                        <h4 className="text-md font-medium mb-4 text-center">Tarifas de Visita por Colaborador</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                            {visitRateProviders.length > 0 ? visitRateProviders.map(p => (
                                <div key={p.id} className='space-y-1'>
                                    <Label htmlFor={`visitRate_${p.id}`} className="text-sm">{p.name}</Label>
                                    <Input id={`visitRate_${p.id}`} name={`visitRate_${p.id}`} type="number" step="0.01" placeholder={`Tarifa para ${p.name}`} defaultValue={property.visitRates?.[p.id] || ''} />
                                </div>
                            )) : <p className="text-sm text-muted-foreground text-center col-span-2">No hay colaboradores con facturación por visita.</p>}
                        </div>
                    </div>
                )}
            </div>
            <div className="flex justify-between items-center">
                <PropertyDeleteForm propertyId={property.id} propertyName={property.name} />
                <SubmitButton />
            </div>
             {state.message && !state.success && (
                <p className="text-red-500 text-sm mt-2">{state.message}</p>
            )}
        </form>
    </div>
  );
}

    