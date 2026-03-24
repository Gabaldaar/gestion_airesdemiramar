

'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskWithDetails, Property, TaskCategory, Task, TaskStatus, TaskPriority, Provider, TaskScope } from "@/lib/data";
import { format, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn, parseDateSafely } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Button } from "./ui/button";
import { NotesViewer } from './notes-viewer';
import { useState, useMemo, useTransition } from 'react';
import useWindowSize from "@/hooks/use-window-size";
import { TaskEditForm } from "./task-edit-form";
import { TaskDeleteForm } from "./task-delete-form";
import { ExpensePreloadData } from "./expense-add-form";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { updateTask } from '@/lib/actions';
import { useToast } from './ui/use-toast';
import { Loader2, Landmark, Wallet, Pencil, Trash2, FileText, AlertTriangle, ArrowUp, ArrowDown, ChevronsRight, Wrench } from 'lucide-react';


interface TasksListProps {
  tasks: TaskWithDetails[];
  properties: Property[];
  categories: TaskCategory[];
  providers: Provider[];
  scopes: TaskScope[];
  showProperty?: boolean;
  propertyId?: string;
  onDataChanged: () => void;
  onRegisterExpense: (data: ExpensePreloadData, propertyId: string) => void;
  selectedTaskIds?: string[];
  onSelectionChange?: (taskId: string, isSelected: boolean) => void;
  onSelectAll?: (isSelected: boolean) => void;
}

const statusMap: Record<TaskStatus, { text: string, className: string, Icon: React.ElementType }> = {
    pending: { text: 'Pendiente', className: 'bg-yellow-500 text-black', Icon: ChevronsRight },
    in_progress: { text: 'En Curso', className: 'bg-blue-500', Icon: Wallet },
    completed: { text: 'Cumplida', className: 'bg-green-600', Icon: Landmark },
};

const priorityMap: Record<TaskPriority, { text: string, className: string, Icon: React.ElementType }> = {
    low: { text: 'Baja', className: 'bg-gray-400', Icon: ArrowDown },
    medium: { text: 'Media', className: 'bg-blue-400', Icon: ChevronsRight },
    high: { text: 'Alta', className: 'bg-red-500', Icon: ArrowUp },
};


