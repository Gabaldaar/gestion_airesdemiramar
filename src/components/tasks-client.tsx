

'use client';

import { useState, useMemo, useCallback } from 'react';
import { TaskWithDetails, Property, TaskCategory, TaskStatus, TaskPriority } from '@/lib/data';
import TasksList from '@/components/tasks-list';
import { ExpensePreloadData } from '@/components/expense-add-form';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from './ui/label';
import { parseDateSafely } from '@/lib/utils';
import { ExpenseAddForm } from './expense-add-form';

interface TasksClientProps {
  initialTasks: TaskWithDetails[];
  properties: Property[];
  categories: TaskCategory[];
  onDataChanged: () => void;
}

export default function TasksClient({ initialTasks, properties, categories, onDataChanged }: TasksClientProps) {
  const [tasks, setTasks] = useState<TaskWithDetails[]>(initialTasks);
  const [propertyIdFilter, setPropertyIdFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [categoryIdFilter, setCategoryIdFilter] = useState<string>('all');
  
  const [isExpenseAddOpen, setIsExpenseAddOpen] = useState(false);
  const [expensePreloadData, setExpensePreloadData] = useState<ExpensePreloadData | undefined>(undefined);
  const [expensePropertyId, setExpensePropertyId] = useState<string>('');


  const handleRegisterExpense = useCallback((data: ExpensePreloadData, propertyId: string) => {
    setExpensePreloadData(data);
    setExpensePropertyId(propertyId);
    setIsExpenseAddOpen(true);
  }, []);

  const filteredTasks = useMemo(() => {
    let currentTasks = tasks.filter(task => {
      // Property Filter
      if (propertyIdFilter !== 'all' && task.propertyId !== propertyIdFilter) {
        return false;
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

  }, [tasks, propertyIdFilter, statusFilter, priorityFilter, categoryIdFilter]);

  const handleClearFilters = () => {
    setPropertyIdFilter('all');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryIdFilter('all');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
          <div className="grid gap-2">
              <Label>Propiedad</Label>
              <Select value={propertyIdFilter} onValueChange={setPropertyIdFilter}>
                  <SelectTrigger>
                      <SelectValue placeholder="Propiedad" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {properties.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
          </div>
          <div className="grid gap-2">
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
          <div className="grid gap-2">
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
           <div className="grid gap-2">
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
        
          <Button variant="outline" onClick={handleClearFilters}>Limpiar Filtros</Button>
        </div>
      </div>
      <TasksList 
        tasks={filteredTasks} 
        categories={categories} 
        properties={properties}
        onDataChanged={onDataChanged}
        onRegisterExpense={handleRegisterExpense}
      />
      {expensePropertyId && (
        <ExpenseAddForm
            propertyId={expensePropertyId}
            categories={[]} // Categories will be fetched inside, but we need an empty array here
            onExpenseAdded={onDataChanged}
            isOpen={isExpenseAddOpen}
            onOpenChange={setIsExpenseAddOpen}
            preloadData={expensePreloadData}
        />
      )}
    </div>
  );
}

