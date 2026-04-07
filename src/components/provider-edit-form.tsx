

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
import { updateProvider } from '@/lib/actions';
import { Provider, ProviderCategory, ProviderManagementType, UserRole, UserStatus } from '@/lib/data';
import { Loader2, Star } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { countries } from '@/lib/countries';
import { cn } from '@/lib/utils';
import { useToast } from './ui/use-toast';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

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

interface ProviderEditFormProps {
    provider: Provider;
    categories: ProviderCategory[];
    onProviderUpdated: () => void;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function ProviderEditForm({ provider, categories, onProviderUpdated, isOpen, onOpenChange }: ProviderEditFormProps) {
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(provider.rating || 0);
  const [managementType, setManagementType] = useState<ProviderManagementType>(provider.managementType || 'tasks');
  const { toast } = useToast();

  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await updateProvider(initialState, formData);
        setState(result);
    });
  };

  useEffect(() => {
    if (state.message) {
        toast({
            title: state.success ? "Éxito" : "Error",
            description: state.message,
            variant: state.success ? "default" : "destructive",
        })
    }
    if (state.success) {
      onOpenChange(false);
      onProviderUpdated();
    }
  }, [state, onProviderUpdated, onOpenChange, toast]);

  useEffect(() => {
    if (isOpen) {
      setRating(provider.rating || 0);
      setManagementType(provider.managementType || 'tasks');
    }
  }, [isOpen, provider]);

  const getStarColorClass = (currentRating: number) => {
    if (currentRating === 1) return "text-red-500 fill-red-500";
    if (currentRating === 2) return "text-orange-400 fill-orange-400";
    return "text-yellow-400 fill-yellow-400";
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
          <DialogHeader>
          <DialogTitle>Editar Colaborador</DialogTitle>
          <DialogDescription>
              Modifica los datos del colaborador.
          </DialogDescription>
          </DialogHeader>
          <form action={formAction}>
              <input type="hidden" name="id" value={provider.id} />
              <input type="hidden" name="rating" value={rating} />
              
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input id="name" name="name" defaultValue={provider.name} required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="email">Email (de Google)</Label>
                            <Input id="email" name="email" type="email" defaultValue={provider.email} required />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Estado</Label>
                            <RadioGroup name="status" defaultValue={provider.status || 'pending'} className="flex items-center gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="pending" id="r-edit-pending" />
                                    <Label htmlFor="r-edit-pending">Pendiente</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="active" id="r-edit-active" />
                                    <Label htmlFor="r-edit-active">Activo</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <div className="space-y-2">
                            <Label>Rol</Label>
                            <RadioGroup name="role" defaultValue={provider.role || 'provider'} className="flex items-center gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="provider" id="r-edit-provider" />
                                    <Label htmlFor="r-edit-provider">Colaborador</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="admin" id="r-edit-admin" />
                                    <Label htmlFor="r-edit-admin">Administrador</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>

                    <div className="border-t pt-4 mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="categoryId">Categoría</Label>
                            <Select name="categoryId" defaultValue={provider.categoryId || 'none'}>
                                <SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Ninguna</SelectItem>
                                    {categories.map(category => (
                                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <div className="flex items-center gap-2">
                                <Select name="countryCode" defaultValue={provider.countryCode || "+54"}>
                                    <SelectTrigger className="w-[120px]"><SelectValue placeholder="+54" /></SelectTrigger>
                                    <SelectContent>
                                        {countries.map(country => (
                                            <SelectItem key={country.code} value={country.dial_code}>{country.name} ({country.dial_code})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input id="phone" name="phone" defaultValue={provider.phone || ''} className="flex-grow" />
                            </div>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address">Dirección</Label>
                            <Input id="address" name="address" defaultValue={provider.address || ''} />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Método de Gestión</Label>
                        <RadioGroup name="managementType" value={managementType} onValueChange={(v) => setManagementType(v as ProviderManagementType)} className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="tasks" id="r-tasks-edit" />
                                <Label htmlFor="r-tasks-edit">Por Tareas</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="liquidations" id="r-liquidations-edit" />
                                <Label htmlFor="r-liquidations-edit">Por Liquidaciones</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {managementType === 'liquidations' && (
                        <div className="border-t pt-4 mt-2">
                            <h4 className="text-md font-medium mb-2 text-center">Facturación y Liquidación</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="billingType">Tipo de Cobro</Label>
                                    <Select name="billingType" defaultValue={provider.billingType || 'other'}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="hourly">Por Hora</SelectItem>
                                            <SelectItem value="per_visit">Por Visita</SelectItem>
                                            <SelectItem value="hourly_or_visit">Por Hora o Visita</SelectItem>
                                            <SelectItem value="other">Otro / No Aplicable</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rateCurrency">Moneda de Tarifa</Label>
                                    <Select name="rateCurrency" defaultValue={provider.rateCurrency || 'ARS'}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ARS">ARS</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="hourlyRate">Tarifa por Hora</Label>
                                    <Input id="hourlyRate" name="hourlyRate" type="number" step="0.01" defaultValue={provider.hourlyRate || ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="perVisitRate">Tarifa por Visita</Label>
                                    <Input id="perVisitRate" name="perVisitRate" type="number" step="0.01" defaultValue={provider.perVisitRate || ''} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Calificación</Label>
                         <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, index) => {
                                const ratingValue = index + 1;
                                return (
                                <Star
                                    key={ratingValue}
                                    className={cn(
                                    "h-6 w-6 cursor-pointer",
                                    ratingValue <= rating ? getStarColorClass(rating) : "text-gray-300"
                                    )}
                                    onClick={() => setRating(ratingValue === rating ? 0 : ratingValue)}
                                />
                                );
                            })}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas (Privadas)</Label>
                        <Textarea id="notes" name="notes" defaultValue={provider.notes || ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="adminNote">Nota para el Colaborador (Visible por él)</Label>
                        <Textarea id="adminNote" name="adminNote" defaultValue={provider.adminNote || ''} />
                    </div>
              </div>
              <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
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