function StatusBadgeUpdater({ task, onTaskUpdated }: { task: TaskWithDetails, onTaskUpdated: () => void }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleStatusChange = (newStatus: TaskStatus) => {
        if (newStatus === task.status) return;

        startTransition(async () => {
            const formData = new FormData();
            formData.append('id', task.id);
            formData.append('status', newStatus);
            const result = await updateTask({success: false, message: ''}, formData);
            if (result.success) {
                toast({ title: "Estado Actualizado", description: `La tarea ahora está "${statusMap[newStatus].text}".` });
                onTaskUpdated();
            } else {
                toast({ title: "Error", description: result.message, variant: "destructive" });
            }
        });
    }

    const statusInfo = statusMap[task.status];
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={cn("h-auto p-0 text-left", isPending && "cursor-not-allowed")} disabled={isPending}>
                    <Badge className={cn("cursor-pointer", statusInfo.className)}>
                        {isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <statusInfo.Icon className="mr-1 h-3 w-3" />}
                        {statusInfo.text}
                    </Badge>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                {(Object.keys(statusMap) as TaskStatus[]).map(status => (
                    <DropdownMenuItem key={status} onSelect={() => handleStatusChange(status)} disabled={task.status === status}>
                        {statusMap[status].text}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function PriorityBadgeUpdater({ task, onTaskUpdated }: { task: TaskWithDetails, onTaskUpdated: () => void }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handlePriorityChange = (newPriority: TaskPriority) => {
        if (newPriority === task.priority) return;

        startTransition(async () => {
            const formData = new FormData();
            formData.append('id', task.id);
            formData.append('priority', newPriority);
            const result = await updateTask({success: false, message: ''}, formData);
            if (result.success) {
                toast({ title: "Prioridad Actualizada", description: `La tarea ahora tiene prioridad "${priorityMap[newPriority].text}".` });
                onTaskUpdated();
            } else {
                toast({ title: "Error", description: result.message, variant: "destructive" });
            }
        });
    }

    const priorityInfo = priorityMap[task.priority];
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                 <Button variant="ghost" className={cn("h-auto p-0 text-left", isPending && "cursor-not-allowed")} disabled={isPending}>
                    <Badge className={cn("cursor-pointer", priorityInfo.className)}>
                        {isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <priorityInfo.Icon className="mr-1 h-3 w-3" />}
                        {priorityInfo.text}
                    </Badge>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                {(Object.keys(priorityMap) as TaskPriority[]).map(priority => (
                    <DropdownMenuItem key={priority} onSelect={() => handlePriorityChange(priority)} disabled={task.priority === priority}>
                        {priorityMap[priority].text}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}


function TaskActions({ task, onEdit, onDelete, onRegisterExpense }: { 
    task: TaskWithDetails, 
    onEdit: (task: TaskWithDetails) => void, 
    onDelete: (task: TaskWithDetails) => void,
    onRegisterExpense: () => void 
}) {
    const [isNotesOpen, setIsNotesOpen] = useState(false);

    return (
        <div className="flex flex-wrap items-center justify-end gap-1">
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRegisterExpense}>
                            <Wallet className="h-4 w-4" />
                            <span className="sr-only">Registrar Gasto de Tarea</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Registrar Gasto</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>

             <NotesViewer 
                notes={task.notes} 
                title={`Notas sobre la tarea`} 
                isOpen={isNotesOpen} 
                onOpenChange={setIsNotesOpen}
            >
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsNotesOpen(true)} disabled={!task.notes}>
                                <FileText className="h-4 w-4" />
                                <span className="sr-only">Ver Notas</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Ver Notas</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </NotesViewer>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(task)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar Tarea</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Editar Tarea</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(task)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Eliminar Tarea</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Eliminar Tarea</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    )
}

function TaskRow({ task, showProperty = false, onEdit, onDelete, isSelected, onSelectionChange, onRegisterExpense, onDataChanged }: { 
    task: TaskWithDetails, 
    showProperty?: boolean, 
    onEdit: (task: TaskWithDetails) => void, 
    onDelete: (task: TaskWithDetails) => void, 
    isSelected?: boolean, 
    onSelectionChange?: (checked: boolean) => void;
    onRegisterExpense: () => void;
    onDataChanged: () => void;
}) {
  
    const formatDate = (date: string | undefined | null) => {
        if (!date) return 'N/A';
        const parsedDate = parseDateSafely(date);
        if (!parsedDate) return 'Fecha inv.';
        return format(parsedDate, "dd-LLL-yy", { locale: es });
    };

    const formatCurrency = (amount: number | undefined, currency: 'ARS' | 'USD' = 'ARS') => {
        if (typeof amount === 'undefined') return '-';
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency, minimumFractionDigits: 0 }).format(amount);
    }
  
    const dueDate = parseDateSafely(task.dueDate);
    const isOverdue = dueDate && task.status !== 'completed' && dueDate < startOfToday();

    return (
        <TableRow key={task.id} className={cn(task.status === 'completed' && 'bg-muted/50 text-muted-foreground', isSelected && 'bg-blue-500/10')}>
            {onSelectionChange && (
                <TableCell className="p-2">
                    <Checkbox
                        checked={!!isSelected}
                        onCheckedChange={onSelectionChange}
                        aria-label="Seleccionar tarea"
                    />
                </TableCell>
            )}
            {showProperty && <TableCell className="font-bold">{task.assignmentName}</TableCell>}
            <TableCell className="max-w-[250px] truncate cursor-default">
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <p className="truncate">{task.description}</p>
                        </TooltipTrigger>
                        <TooltipContent><p>{task.description}</p></TooltipContent>
                    </Tooltip>
                 </TooltipProvider>
            </TableCell>
            <TableCell>
                 <StatusBadgeUpdater task={task} onTaskUpdated={onDataChanged} />
            </TableCell>
            <TableCell className="hidden md:table-cell">
                 <PriorityBadgeUpdater task={task} onTaskUpdated={onDataChanged} />
            </TableCell>
            <TableCell className="hidden lg:table-cell">{task.categoryName || '-'}</TableCell>
            <TableCell className={cn("hidden md:table-cell", isOverdue && 'text-destructive font-bold')}>
                {formatDate(task.dueDate)}
                {isOverdue && <AlertTriangle className="inline ml-2 h-4 w-4" />}
            </TableCell>
            <TableCell className={cn("hidden lg:table-cell text-right", task.costCurrency === 'ARS' && "text-blue-600", task.costCurrency === 'USD' && "text-green-600")}>{formatCurrency(task.estimatedCost, task.costCurrency)}</TableCell>
            <TableCell className={cn("hidden lg:table-cell text-right", task.costCurrency === 'ARS' && "text-blue-600", task.costCurrency === 'USD' && "text-green-600")}>{formatCurrency(task.actualCost, task.costCurrency)}</TableCell>
            <TableCell className="text-right">
                <TaskActions task={task} onEdit={onEdit} onDelete={onDelete} onRegisterExpense={onRegisterExpense} />
            </TableCell>
        </TableRow>
    );
}

function TaskCard({ task, showProperty = false, onEdit, onDelete, isSelected, onSelectionChange, onRegisterExpense, onDataChanged }: { 
    task: TaskWithDetails, 
    showProperty?: boolean, 
    onEdit: (task: TaskWithDetails) => void, 
    onDelete: (task: TaskWithDetails) => void, 
    isSelected?: boolean, 
    onSelectionChange?: (checked: boolean) => void;
    onRegisterExpense: () => void;
    onDataChanged: () => void;
}) {
    const formatDate = (date: string | undefined | null) => {
        if (!date) return 'N/A';
        const parsedDate = parseDateSafely(date);
        if (!parsedDate) return 'Fecha inv.';
        return format(parsedDate, "dd-LLL-yy", { locale: es });
    };

    const formatCurrency = (amount: number | undefined, currency: 'ARS' | 'USD' = 'ARS') => {
        if (typeof amount === 'undefined') return '-';
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency, minimumFractionDigits: 0 }).format(amount);
    }

    const dueDate = parseDateSafely(task.dueDate);
    const isOverdue = dueDate && task.status !== 'completed' && dueDate < startOfToday();

    return (
        <Card className={cn(task.status === 'completed' && 'bg-muted/50 text-muted-foreground', isSelected && 'border-primary ring-2 ring-primary')}>
            <CardHeader className="p-4 flex flex-row justify-between items-start gap-2">
                 <div className="flex items-start gap-2 flex-1 min-w-0">
                    {onSelectionChange && (
                        <Checkbox
                            className="mt-1"
                            checked={!!isSelected}
                            onCheckedChange={onSelectionChange}
                            aria-label="Seleccionar tarea"
                        />
                    )}
                     <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{showProperty ? task.assignmentName : task.description}</CardTitle>
                        {showProperty && <CardDescription className="truncate">{task.description}</CardDescription>}
                    </div>
                </div>
                <div className="flex-shrink-0">
                    <PriorityBadgeUpdater task={task} onTaskUpdated={onDataChanged} />
                </div>
            </CardHeader>
            <CardContent className="p-4 grid gap-2 text-sm">
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Estado</span>
                    <StatusBadgeUpdater task={task} onTaskUpdated={onDataChanged} />
                </div>
                
                {task.categoryName && (
                    <div className="flex justify-between items-center gap-2">
                        <span className="text-muted-foreground">Categoría</span>
                        <span className="font-medium text-right truncate">{task.categoryName}</span>
                    </div>
                )}
                
                {task.providerName && (
                    <div className="flex justify-between items-center gap-2">
                        <span className="text-muted-foreground flex items-center gap-1 shrink-0"><Wrench className="h-3 w-3"/> Proveedor</span>
                        <span className="font-medium text-right truncate">{task.providerName}</span>
                    </div>
                )}

                <div className="flex justify-between items-center gap-2">
                    <span className="text-muted-foreground">Fecha Límite</span>
                    <span className={cn("font-medium text-right flex items-center justify-end", isOverdue && "text-destructive")}>
                        {isOverdue && <AlertTriangle className="inline mr-1 h-4 w-4" />}
                        {formatDate(task.dueDate)}
                    </span>
                </div>

                <div className="flex justify-between items-center gap-2">
                    <span className="text-muted-foreground">Costo Est.</span>
                    <span className={cn("font-medium text-right", task.costCurrency === 'ARS' ? "text-blue-600" : "text-green-600")}>{formatCurrency(task.estimatedCost, task.costCurrency)}</span>
                </div>

                <div className="flex justify-between items-center gap-2">
                    <span className="text-muted-foreground">Costo Real</span>
                    <span className={cn("font-medium text-right", task.costCurrency === 'ARS' ? "text-blue-600" : "text-green-600")}>{formatCurrency(task.actualCost, task.costCurrency)}</span>
                </div>
            </CardContent>
            <CardFooter className="p-2 justify-end">
                <TaskActions task={task} onEdit={onEdit} onDelete={onDelete} onRegisterExpense={onRegisterExpense} />
            </CardFooter>
        </Card>
    );
}

export default function TasksList({ tasks, properties, categories, providers, scopes, showProperty = false, propertyId, onDataChanged, onRegisterExpense, selectedTaskIds, onSelectionChange, onSelectAll }: TasksListProps) {
  const [editingTask, setEditingTask] = useState<TaskWithDetails | undefined>(undefined);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<TaskWithDetails | undefined>(undefined);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { width } = useWindowSize();
  const useCardView = width < 1280; 

  if (tasks.length === 0) {
    return <p className="text-sm text-center text-muted-foreground py-8">No hay tareas para mostrar.</p>;
  }

  const handleEditClick = (task: TaskWithDetails) => {
    setEditingTask(task);
    setIsEditOpen(true);
  };

  const handleDeleteClick = (task: TaskWithDetails) => {
    setDeletingTask(task);
    setIsDeleteOpen(true);
  };
  
  const handleTaskCompletedWithExpense = (task: Task) => {
    if (task.estimatedCost && task.estimatedCost > 0) {
        onRegisterExpense({
            amount: task.estimatedCost,
            description: `Gasto de tarea: ${task.description}`,
            currency: task.costCurrency || 'ARS',
            taskId: task.id,
            providerId: task.providerId,
        }, task.assignment.id); // Assuming propertyId is in assignment.id for property tasks
    }
    onDataChanged();
  };

  const handleRegisterExpenseClick = (task: TaskWithDetails) => {
    if (task.assignment.type !== 'property') {
        alert("Solo se pueden registrar gastos para tareas asignadas a una propiedad."); // Replace with a better notification
        return;
    }
    onRegisterExpense({
        amount: task.estimatedCost || 0,
        description: `Gasto por tarea: ${task.description}`,
        currency: task.costCurrency || 'ARS',
        taskId: task.id,
        providerId: task.providerId,
        propertyName: task.assignmentName,
        providerName: task.providerName,
        amountPaidSoFar: task.actualCost,
    }, task.assignment.id);
  };


  const TableView = () => (
    <Table>
        <TableHeader>
            <TableRow>
                {onSelectAll && selectedTaskIds && (
                    <TableHead className="p-2 w-[40px]">
                         <Checkbox
                            checked={tasks.length > 0 && selectedTaskIds.length === tasks.length}
                            onCheckedChange={(checked) => onSelectAll(!!checked)}
                            aria-label="Seleccionar todo"
                        />
                    </TableHead>
                )}
                {showProperty && <TableHead>Asignación</TableHead>}
                <TableHead>Descripción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden md:table-cell">Prioridad</TableHead>
                <TableHead className="hidden lg:table-cell">Categoría</TableHead>
                <TableHead className="hidden md:table-cell">Fecha Límite</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Costo Est.</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Costo Real</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {tasks.map((task) => (
                <TaskRow 
                    key={task.id}
                    task={task} 
                    showProperty={showProperty} 
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                    onRegisterExpense={() => handleRegisterExpenseClick(task)}
                    isSelected={selectedTaskIds?.includes(task.id)}
                    onSelectionChange={onSelectionChange ? (checked) => onSelectionChange(task.id, checked) : undefined}
                    onDataChanged={onDataChanged}
                />
            ))}
        </TableBody>
    </Table>
  );

  const CardView = () => (
    <div className="space-y-4">
        {onSelectAll && selectedTaskIds && (
            <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/50">
                <Checkbox
                    id="select-all-cards"
                    checked={tasks.length > 0 && selectedTaskIds.length === tasks.length}
                    onCheckedChange={(checked) => onSelectAll(!!checked)}
                    aria-label="Seleccionar todas las tareas"
                />
                <Label htmlFor="select-all-cards" className="font-medium">
                    Seleccionar Todas ({selectedTaskIds.length} / {tasks.length})
                </Label>
            </div>
        )}
        {tasks.map((task) => (
            <TaskCard 
                key={task.id}
                task={task} 
                showProperty={showProperty} 
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onRegisterExpense={() => handleRegisterExpenseClick(task)}
                isSelected={selectedTaskIds?.includes(task.id)}
                onSelectionChange={onSelectionChange ? (checked) => onSelectionChange(task.id, checked) : undefined}
                onDataChanged={onDataChanged}
            />
        ))}
    </div>
);

  return (
    <div>
        {useCardView ? <CardView /> : <TableView />}

        {editingTask && (
            <TaskEditForm
                task={editingTask}
                properties={properties}
                categories={categories}
                providers={providers}
                scopes={scopes}
                isOpen={isEditOpen}
                onOpenChange={setIsEditOpen}
                onTaskUpdated={onDataChanged}
                onTaskCompletedWithExpense={handleTaskCompletedWithExpense}
            />
        )}
        {deletingTask && (
            <TaskDeleteForm
                task={deletingTask}
                isOpen={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                onTaskDeleted={onDataChanged}
            />
        )}
    </div>
  );
}
