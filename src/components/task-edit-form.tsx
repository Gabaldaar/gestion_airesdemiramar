
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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateTask } from '@/lib/actions';
import { Property, TaskCategory, TaskPriority, TaskStatus, TaskWithDetails, Task } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DatePicker } from './ui/date-picker';
import { parseDateSafely } from '@/lib/utils';
import { useToast } from './ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


const initialState: { message: string; success: boolean } = {
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

export function TaskEditForm({
    task,
    properties,
    categories,
    isOpen,
    onOpenChange,
    onTaskUpdated,
    onTaskCompletedWithExpense,
}: {
    task: TaskWithDetails;
    properties: Property[];
    categories: TaskCategory[];
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onTaskUpdated: () => void;
    onTaskCompletedWithExpense: (task: Task) => void;
}) {
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  
  const [dueDate, setDueDate] = useState<Date | undefined>(parseDateSafely(task.dueDate));
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [actualCost, setActualCost] = useState<string>(task.actualCost?.toString() || '');
  const [costCurrency, setCostCurrency] = useState<'ARS' | 'USD'>(task.costCurrency || 'ARS');
  const [showConfirmExpenseDialog, setShowConfirmExpenseDialog] = useState(false);
  const [formDataForExpense, setFormDataForExpense] = useState<FormData | null>(null);

  const formAction = (formData: FormData) => {
    // Check if status is changing to 'completed' and there's a cost
    const newStatus = formData.get('status') as TaskStatus;
    const cost = parseFloat(formData.get('actualCost') as string);
    
    if (task.status !== 'completed' && newStatus === 'completed' && cost > 0) {
        setFormDataForExpense(formData);
        setShowConfirmExpenseDialog(true);
    } else {
        // Proceed with normal update
        submitUpdate(formData);
    }
  };

  const submitUpdate = (formData: FormData) => {
    startTransition(async () => {
        const result = await updateTask(initialState, formData);
        setState(result);
    });
  }

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
      onTaskUpdated();
      toast({ title: "Éxito", description: state.message });
    } else if (state.message) {
      toast({ title: "Error", description: state.message, variant: "destructive" });
    }
  }, [state, onOpenChange, onTaskUpdated, toast]);

  const handleConfirmExpense = () => {
    if (formDataForExpense) {
        startTransition(async () => {
            const result = await updateTask(initialState, formDataForExpense);
            if (result.success) {
                // Manually construct task object as server action doesn't return it
                const updatedTask: Task = {
                    ...task,
                    status: 'completed',
                    actualCost: parseFloat(formDataForExpense.get('actualCost') as string),
                    costCurrency: (formDataForExpense.get('costCurrency') as 'ARS' | 'USD') || 'ARS',
                };
                onTaskCompletedWithExpense(updatedTask);
            }
            setState(result);
        });
    }
    setShowConfirmExpenseDialog(false);
    setFormDataForExpense(null);
  };
  
  const handleDeclineExpense = () => {
    if (formDataForExpense) {
        submitUpdate(formDataForExpense);
    }
    setShowConfirmExpenseDialog(false);
    setFormDataForExpense(null);
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar Tarea</DialogTitle>
          <DialogDescription>
            Actualiza los datos de la tarea para la propiedad <span className="font-semibold">{task.propertyName}</span>.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef}>
            <input type="hidden" name="id" value={task.id} />
            <input type="hidden" name="propertyId" value={task.propertyId} />
            <input type="hidden" name="dueDate" value={dueDate?.toISOString().split('T')[0] || ''} />
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Input id="description" name="description" defaultValue={task.description} required />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="status">Estado</Label>
                        <Select name="status" value={status} onValueChange={(v) => setStatus(v as TaskStatus)} required>
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
                        <Select name="priority" defaultValue={task.priority} required>
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
                        <Select name="categoryId" defaultValue={task.categoryId || 'none'}>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="estimatedCost">Costo Estimado</Label>
                        <Input id="estimatedCost" name="estimatedCost" type="number" step="0.01" defaultValue={task.estimatedCost} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="actualCost">Costo Real</Label>
                        <Input id="actualCost" name="actualCost" type="number" step="0.01" value={actualCost} onChange={(e) => setActualCost(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="costCurrency">Moneda Costos</Label>
                        <Select name="costCurrency" value={costCurrency} onValueChange={(v) => setCostCurrency(v as 'ARS' | 'USD')}>
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
                    <Textarea id="notes" name="notes" defaultValue={task.notes}/>
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

    <AlertDialog open={showConfirmExpenseDialog} onOpenChange={setShowConfirmExpenseDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Registrar Gasto</AlertDialogTitle>
                <AlertDialogDescription>
                    La tarea se marcó como "Cumplida" con un costo real de {costCurrency} {actualCost}. ¿Deseas registrar un gasto de propiedad por este monto?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <Button variant="outline" onClick={handleDeclineExpense}>No, solo guardar la tarea</Button>
                <Button onClick={handleConfirmExpense}>Sí, registrar gasto</Button>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
