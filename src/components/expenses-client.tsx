

'use client';

import { useState, useMemo } from 'react';
import { UnifiedExpense, Property, ExpenseCategory } from '@/lib/data';
import ExpensesUnifiedList from '@/components/expenses-unified-list';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from './ui/label';

type ExpenseTypeFilter = 'all' | 'Propiedad' | 'Reserva';

interface ExpensesClientProps {
  initialExpenses: UnifiedExpense[];
  properties: Property[];
  categories: ExpenseCategory[];
}

export default function ExpensesClient({ initialExpenses, properties, categories }: ExpensesClientProps) {
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [propertyIdFilter, setPropertyIdFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<ExpenseTypeFilter>('all');
  const [categoryIdFilter, setCategoryIdFilter] = useState<string>('all');


  const filteredExpenses = useMemo(() => {
    return initialExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);

      // Property Filter
      if (propertyIdFilter !== 'all' && expense.propertyId !== propertyIdFilter) {
        return false;
      }
      
      // Type Filter
      if (typeFilter !== 'all' && expense.type !== typeFilter) {
          return false;
      }

      // Category Filter
      if (categoryIdFilter !== 'all' && (expense.categoryName || 'sin-categoria') !== categories.find(c => c.id === categoryIdFilter)?.name) {
          if(categoryIdFilter === 'none' && expense.categoryName) return false;
          if(categoryIdFilter !== 'none' && categoryIdFilter !== 'all') {
             const category = categories.find(c => c.id === categoryIdFilter);
             if(expense.categoryName !== category?.name) return false;
          }
      }


      // Date Range Filter
      if (fromDate && expenseDate < fromDate) {
        return false;
      }
      if (toDate) {
        const normalizedToDate = new Date(toDate);
        normalizedToDate.setHours(23, 59, 59, 999);
        if (expenseDate > normalizedToDate) {
            return false;
        }
      }
      
      return true;
    });
  }, [initialExpenses, fromDate, toDate, propertyIdFilter, typeFilter, categoryIdFilter, categories]);

  const handleClearFilters = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setPropertyIdFilter('all');
    setTypeFilter('all');
    setCategoryIdFilter('all');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg bg-muted/50 flex-wrap">
        <div className="grid gap-2">
            <Label>Propiedad</Label>
            <Select value={propertyIdFilter} onValueChange={setPropertyIdFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
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
            <Label>Tipo de Gasto</Label>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as ExpenseTypeFilter)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Propiedad">Propiedad</SelectItem>
                    <SelectItem value="Reserva">Reserva</SelectItem>
                </SelectContent>
            </Select>
        </div>
         <div className="grid gap-2">
            <Label>Categoría</Label>
            <Select value={categoryIdFilter} onValueChange={setCategoryIdFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
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
        <div className="grid gap-2">
            <Label>Desde</Label>
            <DatePicker date={fromDate} onDateSelect={setFromDate} placeholder="Desde" />
        </div>
        <div className="grid gap-2">
            <Label>Hasta</Label>
            <DatePicker date={toDate} onDateSelect={setToDate} placeholder="Hasta" />
        </div>
       
        <div className="self-end">
             <Button variant="outline" onClick={handleClearFilters}>Limpiar Filtros</Button>
        </div>
      </div>
      <ExpensesUnifiedList expenses={filteredExpenses} />
    </div>
  );
}
