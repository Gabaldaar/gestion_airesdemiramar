
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { TaskWithDetails, Property, Provider, TaskCategory, TaskStatus, TaskPriority, ExpenseCategory, TaskScope, TaskAssignment } from '@/lib/data';
import TasksList from '@/components/tasks-list';
import { ExpensePreloadData } from '@/components/expense-add-form';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from './ui/label';
import { ExpenseAddForm } from './expense-add-form';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

interface TasksClientProps {
  initialTasks: TaskWithDetails[];
  properties: Property[];
  providers: Provider[];
  categories: TaskCategory[];
  scopes: TaskScope[];
  expenseCategories: ExpenseCategory[];
  onDataChanged: () => void;
}

export default function TasksClient({ initialTasks, properties, providers, categories, scopes, expenseCategories, onDataChanged }: TasksClientProps) {
  const [tasks, setTasks] = useState<TaskWithDetails[]>(initialTasks);
  const [assignmentTypeFilter, setAssignmentTypeFilter] = useState<'all' | 'property' | 'scope' | 'unassigned'>('all');
  const [assignmentIdFilter, setAssignmentIdFilter] = useState<string>('all');
  const [providerIdFilter, setProviderIdFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [categoryIdFilter, setCategoryIdFilter] = useState<string>('all');
  const [costCurrencyFilter, setCostCurrencyFilter] = useState<'all' | 'ARS' | 'USD'>('all');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  
  const [isExpenseAddOpen, setIsExpenseAddOpen] = useState(false);
  const [expensePreloadData, setExpensePreloadData] = useState<ExpensePreloadData | undefined>(undefined);
  const [expenseAssignment, setExpenseAssignment] = useState<TaskAssignment | null>(null);


  const handleRegisterExpense = useCallback((data: ExpensePreloadData, assignment: TaskAssignment) => {
    setExpensePreloadData(data);
    setExpenseAssignment(assignment);
    setIsExpenseAddOpen(true);
  }, []);

  const filteredTasks = useMemo(() => {
    let currentTasks = tasks.filter(task => {
        
      // Assignment Type Filter
      if (assignmentTypeFilter !== 'all') {
        if (assignmentTypeFilter === 'unassigned') {
          if (task.assignment && task.assignment.id) return false;
        } else {
          if (task.assignment?.type !== assignmentTypeFilter) return false;
        }
      }

      // Assignment ID Filter (for property or scope)
      if (assignmentIdFilter !== 'all') {
        if (task.assignment?.id !== assignmentIdFilter) return false;
      }
      
      // Provider Filter
      if (providerIdFilter !== 'all') {
        if (providerIdFilter === 'none') {
            if (task.providerId) { // If it has any providerId, filter it out.
                return false;
            }
        } else {
            if (task.providerId !== providerIdFilter) { // If it's a specific provider, it must match.
                return false;
            }
        }
      }

      // Status Filter
      if (statusFilter !== 'all' && task.status !== statusFilter) {
          return false;
      }

      // Priority Filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      // Category Filter
      if (categoryIdFilter !== 'all') {
        if (categoryIdFilter === 'none' && task.categoryId) {
          return false;
        }
        if (categoryIdFilter !== 'none' && task.categoryId !== categoryIdFilter) {
          return false;
        }
      }

      // Currency Filter
      if (costCurrencyFilter !== 'all' && (task.costCurrency || 'ARS') !== costCurrencyFilter) {
        return false;
      }
      
      return true;
    });

    // Sort by status (pending, in_progress, then completed), then by priority
    return currentTasks.sort((a, b) => {
        const statusOrder: Record<TaskStatus, number> = { pending: 0, in_progress: 1, completed: 2 };
        const priorityOrder: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
        
        if (statusOrder[a.status] !== statusOrder[b.status]) {
            return statusOrder[a.status] - statusOrder[b.status];
        }
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  }, [tasks, assignmentTypeFilter, assignmentIdFilter, providerIdFilter, statusFilter, priorityFilter, categoryIdFilter, costCurrencyFilter]);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Reset selection when filters change
  useEffect(() => {
    setSelectedTaskIds([]);
  }, [assignmentTypeFilter, assignmentIdFilter, providerIdFilter, statusFilter, priorityFilter, categoryIdFilter, costCurrencyFilter]);

  const handleClearFilters = () => {
    setAssignmentTypeFilter('all');
    setAssignmentIdFilter('all');
    setProviderIdFilter('all');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryIdFilter('all');
    setCostCurrencyFilter('all');
    setSelectedTaskIds([]);
  };
  
  const handleSelectionChange = (taskId: string, isSelected: boolean) => {
    setSelectedTaskIds(prev =>
      isSelected ? [...prev, taskId] : prev.filter(id => id !== taskId)
    );
  };

  const handleSelectAll = (isSelected: boolean) => {
    setSelectedTaskIds(isSelected ? filteredTasks.map(t => t.id) : []);
  };

  const totalCostsSummary = useMemo(() => {
    const totals: { ARS: number; USD: number } = { ARS: 0, USD: 0 };
    selectedTaskIds.forEach(id => {
        const task = tasks.find(t => t.id === id);
        if (task && task.estimatedCost) {
            const currency = task.costCurrency || 'ARS';
            totals[currency] += task.estimatedCost;
        }
    });
    return totals;
  }, [selectedTaskIds, tasks]);

  const formatCurrency = (amount: number, currency: 'ARS' | 'USD') => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency }).format(amount);
  }

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-muted/50">
        <div className="flex flex-wrap items-end justify-center gap-4">
            <div className="grid gap-2 flex-1 min-w-[180px]">
                <Label>Tipo de Asignación</Label>
                <Select value={assignmentTypeFilter} onValueChange={(val) => {
                    setAssignmentTypeFilter(val as 'all' | 'property' | 'scope' | 'unassigned');
                    setAssignmentIdFilter('all'); // Reset specific filter when type changes
                }}>
                    <SelectTrigger>
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los Tipos</SelectItem>
                        <SelectItem value="property">Propiedad</SelectItem>
                        <SelectItem value="scope">Ámbito</SelectItem>
                        <SelectItem value="unassigned">Sin Asignar</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
            {(assignmentTypeFilter === 'property' || assignmentTypeFilter === 'scope') && (
                <div className="grid gap-2 flex-1 min-w-[180px]">
                    <Label>{assignmentTypeFilter === 'property' ? 'Propiedad Específica' : 'Ámbito Específico'}</Label>
                    <Select value={assignmentIdFilter} onValueChange={setAssignmentIdFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                {assignmentTypeFilter === 'property' ? 'Todas las Propiedades' : 'Todos los Ámbitos'}
                            </SelectItem>
                            {assignmentTypeFilter === 'property' && properties.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                            {assignmentTypeFilter === 'scope' && scopes.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
            
            <div className="grid gap-2 flex-1 min-w-[180px]">
                <Label>Proveedor</Label>
                <Select value={providerIdFilter} onValueChange={setProviderIdFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="none">Sin Asignar</SelectItem>
                        {providers.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2 flex-1 min-w-[180px]">
                <Label>Estado</Label>
                <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as TaskStatus | 'all')}>
                    <SelectTrigger>
                        <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="in_progress">En Curso</SelectItem>
                        <SelectItem value="completed">Cumplida</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2 flex-1 min-w-[180px]">
                <Label>Prioridad</Label>
                <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val as TaskPriority | 'all')}>
                    <SelectTrigger>
                        <SelectValue placeholder="Prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="low">Baja</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2 flex-1 min-w-[180px]">
                <Label>Categoría</Label>
                <Select value={categoryIdFilter} onValueChange={setCategoryIdFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="none">Sin Categoría</SelectItem>
                        {categories.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2 flex-1 min-w-[180px]">
                <Label>Moneda Costos</Label>
                <Select value={costCurrencyFilter} onValueChange={(v) => setCostCurrencyFilter(v as 'all' | 'ARS' | 'USD')}>
                    <SelectTrigger>
                        <SelectValue placeholder="Moneda"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="ARS">ARS</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button variant="outline" onClick={handleClearFilters}>Limpiar Filtros</Button>
        </div>
      </div>

       {selectedTaskIds.length > 0 && (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-md">
                        Resumen de {selectedTaskIds.length} Tarea(s) Seleccionada(s)
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row sm:items-center sm:gap-6">
                    {totalCostsSummary.ARS > 0 && (
                         <div>
                            <p className="text-sm text-muted-foreground">Costo Estimado (ARS)</p>
                            <p className="text-lg font-bold text-blue-600">{formatCurrency(totalCostsSummary.ARS, 'ARS')}</p>
                        </div>
                    )}
                     {totalCostsSummary.USD > 0 && (
                        <div>
                            <p className="text-sm text-muted-foreground">Costo Estimado (USD)</p>
                            <p className="text-lg font-bold text-green-600">{formatCurrency(totalCostsSummary.USD, 'USD')}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        )}

      <TasksList 
        tasks={filteredTasks} 
        categories={categories} 
        properties={properties}
        providers={providers}
        scopes={scopes}
        showProperty={true}
        onDataChanged={onDataChanged}
        onRegisterExpense={handleRegisterExpense}
        selectedTaskIds={selectedTaskIds}
        onSelectionChange={handleSelectionChange}
        onSelectAll={handleSelectAll}
      />
      {expenseAssignment && (
        <ExpenseAddForm
            assignment={expenseAssignment}
            categories={expenseCategories}
            providers={providers}
            onExpenseAdded={onDataChanged}
            isOpen={isExpenseAddOpen}
            onOpenChange={setIsExpenseAddOpen}
            preloadData={expensePreloadData}
        />
      )}
    </div>
  );
}
