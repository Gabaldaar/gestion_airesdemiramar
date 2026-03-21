
'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
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
import { addProvider } from '@/lib/actions';
import { PlusCircle, Loader2, Star } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ProviderCategory } from '@/lib/data';
import { countries } from '@/lib/countries';
import { cn } from '@/lib/utils';
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
                'Guardar Proveedor'
            )}
        </Button>
    )
}

export function ProviderAddForm({ categories, onProviderAdded }: { categories: ProviderCategory[], onProviderAdded: () => void }) {
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await addProvider(initialState, formData);
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
      setIsOpen(false);
      setRating(0);
      formRef.current?.reset();
      onProviderAdded();
    }
  }, [state, onProviderAdded, toast]);
  
  const getStarColorClass = (currentRating: number) => {
    if (currentRating === 1) return "text-red-500 fill-red-500";
    if (currentRating === 2) return "text-orange-400 fill-orange-400";
    return "text-yellow-400 fill-yellow-400";
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Proveedor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Proveedor</DialogTitle>
          <DialogDescription>
            Completa los datos del nuevo proveedor de servicios.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef}>
            <input type="hidden" name="rating" value={rating} />
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                    Nombre
                    </Label>
                    <Input id="name" name="name" className="col-span-3" required />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="categoryId" className="text-right">
                        Categoría
                    </Label>
                    <Select name="categoryId">
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Ninguna</SelectItem>
                            {categories.map(category => (
                                <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
                    <div className="col-span-3 flex items-center gap-2">
                        <Select name="countryCode" defaultValue="+54">
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
                        <Input id="phone" name="phone" className="flex-grow" />
                    </div>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="address" className="text-right">
                    Dirección
                    </Label>
                    <Input id="address" name="address" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="rating" className="text-right">
                        Calificación
                    </Label>
                    <div className="col-span-3 flex items-center gap-1">
                        {[...Array(5)].map((_, index) => {
                            const ratingValue = index + 1;
                            return (
                            <Star
                                key={ratingValue}
                                className={cn(
                                "h-6 w-6 cursor-pointer",
                                ratingValue <= rating
                                    ? getStarColorClass(rating)
                                    : "text-gray-300"
                                )}
                                onClick={() => setRating(ratingValue === rating ? 0 : ratingValue)}
                            />
                            );
                        })}
                    </div>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="notes" className="text-right pt-2">
                        Notas
                    </Label>
                    <Textarea id="notes" name="notes" className="col-span-3" />
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
