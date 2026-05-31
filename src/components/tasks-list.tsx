'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskWithDetails, Property, TaskCategory, Task, TaskStatus, TaskPriority, Provider, TaskScope, TaskAssignment, ExpenseWithDetails } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "./ui/tooltip";
import { Button } from "./ui/button";
import { NotesViewer } from './notes-viewer';
import { useState } from 'react';
import { TaskEditForm } from "./task-edit-form";
import { TaskDeleteForm } from "./task-delete-form";
import { Checkbox } from "./ui/checkbox";
import { Wallet, Pencil, Trash2, FileText, Clock, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTranslation } from "@/i18n/useTranslation";
import { useAuth } from "./auth-provider";

export interface TasksListProps {
  tasks: TaskWithDetails[];
  properties: Property[];
  categories: TaskCategory[];
  providers: Provider[];
  scopes: TaskScope[];
  allExpenses: ExpenseWithDetails[];
  showProperty?: boolean;
  onDataChanged: () => void;
  onRegisterExpense: (data: any, assignment: TaskAssignment) => void;
  selectedTaskIds?: string[];
  onSelectionChange?: (taskId: string, isSelected: boolean) => void;
  onSelectAll?: (isSelected: boolean) => void;
  propertyId?: string;
}

export default function TasksList({ 
  tasks, 
  categories, 
  properties, 
  providers, 
  scopes, 
  allExpenses, 
  showProperty = false, 
  onDataChanged, 
  onRegisterExpense, 
  selectedTaskIds = [], 
  onSelectionChange, 
  onSelectAll,
  propertyId
}: TasksListProps) {
  const { appUser } = useAuth();
  const { t } = useTranslation();
  const isPersonalFlavor = appUser?.appFlavor !== 'commercial';

  const [editingTask, setEditingTask] = useState<TaskWithDetails | null>(null);
  const [deletingTask, setDeletingTask] = useState<TaskWithDetails | null>(null);
  const [notesTask, setNotesTask] = useState<TaskWithDetails | null>(null);

  const formatCurrency = (amount: number | undefined, currency: string | null | undefined) => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency || 'ARS', maximumFractionDigits: 0 }).format(amount);
  };

  const getPriorityStyles = (priority: TaskPriority, status: TaskStatus) => {
      const isCompleted = status === 'completed';
      if (isCompleted) return { border: "border-zinc-300", header: "bg-zinc-100", title: "text-zinc-500", badge: "bg-zinc-500" };
      
      switch(priority) {
          case 'high': return { border: "border-red-500/40", header: "bg-red-500/10", title: "text-red-700", badge: "bg-red-600" };
          case 'medium': return { border: "border-orange-500/40", header: "bg-orange-500/10", title: "text-orange-700", badge: "bg-orange-500" };
          default: return { border: "border-blue-500/40", header: "bg-blue-500/10", title: "text-blue-700", badge: "bg-blue-600" };
      }
  }

  const renderActions = (task: TaskWithDetails) => (
    <div className="flex flex-wrap items-center justify-end gap-1">
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => onRegisterExpense({ 
                        taskId: task.id, 
                        amount: task.estimatedCost, 
                        currency: task.costCurrency,
                        description: task.description,
                        providerId: task.providerId,
                        amountPaidSoFar: task.actualCost
                    }, task.assignment)}>
                        <Wallet className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>{t('tasks.tooltips.register_expense')}</p></TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setNotesTask(task)} disabled={!task.notes}>
                        <FileText className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>{t('tasks.tooltips.notes')}</p></TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingTask(task)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>{t('tasks.tooltips.edit')}</p></TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingTask(task)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>{t('tasks.tooltips.delete')}</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>
    </div>
  );

  return (
    <div className="space-y-4">
        {onSelectAll && tasks.length > 0 && (
            <div className="flex items-center gap-3 px-3 py-2 bg-muted/30 rounded-lg border border-dashed w-fit">
                <Checkbox 
                    id="select-all-tasks"
                    checked={tasks.length > 0 && selectedTaskIds.length === tasks.length}
                    onCheckedChange={(checked) => onSelectAll(!!checked)}
                />
                <label htmlFor="select-all-tasks" className="text-[11px] uppercase font-black text-muted-foreground cursor-pointer flex flex-col sm:flex-row sm:gap-2">
                    <span>{t('common.all')}</span>
                    <span className="opacity-70 font-bold hidden sm:inline">—</span>
                    <span className="opacity-70 font-bold lowercase tracking-normal">{t('tasks.selection_legend')}</span>
                </label>
            </div>
        )}

        {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-3xl bg-muted/20">
                <ClipboardList className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-bold text-muted-foreground">{t('tasks.no_tasks')}</h3>
                <p className="text-sm text-muted-foreground/60 max-w-xs">{t('common.empty_states.tasks_desc')}</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tasks.map((task: TaskWithDetails) => {
                    const styles = getPriorityStyles(task.priority, task.status);
                    const isSelected = selectedTaskIds.includes(task.id);

                    return (
                        <Card key={task.id} className={cn(
                            "overflow-hidden border-2 shadow-sm flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
                            styles.border,
                            isSelected && "ring-2 ring-primary ring-offset-2"
                        )}>
                            <CardHeader className={cn("p-4 py-3 flex flex-row items-center gap-3 space-y-0", styles.header)}>
                                {onSelectionChange && (
                                    <Checkbox 
                                        checked={isSelected}
                                        onCheckedChange={(c) => onSelectionChange(task.id, !!c)}
                                        className="border-primary"
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <CardTitle className={cn("text-base truncate font-bold", styles.title)}>{task.description}</CardTitle>
                                    {showProperty && <CardDescription className="text-[10px] font-black uppercase text-primary/70 truncate">{task.assignmentName}</CardDescription>}
                                </div>
                                <Badge className={cn("text-[10px] h-5 uppercase font-bold shrink-0", styles.badge)}>
                                    {t(`tasks.status.${task.status}`)}
                                </Badge>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4 text-sm flex-grow">
                                <div className="flex justify-between items-center border-b pb-2">
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground text-[10px] uppercase font-black tracking-wider">{t('tasks.filters.priority')}</span>
                                        <span className={cn("font-black uppercase text-[11px]", styles.title)}>{t(`tasks.priority.${task.priority}`)}</span>
                                    </div>
                                    {task.dueDate && (
                                        <div className="text-right flex flex-col">
                                            <span className="text-muted-foreground text-[10px] uppercase font-black tracking-wider">{t('tasks.table.due_date')}</span>
                                            <span className="font-medium flex items-center justify-end gap-1">
                                                <Clock className="h-3 w-3" />
                                                {format(new Date(task.dueDate), "dd-LLL-yy", { locale: es })}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground text-[10px] uppercase font-black tracking-wider">{t('tasks.table.est_cost')}</p>
                                        <p className="font-bold text-primary">{formatCurrency(task.estimatedCost, task.costCurrency)}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-muted-foreground text-[10px] uppercase font-black tracking-wider">{t('tasks.table.real_cost')}</p>
                                        <p className="font-bold text-green-700">{formatCurrency(task.actualCost, task.costCurrency)}</p>
                                    </div>
                                </div>

                                <div className="pt-1 flex flex-wrap gap-2">
                                    {isPersonalFlavor && task.providerName && (
                                        <Badge variant="secondary" className="h-5 text-[10px] bg-zinc-200 text-zinc-700 font-bold uppercase">
                                            {task.providerName}
                                        </Badge>
                                    )}
                                    {task.categoryName && (
                                        <Badge variant="outline" className="h-5 text-[10px] font-medium border-primary/20">
                                            {task.categoryName}
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="p-2 px-4 justify-end border-t bg-muted/30">
                                {renderActions(task)}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        )}

        {editingTask && (
            <TaskEditForm 
                task={editingTask} 
                properties={properties} 
                categories={categories} 
                providers={providers} 
                scopes={scopes} 
                isOpen={!!editingTask} 
                onOpenChange={(open) => !open && setEditingTask(null)} 
                onTaskUpdated={onDataChanged} 
                onTaskCompletedWithExpense={(t: Task) => onRegisterExpense({ 
                    taskId: t.id, 
                    amount: t.estimatedCost, 
                    currency: t.costCurrency,
                    description: t.description,
                    providerId: t.providerId
                }, t.assignment)} 
            />
        )}

        {deletingTask && (
            <TaskDeleteForm 
                task={deletingTask} 
                isOpen={!!deletingTask} 
                onOpenChange={(open) => !open && setDeletingTask(null)} 
                onTaskDeleted={onDataChanged} 
            />
        )}

        {notesTask && (
            <NotesViewer 
                notes={notesTask.notes} 
                title={`${t('tasks.tooltips.notes')} - ${notesTask.description}`} 
                isOpen={!!notesTask} 
                onOpenChange={(open) => !open && setNotesTask(null)} 
            />
        )}
    </div>
  );
}
