

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
import { TaskWithDetails, Property, TaskCategory, Task, TaskStatus, TaskPriority } from "@/lib/data";
import { format, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn, parseDateSafely } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Button } from "./ui/button";
import { NotesViewer } from './notes-viewer';
import { Landmark, Wallet, Pencil, Trash2, FileText, Calculator, Mail, AlertTriangle, ArrowUp, ArrowDown, ChevronsRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import useWindowSize from '@/hooks/use-window-size';
import { TaskEditForm } from "./task-edit-form";
import { TaskDeleteForm } from "./task-delete-form";
import { ExpensePreloadData } from "./expense-add-form";
import { Checkbox } from "./ui/checkbox";

interface TasksListProps {
  tasks: TaskWithDetails[];
  properties: Property[];
  categories: TaskCategory[];
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


function TaskActions({ task, onEdit, onDelete }: { task: TaskWithDetails, onEdit: (task: TaskWithDetails) => void, onDelete: (task: TaskWithDetails) => void }) {
    const [isNotesOpen, setIsNotesOpen] = useState(false);

    return (
        <div className="flex flex-nowrap items-center justify-end gap-1">
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

function TaskRow({ task, showProperty = false, onEdit, onDelete, isSelected, onSelectionChange }: { task: TaskWithDetails, showProperty?: boolean, onEdit: (task: TaskWithDetails) => void, onDelete: (task: TaskWithDetails) => void, isSelected?: boolean, onSelectionChange?: (checked: boolean) => void; }) {
  
    const statusInfo = statusMap[task.status];
    const priorityInfo = priorityMap[task.priority];

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
            {showProperty && <TableCell className="font-bold">{task.propertyName}</TableCell>}
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
                <Badge className={statusInfo.className}>
                    <statusInfo.Icon className="mr-1 h-3 w-3" />
                    {statusInfo.text}
                </Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell">
                <Badge className={priorityInfo.className}>
                    <priorityInfo.Icon className="mr-1 h-3 w-3" />
                    {priorityInfo.text}
                </Badge>
            </TableCell>
            <TableCell className="hidden lg:table-cell">{task.categoryName || '-'}</TableCell>
            <TableCell className={cn("hidden md:table-cell", isOverdue && 'text-destructive font-bold')}>
                {formatDate(task.dueDate)}
                {isOverdue && <AlertTriangle className="inline ml-2 h-4 w-4" />}
            </TableCell>
            <TableCell className={cn("hidden lg:table-cell text-right", task.costCurrency === 'ARS' && "text-blue-600", task.costCurrency === 'USD' && "text-green-600")}>{formatCurrency(task.estimatedCost, task.costCurrency)}</TableCell>
            <TableCell className={cn("hidden lg:table-cell text-right", task.costCurrency === 'ARS' && "text-blue-600", task.costCurrency === 'USD' && "text-green-600")}>{formatCurrency(task.actualCost, task.costCurrency)}</TableCell>
            <TableCell className="text-right">
                <TaskActions task={task} onEdit={onEdit} onDelete={onDelete} />
            </TableCell>
        </TableRow>
    );
}

function TaskCard({ task, showProperty = false, onEdit, onDelete, isSelected, onSelectionChange }: { task: TaskWithDetails, showProperty?: boolean, onEdit: (task: TaskWithDetails) => void, onDelete: (task: TaskWithDetails) => void, isSelected?: boolean, onSelectionChange?: (checked: boolean) => void; }) {
    const statusInfo = statusMap[task.status];
    const priorityInfo = priorityMap[task.priority];

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
            <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-start gap-2">
                        {onSelectionChange && (
                            <Checkbox
                                className="mt-1"
                                checked={!!isSelected}
                                onCheckedChange={onSelectionChange}
                                aria-label="Seleccionar tarea"
                            />
                        )}
                         <div>
                            <CardTitle className="text-lg">{showProperty ? task.propertyName : task.description}</CardTitle>
                            {showProperty && <CardDescription>{task.description}</CardDescription>}
                        </div>
                    </div>
                    <Badge className={priorityInfo.className}>
                        <priorityInfo.Icon className="mr-1 h-3 w-3" />
                        {priorityInfo.text}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="flex justify-between items-center col-span-2">
                    <span className="text-muted-foreground">Estado</span>
                    <Badge className={statusInfo.className}>
                        <statusInfo.Icon className="mr-1 h-3 w-3" />
                        {statusInfo.text}
                    </Badge>
                </div>
                {task.categoryName && (
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Categoría</span>
                        <span className="font-medium text-right">{task.categoryName}</span>
                    </div>
                )}
                <div className={cn("flex justify-between items-center", !task.categoryName && "col-span-2")}>
                    <span className="text-muted-foreground">Fecha Límite</span>
                    <span className={cn("font-medium", isOverdue && "text-destructive flex items-center")}>
                        {isOverdue && <AlertTriangle className="inline mr-1 h-4 w-4" />}
                        {formatDate(task.dueDate)}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Costo Est.</span>
                    <span className={cn("font-medium", task.costCurrency === 'ARS' && "text-blue-600", task.costCurrency === 'USD' && "text-green-600")}>{formatCurrency(task.estimatedCost, task.costCurrency)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Costo Real</span>
                    <span className={cn("font-medium", task.costCurrency === 'ARS' && "text-blue-600", task.costCurrency === 'USD' && "text-green-600")}>{formatCurrency(task.actualCost, task.costCurrency)}</span>
                </div>
            </CardContent>
            <CardFooter className="p-2 justify-end">
                <TaskActions task={task} onEdit={onEdit} onDelete={onDelete} />
            </CardFooter>
        </Card>
    );
}

export default function TasksList({ tasks, properties, categories, showProperty = false, propertyId, onDataChanged, onRegisterExpense, selectedTaskIds, onSelectionChange, onSelectAll }: TasksListProps) {
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
    if (task.actualCost && task.actualCost > 0) {
        onRegisterExpense({
            amount: task.actualCost,
            description: `Gasto de tarea: ${task.description}`,
            currency: task.costCurrency || 'ARS'
        }, task.propertyId);
    }
    onDataChanged();
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
                {showProperty && <TableHead>Propiedad</TableHead>}
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
                    isSelected={selectedTaskIds?.includes(task.id)}
                    onSelectionChange={onSelectionChange ? (checked) => onSelectionChange(task.id, checked) : undefined}
                />
            ))}
        </TableBody>
    </Table>
  );

  const CardView = () => (
    <div className="space-y-4">
        {tasks.map((task) => (
            <TaskCard 
                key={task.id}
                task={task} 
                showProperty={showProperty} 
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                isSelected={selectedTaskIds?.includes(task.id)}
                onSelectionChange={onSelectionChange ? (checked) => onSelectionChange(task.id, checked) : undefined}
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
