

'use client';

import { useState, useMemo, useCallback } from 'react';
import { UnifiedExpense, Property, ExpenseCategory, getAllExpensesUnified, Provider } from '@/lib/data';
import ExpensesList from '@/components/expenses-list';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from './ui/label';
import { parseDateSafely } from '@/lib/utils';

type ExpenseTypeFilter = 'all' | 'Propiedad' | 'Reserva';

interface ExpensesClientProps {
  initialExpenses: UnifiedExpense[];
  properties: Property[];
  categories: ExpenseCategory[];
  providers: Provider[];
}

export default function ExpensesClient({ initialExpenses, properties, categories, providers }: ExpensesClientProps) {
  const [expenses, setExpenses] = useState<UnifiedExpense[]>(initialExpenses);
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [propertyIdFilter, setPropertyIdFilter] = useState<string>('all');
  const [providerIdFilter, setProviderIdFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<ExpenseTypeFilter>('all');
  const [categoryIdFilter, setCategoryIdFilter] = useState<string>('all');

  const refreshExpenses = useCallback(async () => {
    const updatedExpenses = await getAllExpensesUnified();
    setExpenses(updatedExpenses);
  }, []);


  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const expenseDate = parseDateSafely(expense.date);
      if (!expenseDate) return false;

      // Property Filter
      if (propertyIdFilter !== 'all' && ('propertyId' in expense && expense.propertyId !== propertyIdFilter)) {
        return false;
      }

      // Provider Filter
      if (providerIdFilter !== 'all') {
        if (!('providerId' in expense) || expense.providerId !== providerIdFilter) {
          return false;
        }
      }
      
      // Type Filter
      if (typeFilter !== 'all' && expense.type !== typeFilter) {
          return false;
      }

      // Category Filter
      if (categoryIdFilter !== 'all') {
        if (categoryIdFilter === 'none' && expense.categoryId) {
          return false;
        }
        if (categoryIdFilter !== 'none' && expense.categoryId !== categoryIdFilter) {
          return false;
        }
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
  }, [expenses, fromDate, toDate, propertyIdFilter, providerIdFilter, typeFilter, categoryIdFilter]);

  const handleClearFilters = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setPropertyIdFilter('all');
    setProviderIdFilter('all');
    setTypeFilter('all');
    setCategoryIdFilter('all');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-end">
          <div className="grid gap-2">
              <Label>Desde</Label>
              <DatePicker date={fromDate} onDateSelect={setFromDate} placeholder="Desde" />
          </div>
          <div className="grid gap-2">
              <Label>Hasta</Label>
              <DatePicker date={toDate} onDateSelect={setToDate} placeholder="Hasta" />
          </div>
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
              <Label>Proveedor</Label>
              <Select value={providerIdFilter} onValueChange={setProviderIdFilter}>
                  <SelectTrigger>
                      <SelectValue placeholder="Proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {providers.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
          </div>
          <div className="grid gap-2">
              <Label>Tipo de Gasto</Label>
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as ExpenseTypeFilter)}>
                  <SelectTrigger>
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
      <ExpensesList expenses={filteredExpenses} categories={categories} providers={providers} onDataChanged={refreshExpenses} />
    </div>
  );
}
