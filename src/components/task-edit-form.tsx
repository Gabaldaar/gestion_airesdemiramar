

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
import { Property, TaskCategory, TaskPriority, TaskStatus, TaskWithDetails, Task, Provider, TaskScope } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from './ui/select';
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

const isPersonalFlavor = process.env.NEXT_PUBLIC_APP_FLAVOR !== 'commercial';

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
    providers,
    scopes,
    isOpen,
    onOpenChange,
    onTaskUpdated,
    onTaskCompletedWithExpense,
}: {
    task: TaskWithDetails;
    properties: Property[];
    categories: TaskCategory[];
    providers?: Provider[];
    scopes: TaskScope[];
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
  const [actualCost, setActualCost] = useState<string>('');
  const [costCurrency, setCostCurrency] = useState<'ARS' | 'USD'>(task.costCurrency || 'ARS');
  const [showConfirmExpenseDialog, setShowConfirmExpenseDialog] = useState(false);
  const [formDataForExpense, setFormDataForExpense] = useState<FormData | null>(null);

  const formAction = (formData: FormData) => {
    const newStatus = formData.get('status') as TaskStatus;
    const estimatedCost = parseFloat(formData.get('estimatedCost') as string);
    
    if (task.status !== 'completed' && newStatus === 'completed' && estimatedCost > 0) {
        setFormDataForExpense(formData);
        setShowConfirmExpenseDialog(true);
    } else {
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
        const taskDataForExpense = {
            ...task,
            estimatedCost: parseFloat(formDataForExpense.get('estimatedCost') as string) || 0,
            costCurrency: (formDataForExpense.get('costCurrency') as 'ARS' | 'USD') || 'ARS',
            providerId: formDataForExpense.get('providerId') as string,
        };
        onTaskCompletedWithExpense(taskDataForExpense);
        submitUpdate(formDataForExpense);
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

  useEffect(() => {
    if (isOpen) {
        setDueDate(parseDateSafely(task.dueDate));
        setStatus(task.status);
        setCostCurrency(task.costCurrency || 'ARS');
    }
  }, [isOpen, task]);

  const defaultAssignmentValue = task.assignment ? `${task.assignment.type}-${task.assignment.id}` : undefined;

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar Tarea</DialogTitle>
          <DialogDescription>
            Actualiza los datos de la tarea para la asignación <span className="font-semibold">{task.assignmentName}</span>.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef}>
            <input type="hidden" name="id" value={task.id} />
            <input type="hidden" name="dueDate" value={dueDate?.toISOString().split('T')[0] || ''} />
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="assignment">Asignar a</Label>
                    <Select name="assignment" defaultValue={defaultAssignmentValue} required>
                        <SelectTrigger><SelectValue placeholder={isPersonalFlavor ? "Selecciona Propiedad o Ámbito..." : "Selecciona una Propiedad..."}/></SelectTrigger>
                        <SelectContent>
                           <SelectGroup>
                                <Label>Propiedades</Label>
                                {properties.map(p => <SelectItem key={p.id} value={`property-${p.id}`}>{p.name}</SelectItem>)}
                            </SelectGroup>
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
                    <Input id="description" name="description" defaultValue={task.description} required />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="providerId">Proveedor Asignado</Label>
                    <Select name="providerId" defaultValue={task.providerId || 'none'}>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="estimatedCost">Costo Estimado</Label>
                        <Input id="estimatedCost" name="estimatedCost" type="number" step="0.01" defaultValue={task.estimatedCost} />
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
                    <Label>Costo Real (Calculado)</Label>
                    <Input value={task.actualCost?.toFixed(2) || '0.00'} readOnly disabled className="bg-muted/50" />
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
                    La tarea se marcó como "Cumplida" y tiene un costo estimado. ¿Deseas registrar un gasto de propiedad asociado a esta tarea?
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
