
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
import { addTask } from '@/lib/actions';
import { Property, TaskCategory, TaskPriority, TaskStatus } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DatePicker } from './ui/date-picker';

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
    categories,
    children,
    isOpen,
    onOpenChange,
    onTaskAdded
}: {
    propertyId?: string,
    properties?: Property[],
    categories: TaskCategory[],
    children?: React.ReactNode,
    isOpen: boolean,
    onOpenChange: (isOpen: boolean) => void;
    onTaskAdded: () => void;
}) {
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [dueDate, setDueDate] = useState<Date | undefined>();

  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await addTask(initialState, formData);
        setState(result);
    });
  };

  const resetForm = () => {
    formRef.current?.reset();
    setDueDate(undefined);
    onOpenChange(false);
    setState(initialState);
  };

  useEffect(() => {
    if (state.success) {
      onTaskAdded();
      resetForm();
    }
  }, [state, onTaskAdded]); // eslint-disable-line react-hooks/exhaustive-deps

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
                {properties && (
                    <div className="space-y-2">
                        <Label htmlFor="propertyId">Propiedad</Label>
                        <Select name="propertyId" defaultValue={propertyId} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una propiedad" />
                            </SelectTrigger>
                            <SelectContent>
                                {properties.map(prop => (
                                    <SelectItem key={prop.id} value={prop.id}>
                                        {prop.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                {!properties && propertyId && <input type="hidden" name="propertyId" value={propertyId} />}
                
                <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Input id="description" name="description" required />
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
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
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
