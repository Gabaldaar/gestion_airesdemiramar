'use client';

import { useTransition, useState, useEffect, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
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

function MainSubmitButton() {
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

function UnsavedChangesBar({ isDirty, onDiscard, formId }: { isDirty: boolean; onDiscard: () => void; formId: string; }) {
    const { pending } = useFormStatus();

    if (!isDirty || pending) {
        return null;
    }

    return (
        <div className="fixed bottom-6 inset-x-0 z-50 mx-auto w-fit">
            <Card className="bg-primary/95 text-primary-foreground backdrop-blur-sm animate-in fade-in-50 slide-in-from-bottom-10 duration-300">
                <CardContent className="p-3 flex items-center justify-between gap-4">
                     <p className="text-sm font-semibold">Tienes cambios sin guardar.</p>
                     <div className="flex items-center gap-2">
                         <Button variant="ghost" onClick={onDiscard} className="hover:bg-primary/80">Descartar</Button>
                         <Button variant="secondary" form={formId} type="submit">Guardar</Button>
                     </div>
                </CardContent>
            </Card>
        </div>
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
  const [signatureUrl, setSignatureUrl] = useState(property.contractSignatureUrl || '');
  const [isSignatureUploading, setIsSignatureUploading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const formId = `property-edit-form-${property.id}`;

  const handleMakeDirty = () => {
    if (!isDirty) {
        setIsDirty(true);
    }
  };

  const handleDiscard = () => {
      window.location.reload();
  };

  const visitRateProviders = useMemo(() => {
    return providers.filter(p => p.billingType === 'per_visit' || p.billingType === 'hourly_or_visit');
  }, [providers]);

  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await updateProperty(initialState, formData);
        setState(result);
         if (result.success) {
            setIsDirty(false);
        }
    });
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) { // 1MB limit
      toast({
        title: "Archivo demasiado grande",
        description: "La imagen no debe superar 1MB.",
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
      setImageUrl(downloadURL);
      handleMakeDirty();
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
  
  const handleSignatureFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) { // 1MB limit
      toast({
        title: "Archivo demasiado grande",
        description: "La imagen de la firma no debe superar 1MB.",
        variant: "destructive",
      });
      return;
    }
    
    if (file.type !== 'image/png') {
        toast({
            title: "Formato incorrecto",
            description: "Por favor, sube un archivo .png con fondo transparente.",
            variant: "destructive",
        });
        return;
    }

    setIsSignatureUploading(true);

    const filePath = `property_signatures/${property.id}/signature.png`;
    const storageRef = ref(storage, filePath);

    try {
      const uploadTask = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadTask.ref);
      setSignatureUrl(downloadURL);
      handleMakeDirty();
      toast({
        title: "¡Éxito!",
        description: "La imagen de la firma se ha subido. Guarda los cambios para que sea permanente.",
      });
    } catch (error: any) {
      console.error("Signature upload failed:", error);
      toast({
        title: "Error al subir la firma",
        description: error.message || "No se pudo completar la subida.",
        variant: "destructive",
      });
    } finally {
      setIsSignatureUploading(false);
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
    <div className="py-4 relative">
        <UnsavedChangesBar isDirty={isDirty} onDiscard={handleDiscard} formId={formId} />
        <form id={formId} action={formAction} className="space-y-4">
            <input type="hidden" name="id" value={property.id} />
             <h4 className="text-lg font-semibold text-primary">{property.name}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="col-span-1 md:col-span-2 lg:col-span-1 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor={`name-${property.id}`}>Nombre</Label>
                        <Input id={`name-${property.id}`} type="text" name="name" defaultValue={property.name} onChange={handleMakeDirty} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`address-${property.id}`}>Dirección</Label>
                        <Input id={`address-${property.id}`} type="text" name="address" defaultValue={property.address} onChange={handleMakeDirty} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`propertyUrl-${property.id}`}>Web de la Propiedad</Label>
                        <Input id={`propertyUrl-${property.id}`} type="text" name="propertyUrl" defaultValue={property.propertyUrl} placeholder="Ej: https://airbnb.com/h/mi-depto" onChange={handleMakeDirty}/>
                    </div>
                    {isPersonalFlavor && (
                        <div className="space-y-2">
                            <Label htmlFor={`priceSheetName-${property.id}`}>Nombre en Hoja de Precios</Label>
                            <Input id={`priceSheetName-${property.id}`} type="text" name="priceSheetName" defaultValue={property.priceSheetName} placeholder="Nombre exacto en la App Script" onChange={handleMakeDirty}/>
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
                         <p className="text-xs text-muted-foreground mt-2">Imágenes de hasta 1MB en formato .jpg o .png.</p>
                    </div>
                    <input type="hidden" name="imageUrl" value={imageUrl} />
                </div>

                <div className="col-span-1 md:col-span-2">
                    <Label htmlFor={`notes-${property.id}`}>Notas</Label>
                    <Textarea id={`notes-${property.id}`} name="notes" defaultValue={property.notes} onChange={handleMakeDirty} />
                </div>
                
                <div className="col-span-1 md:col-span-2">
                    <Label htmlFor={`contractTemplate-${property.id}`}>Plantilla de Contrato</Label>
                    <Textarea id={`contractTemplate-${property.id}`} name="contractTemplate" defaultValue={property.contractTemplate} className="h-40" onChange={handleMakeDirty} />
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
                
                <div className="col-span-1 md:col-span-2 border-t pt-4">
                    <Label>Firma para Contratos</Label>
                    <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
                        <div className="relative w-48 h-24 border rounded-lg bg-muted/50 flex items-center justify-center">
                            {signatureUrl ? (
                                <Image
                                    src={signatureUrl}
                                    alt="Vista previa de la firma"
                                    fill
                                    className="object-contain p-2"
                                />
                            ) : (
                                <span className="text-xs text-muted-foreground">Sin firma</span>
                            )}
                            {isSignatureUploading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                                </div>
                            )}
                        </div>
                        <div>
                            <Label htmlFor={`signature-upload-${property.id}`} className={cn(
                                buttonVariants({ variant: 'outline' }),
                                "cursor-pointer",
                                isSignatureUploading && "cursor-not-allowed opacity-50"
                            )}>
                                <Upload className="mr-2 h-4 w-4" />
                                {isSignatureUploading ? 'Subiendo...' : 'Cambiar Firma'}
                            </Label>
                            <Input 
                                id={`signature-upload-${property.id}`}
                                type="file" 
                                className="hidden" 
                                onChange={handleSignatureFileChange}
                                accept="image/png"
                                disabled={isSignatureUploading}
                            />
                            <p className="text-xs text-muted-foreground mt-2">Sube un archivo .png con fondo transparente (máx. 1MB).</p>
                        </div>
                    </div>
                    <input type="hidden" name="contractSignatureUrl" value={signatureUrl} />
                </div>

                {isPersonalFlavor && (
                    <div className="col-span-1 md:col-span-2 border-t pt-4 mt-2">
                        <h4 className="text-md font-medium mb-4 text-center">Campos Personalizados (Para Contratos y Emails)</h4>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div className='space-y-1'>
                                    <Label htmlFor={`customField${i}Label-${property.id}`} className="text-sm">Etiqueta Campo {i}</Label>
                                    <Input id={`customField${i}Label-${property.id}`} name={`customField${i}Label`} defaultValue={property[`customField${i}Label` as keyof Property] as string} placeholder={`Ej: WiFi Pass`} onChange={handleMakeDirty} />
                                </div>
                                <div className='space-y-1'>
                                    <Label htmlFor={`customField${i}Value-${property.id}`} className="text-sm">Valor Campo {i}</Label>
                                    <Input id={`customField${i}Value-${property.id}`} name={`customField${i}Value`} defaultValue={property[`customField${i}Value` as keyof Property] as string} placeholder="Valor" onChange={handleMakeDirty} />
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
                                    <Input id={`visitRate_${p.id}`} name={`visitRate_${p.id}`} type="number" step="0.01" placeholder={`Tarifa para ${p.name}`} defaultValue={property.visitRates?.[p.id] || ''} onChange={handleMakeDirty} />
                                </div>
                            )) : <p className="text-sm text-muted-foreground text-center col-span-2">No hay colaboradores con facturación por visita.</p>}
                        </div>
                    </div>
                )}
            </div>
            <div className="flex justify-between items-center pt-4 border-t">
                <PropertyDeleteForm propertyId={property.id} propertyName={property.name} />
                {isDirty && <MainSubmitButton />}
            </div>
             {state.message && !state.success && (
                <p className="text-red-500 text-sm mt-2">{state.message}</p>
            )}
        </form>
    </div>
  );
}
