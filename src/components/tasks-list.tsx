

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
import { TaskAddForm } from "./task-add-form";
import { TaskEditForm } from "./task-edit-form";
import { TaskDeleteForm } from "./task-delete-form";
import { ExpensePreloadData } from "./expense-add-form";

interface TasksListProps {
  tasks: TaskWithDetails[];
  properties: Property[];
  categories: TaskCategory[];
  showProperty?: boolean;
  propertyId?: string;
  onDataChanged: () => void;
  onRegisterExpense: (data: ExpensePreloadData, propertyId: string) => void;
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

function TaskRow({ task, showProperty = false, onEdit, onDelete }: { task: TaskWithDetails, showProperty?: boolean, onEdit: (task: TaskWithDetails) => void, onDelete: (task: TaskWithDetails) => void }) {
  
    const statusInfo = statusMap[task.status];
    const priorityInfo = priorityMap[task.priority];

    const formatDate = (date: string | undefined | null) => {
        if (!date) return 'N/A';
        const parsedDate = parseDateSafely(date);
        if (!parsedDate) return 'Fecha inv.';
        return format(parsedDate, "dd-LLL-yy", { locale: es });
    };

    const formatCurrency = (amount: number | undefined) => {
        if (typeof amount === 'undefined') return '-';
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
    }
  
    const dueDate = parseDateSafely(task.dueDate);
    const isOverdue = dueDate && task.status !== 'completed' && dueDate < startOfToday();

    return (
        <TableRow key={task.id} className={cn(task.status === 'completed' && 'bg-muted/50 text-muted-foreground')}>
            {showProperty && <TableCell className="font-bold">{task.propertyName}</TableCell>}
            <TableCell className="max-w-[250px] truncate cursor-default">
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild><span className="truncate">{task.description}</span></TooltipTrigger>
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
            <TableCell className="hidden lg:table-cell text-right">{formatCurrency(task.estimatedCost)}</TableCell>
            <TableCell className="hidden lg:table-cell text-right">{formatCurrency(task.actualCost)}</TableCell>
            <TableCell className="text-right">
                <TaskActions task={task} onEdit={onEdit} onDelete={onDelete} />
            </TableCell>
        </TableRow>
    );
}


export default function TasksList({ tasks, properties, categories, showProperty = false, propertyId, onDataChanged, onRegisterExpense }: TasksListProps) {
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
            description: `Gasto de tarea: ${task.description}`
        }, task.propertyId);
    }
    onDataChanged();
  };


  const TableView = () => (
    <Table>
        <TableHeader>
            <TableRow>
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
                />
            ))}
        </TableBody>
    </Table>
  );

  return (
    <div>
        {useCardView ? <p>Card view not implemented yet</p> : <TableView />}

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
