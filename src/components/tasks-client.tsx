
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { TaskWithDetails, Property, Provider, TaskCategory, TaskStatus, TaskPriority, ExpenseCategory, TaskScope, TaskAssignment, CurrencySettings, ExpenseWithDetails } from '@/lib/data';
import TasksList from '@/components/tasks-list';
import { ExpensePreloadData } from '@/components/expense-add-form';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from './ui/label';
import { ExpenseAddForm } from './expense-add-form';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { useTranslation } from '@/i18n/useTranslation';
import { ListFilter, ChevronDown, ChevronUp, X } from 'lucide-react';
import useWindowSize from '@/hooks/use-window-size';

interface TasksClientProps {
  initialTasks: TaskWithDetails[];
  properties: Property[];
  providers: Provider[];
  categories: TaskCategory[];
  scopes: TaskScope[];
  expenseCategories: ExpenseCategory[];
  allExpenses: ExpenseWithDetails[];
  onDataChanged: () => void;
  isPersonalFlavor: boolean;
  currencySettings: CurrencySettings | null;
}

export default function TasksClient({ initialTasks, properties, providers, categories, scopes, expenseCategories, allExpenses, onDataChanged, isPersonalFlavor, currencySettings }: TasksClientProps) {
  const { t } = useTranslation();
  const { width } = useWindowSize();
  const isMobile = typeof width === 'number' ? width < 768 : false;

  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
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

  // Set initial filter state based on device
  useEffect(() => {
    if (width !== undefined) {
      setIsFilterExpanded(!isMobile);
    }
  }, [isMobile, width]);


  const handleRegisterExpense = useCallback((data: ExpensePreloadData, assignment: TaskAssignment) => {
    setExpensePreloadData(data);
    setExpenseAssignment(assignment);
    setIsExpenseAddOpen(true);
  }, []);

  const filteredTasks = useMemo(() => {
    let currentTasks = tasks.map(task => {
        const relatedExpenses = allExpenses.filter(e => e.taskId === task.id);
        const actualCost = relatedExpenses.reduce((sum, e) => sum + (task.costCurrency === 'USD' ? e.amountUSD : e.amountARS), 0);
        return { ...task, actualCost };
    });

    currentTasks = currentTasks.filter(task => {
        
        if (!isPersonalFlavor) {
            // Commercial flavor: only properties are assignments
            if (task.assignment?.type !== 'property') return false;
            if (assignmentIdFilter !== 'all' && task.assignment.id !== assignmentIdFilter) return false;
        } else {
            // Personal flavor logic
            if (assignmentTypeFilter !== 'all') {
                if (assignmentTypeFilter === 'unassigned') {
                if (task.assignment && task.assignment.id) return false;
                } else {
                if (task.assignment?.type !== assignmentTypeFilter) return false;
                }
            }
            if (assignmentIdFilter !== 'all') {
                if (task.assignment?.id !== assignmentIdFilter) return false;
            }
        }
      
      // Provider Filter
      if (isPersonalFlavor && providerIdFilter !== 'all') {
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

  }, [tasks, allExpenses, assignmentTypeFilter, assignmentIdFilter, providerIdFilter, statusFilter, priorityFilter, categoryIdFilter, costCurrencyFilter, isPersonalFlavor]);

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
    const totals: Record<string, number> = {};
    selectedTaskIds.forEach(id => {
        const task = tasks.find(t => t.id === id);
        if (task && task.estimatedCost) {
            const currency = task.costCurrency || 'ARS';
            totals[currency] = (totals[currency] || 0) + task.estimatedCost;
        }
    });
    return totals;
  }, [selectedTaskIds, tasks]);

  const formatCurrency = (amount: number, currency: string) => {
    try {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency }).format(amount);
    } catch (e) {
        return `${currency} ${amount.toFixed(2)}`;
    }
  }

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-muted/70 shadow-sm">
        <div className="flex items-center justify-between mb-1 w-full">
            <button 
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary hover:opacity-80 transition-opacity"
            >
                <ListFilter className="h-4 w-4" /> 
                {t('common.filters')}
                {isFilterExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            <span className="text-[10px] font-bold bg-background/50 px-2 py-0.5 rounded-full text-primary border border-primary/20">
                {filteredTasks.length} / {initialTasks.length}
            </span>
        </div>
        
        {isFilterExpanded && (
            <div className="flex flex-wrap items-end justify-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                {isPersonalFlavor ? (
                    <>
                        <div className="grid gap-2 flex-1 min-w-[180px]">
                            <Label>{t('tasks.filters.assignment_type')}</Label>
                            <Select value={assignmentTypeFilter} onValueChange={(val) => {
                                setAssignmentTypeFilter(val as 'all' | 'property' | 'scope' | 'unassigned');
                                setAssignmentIdFilter('all'); // Reset specific filter when type changes
                            }}>
                                <SelectTrigger className="bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('tasks.assignment_types.all')}</SelectItem>
                                    <SelectItem value="property">{t('tasks.assignment_types.property')}</SelectItem>
                                    <SelectItem value="scope">{t('tasks.assignment_types.scope')}</SelectItem>
                                    <SelectItem value="unassigned">{t('tasks.assignment_types.unassigned')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {(assignmentTypeFilter === 'property' || assignmentTypeFilter === 'scope') && (
                            <div className="grid gap-2 flex-1 min-w-[180px]">
                                <Label>{t('tasks.filters.specific')}</Label>
                                <Select value={assignmentIdFilter} onValueChange={setAssignmentIdFilter}>
                                    <SelectTrigger className="bg-background">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('common.all')}</SelectItem>
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
                    </>
                ) : (
                    <div className="grid gap-2 flex-1 min-w-[180px]">
                        <Label>{t('navigation.properties')}</Label>
                        <Select value={assignmentIdFilter} onValueChange={setAssignmentIdFilter}>
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder={t('common.all')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('common.all')}</SelectItem>
                                {properties.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                
                {isPersonalFlavor && (
                    <div className="grid gap-2 flex-1 min-w-[180px]">
                        <Label>{t('tasks.filters.provider')}</Label>
                        <Select value={providerIdFilter} onValueChange={setProviderIdFilter}>
                            <SelectTrigger className="bg-background">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('common.all')}</SelectItem>
                                <SelectItem value="none">{t('common.none')}</SelectItem>
                                {providers.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <div className="grid gap-2 flex-1 min-w-[180px]">
                    <Label>{t('tasks.filters.status')}</Label>
                    <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as TaskStatus | 'all')}>
                        <SelectTrigger className="bg-background">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('common.all')}</SelectItem>
                            <SelectItem value="pending">{t('tasks.status.pending')}</SelectItem>
                            <SelectItem value="in_progress">{t('tasks.status.in_progress')}</SelectItem>
                            <SelectItem value="completed">{t('tasks.status.completed')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2 flex-1 min-w-[180px]">
                    <Label>{t('tasks.filters.priority')}</Label>
                    <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val as TaskPriority | 'all')}>
                        <SelectTrigger className="bg-background">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('common.all')}</SelectItem>
                            <SelectItem value="high">{t('tasks.priority.high')}</SelectItem>
                            <SelectItem value="medium">{t('tasks.priority.medium')}</SelectItem>
                            <SelectItem value="low">{t('tasks.priority.low')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2 flex-1 min-w-[180px]">
                    <Label>{t('tasks.filters.category')}</Label>
                    <Select value={categoryIdFilter} onValueChange={setCategoryIdFilter}>
                        <SelectTrigger className="bg-background">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('common.all')}</SelectItem>
                            <SelectItem value="none">{t('common.none')}</SelectItem>
                            {categories.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2 flex-1 min-w-[180px]">
                    <Label>{t('tasks.filters.currency')}</Label>
                    <Select value={costCurrencyFilter} onValueChange={(v) => setCostCurrencyFilter(v as 'all' | 'ARS' | 'USD')}>
                        <SelectTrigger className="bg-background">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('common.all')}</SelectItem>
                            <SelectItem value="ARS">{t('common.currency')} ARS</SelectItem>
                            <SelectItem value="USD">{t('common.currency')} USD</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button variant="ghost" onClick={handleClearFilters} className="bg-background">
                    <X className="h-4 w-4 mr-2" /> {t('common.clean')}
                </Button>
            </div>
        )}
      </div>

       {selectedTaskIds.length > 0 && (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-md">
                        {selectedTaskIds.length} {t('navigation.tasks')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row sm:items-center sm:gap-6">
                    {Object.entries(totalCostsSummary).map(([currency, total]) => {
                        if (total > 0) {
                            return (
                                <div key={currency}>
                                    <p className="text-sm text-muted-foreground">{t('tasks.table.est_cost')} ({currency})</p>
                                    <p className="text-lg font-bold text-primary">{formatCurrency(total, currency)}</p>
                                </div>
                            )
                        }
                        return null;
                    })}
                </CardContent>
            </Card>
        )}

      <TasksList 
        tasks={filteredTasks} 
        categories={categories} 
        properties={properties}
        providers={providers}
        scopes={scopes}
        allExpenses={allExpenses}
        showProperty={true}
        onDataChanged={onDataChanged}
        onRegisterExpense={handleRegisterExpense}
        selectedTaskIds={selectedTaskIds}
        onSelectionChange={handleSelectionChange}
        onSelectAll={handleSelectAll}
      />
      
      {expenseAssignment && (
        <ExpenseAddForm
            key={expenseAssignment ? `exp-form-${expenseAssignment.id}-${expensePreloadData?.taskId || 'new'}` : 'exp-form-empty'}
            assignment={expenseAssignment}
            categories={expenseCategories}
            providers={providers}
            onExpenseAdded={onDataChanged}
            isOpen={isExpenseAddOpen}
            onOpenChange={(open) => {
                setIsExpenseAddOpen(open);
                if (!open) setExpenseAssignment(null);
            }}
            preloadData={expensePreloadData}
            currencySettings={currencySettings}
            lockAssignment={true}
        >
            <div className="hidden" />
        </ExpenseAddForm>
      )}
    </div>
  );
}
