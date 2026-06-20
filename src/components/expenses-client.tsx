
'use client';

import { useState, useMemo, useEffect } from 'react';
import { ExpenseWithDetails, Property, ExpenseCategory, Provider, TaskScope } from '@/lib/data';
import ExpensesList from '@/components/expenses-list';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from './ui/label';
import { parseDateSafely } from '@/lib/utils';
import { X, Search, ListFilter, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from "@/i18n/useTranslation";
import { Input } from './ui/input';
import useWindowSize from '@/hooks/use-window-size';

type ExpenseTypeFilter = 'all' | 'Propiedad' | 'Ámbito';

interface ExpensesClientProps {
  initialExpenses: ExpenseWithDetails[];
  properties: Property[];
  categories: ExpenseCategory[];
  providers: Provider[];
  scopes: TaskScope[];
  onDataChanged: () => void;
  isPersonalFlavor: boolean;
}

export default function ExpensesClient({ initialExpenses, properties, categories, providers, scopes, onDataChanged, isPersonalFlavor }: ExpensesClientProps) {
  const { t } = useTranslation();
  const { width } = useWindowSize();
  const isMobile = typeof width === 'number' ? width < 768 : false;

  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [propertyIdFilter, setPropertyIdFilter] = useState<string>('all');
  const [scopeIdFilter, setScopeIdFilter] = useState<string>('all');
  const [providerIdFilter, setProviderIdFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<ExpenseTypeFilter>('all');
  const [categoryIdFilter, setCategoryIdFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Set initial filter state based on device
  useEffect(() => {
    if (width !== undefined) {
      setIsFilterExpanded(!isMobile);
    }
  }, [isMobile, width]);

  const filteredExpenses = useMemo(() => {
    const filtered = initialExpenses.filter(expense => {
      const expenseDate = parseDateSafely(expense.date);
      if (!expenseDate) return false;

      // Text Search
      if (searchTerm) {
          const lowerTerm = searchTerm.toLowerCase();
          const match = expense.description?.toLowerCase().includes(lowerTerm) || 
                        expense.assignmentName?.toLowerCase().includes(lowerTerm) ||
                        expense.providerName?.toLowerCase().includes(lowerTerm);
          if (!match) return false;
      }

      // Property Filter (only if assignment is of type 'property')
      if (propertyIdFilter !== 'all' && (expense.assignment?.type !== 'property' || expense.assignment?.id !== propertyIdFilter)) {
        return false;
      }

      // Scope Filter (only if assignment is of type 'scope')
      if (scopeIdFilter !== 'all' && (expense.assignment?.type !== 'scope' || expense.assignment?.id !== scopeIdFilter)) {
        return false;
      }
      
      // Provider Filter
      if (isPersonalFlavor && providerIdFilter !== 'all' && expense.providerId !== providerIdFilter) {
        return false;
      }
      
      // Type Filter
      if (isPersonalFlavor && typeFilter !== 'all' && expense.type !== typeFilter) {
          return false;
      }

      // Category Filter
      if (categoryIdFilter !== 'all') {
        if (categoryIdFilter === 'none' && expense.categoryId) return false;
        if (categoryIdFilter !== 'none' && expense.categoryId !== categoryIdFilter) return false;
      }

      // Date Range Filter
      if (fromDate) {
        const fromDateUTC = new Date(Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()));
        if (expenseDate < fromDateUTC) return false;
      }
      if (toDate) {
        const toDateUTC = new Date(Date.UTC(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999));
        if (expenseDate > toDateUTC) return false;
      }
      
      return true;
    });

    // Ordenar por fecha descendente (más reciente primero)
    return filtered.sort((a, b) => {
        const dateA = parseDateSafely(a.date)?.getTime() || 0;
        const dateB = parseDateSafely(b.date)?.getTime() || 0;
        return dateB - dateA;
    });
  }, [initialExpenses, fromDate, toDate, propertyIdFilter, scopeIdFilter, providerIdFilter, typeFilter, categoryIdFilter, searchTerm, isPersonalFlavor]);

  const handleClearFilters = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setPropertyIdFilter('all');
    setScopeIdFilter('all');
    setProviderIdFilter('all');
    setTypeFilter('all');
    setCategoryIdFilter('all');
    setSearchTerm('');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/70 shadow-sm">
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
                {filteredExpenses.length} / {initialExpenses.length}
            </span>
        </div>
        
        {isFilterExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-end animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid gap-2">
                    <Label>{t('expenses.filters.search')}</Label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('expenses.filters.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-background"
                        />
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label>{t('common.from')}</Label>
                    <DatePicker date={fromDate} onDateSelect={setFromDate} placeholder={t('common.from')} />
                </div>
                <div className="grid gap-2">
                    <Label>{t('common.to')}</Label>
                    <DatePicker date={toDate} onDateSelect={setToDate} placeholder={t('common.to')} />
                </div>
                <div className="grid gap-2">
                    <Label>{t('expenses.filters.property')}</Label>
                    <Select value={propertyIdFilter} onValueChange={setPropertyIdFilter}>
                        <SelectTrigger className="bg-background">
                            <SelectValue placeholder={t('expenses.filters.property')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('common.all')}</SelectItem>
                            {properties.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {isPersonalFlavor && (
                    <>
                        <div className="grid gap-2">
                            <Label>{t('expenses.filters.scope')}</Label>
                            <Select value={scopeIdFilter} onValueChange={setScopeIdFilter}>
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder={t('expenses.filters.scope')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('common.all')}</SelectItem>
                                    {scopes.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>{t('expenses.filters.provider')}</Label>
                            <Select value={providerIdFilter} onValueChange={setProviderIdFilter}>
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder={t('expenses.filters.provider')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('common.all')}</SelectItem>
                                    {providers.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>{t('expenses.filters.type')}</Label>
                            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as ExpenseTypeFilter)}>
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder={t('expenses.filters.type')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('expenses.filters.all_types')}</SelectItem>
                                    <SelectItem value="Propiedad">{t('expenses.filters.type_property')}</SelectItem>
                                    <SelectItem value="Ámbito">{t('expenses.filters.type_scope')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                )}
                <div className="grid gap-2">
                    <Label>{t('expenses.filters.category')}</Label>
                    <Select value={categoryIdFilter} onValueChange={setCategoryIdFilter}>
                        <SelectTrigger className="bg-background">
                            <SelectValue placeholder={t('expenses.filters.category')} />
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
                
                <div className="flex justify-end sm:justify-start">
                    <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-9 px-2 text-muted-foreground hover:bg-background/50">
                        <X className="h-4 w-4 mr-1" /> {t('common.clean')}
                    </Button>
                </div>
            </div>
        )}
      </div>
      <ExpensesList expenses={filteredExpenses} categories={categories} providers={providers} properties={properties} scopes={scopes} onDataChanged={onDataChanged} />
    </div>
  );
}
