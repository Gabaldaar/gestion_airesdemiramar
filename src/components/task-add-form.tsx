

'use client';

import { useEffect, useRef, useState, useTransition, useCallback } from 'react';
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
import { addTask } from '@/lib/actions';
import { Property, Provider, TaskCategory, TaskScope } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from './ui/select';
import { DatePicker } from './ui/date-picker';
import { useToast } from './ui/use-toast';

const initialState = {
  message: '',
  success: false,
};

const isPersonalFlavor = process.env.NEXT_PUBLIC_APP_FLAVOR !== 'commercial';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Añadiendo...
                </>
            ) : (
                'Añadir Tarea'
            )}
        </Button>
    )
}

export function TaskAddForm({
    propertyId,
    properties,
    providers,
    categories,
    scopes,
    children,
    isOpen,
    onOpenChange,
    onTaskAdded
}: {
    propertyId?: string,
    properties?: Property[],
    providers?: Provider[],
    categories: TaskCategory[],
    scopes: TaskScope[],
    children?: React.ReactNode,
    isOpen: boolean,
    onOpenChange: (isOpen: boolean) => void;
    onTaskAdded: () => void;
}) {
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const { toast } = useToast();

  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await addTask(initialState, formData);
        setState(result);
    });
  };

  const resetForm = useCallback(() => {
    formRef.current?.reset();
    setDueDate(undefined);
    setState(initialState);
  }, []);

  useEffect(() => {
    if (isOpen) {
        resetForm();
    }
  }, [isOpen, resetForm]);

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? 'Éxito' : 'Error',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
    }
    if (state.success) {
      onTaskAdded();
      onOpenChange(false);
    }
  }, [state, onTaskAdded, onOpenChange, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Añadir Nueva Tarea</DialogTitle>
          <DialogDescription>
            Completa los datos de la tarea de mantenimiento o mejora.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef}>
            <input type="hidden" name="dueDate" value={dueDate?.toISOString().split('T')[0] || ''} />
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="assignment">Asignar a</Label>
                    <Select name="assignment" defaultValue={propertyId ? `property-${propertyId}` : undefined} required>
                        <SelectTrigger><SelectValue placeholder={isPersonalFlavor ? "Selecciona Propiedad o Ámbito..." : "Selecciona una Propiedad..."}/></SelectTrigger>
                        <SelectContent>
                           {properties && (
                             <SelectGroup>
                                <Label>Propiedades</Label>
                                {properties.map(p => <SelectItem key={p.id} value={`property-${p.id}`}>{p.name}</SelectItem>)}
                            </SelectGroup>
                           )}
                           {isPersonalFlavor && scopes && scopes.length > 0 && (
                                <SelectGroup>
                                    <Label>Ámbitos</Label>
                                    {scopes.map(s => <SelectItem key={s.id} value={`scope-${s.id}`}>{s.name}</SelectItem>)}
                               </SelectGroup>
                           )}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Input id="description" name="description" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="providerId">Proveedor Asignado</Label>
                    <Select name="providerId">
                        <SelectTrigger><SelectValue placeholder="Selecciona un proveedor" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Sin Asignar</SelectItem>
                            {providers?.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="status">Estado</Label>
                        <Select name="status" defaultValue="pending" required>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Pendiente</SelectItem>
                                <SelectItem value="in_progress">En Curso</SelectItem>
                                <SelectItem value="completed">Cumplida</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="priority">Prioridad</Label>
                        <Select name="priority" defaultValue="medium" required>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="high">Alta</SelectItem>
                                <SelectItem value="medium">Media</SelectItem>
                                <SelectItem value="low">Baja</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="categoryId">Categoría</Label>
                        <Select name="categoryId">
                            <SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Sin Categoría</SelectItem>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dueDate">Fecha Límite</Label>
                        <DatePicker date={dueDate} onDateSelect={setDueDate} placeholder="Fecha límite" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="estimatedCost">Costo Estimado</Label>
                        <Input id="estimatedCost" name="estimatedCost" type="number" step="0.01" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="costCurrency">Moneda</Label>
                        <Select name="costCurrency" defaultValue="ARS">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ARS">ARS</SelectItem>
                                <SelectItem value="USD">USD</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="notes">Notas Adicionales</Label>
                    <Textarea id="notes" name="notes" />
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
