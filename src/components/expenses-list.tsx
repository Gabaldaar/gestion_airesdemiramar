'use client';

import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { ExpenseWithDetails, ExpenseCategory, Provider } from "@/lib/data";
import { format } from 'date-fns';
import { es, enUS, ptBR } from 'date-fns/locale';
import { ExpenseEditForm } from "./expense-edit-form";
import { ExpenseDeleteForm } from "./expense-delete-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Pencil, Trash2, Calendar as CalendarIcon, Tag, User, Banknote, ShoppingCart } from 'lucide-react';
import { parseDateSafely, cn } from '@/lib/utils';
import { useTranslation } from "@/i18n/useTranslation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Button } from './ui/button';
import { useAuth } from './auth-provider';

const locales: Record<string, any> = { es, en: enUS, pt: ptBR };

interface ExpensesListProps {
  expenses: ExpenseWithDetails[];
  categories: ExpenseCategory[];
  providers: Provider[];
  onDataChanged: () => void;
}

export default function ExpensesList({ expenses, categories, providers, onDataChanged }: ExpensesListProps) {
  const { appUser } = useAuth();
  const { t, language } = useTranslation();
  const currentLocale = locales[language] || es;
  const isPersonalFlavor = appUser?.appFlavor !== 'commercial';

  const [editingExpense, setEditingExpense] = useState<ExpenseWithDetails | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<ExpenseWithDetails | null>(null);

  if (expenses.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-3xl bg-muted/20">
            <ShoppingCart className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold text-muted-foreground">{t('expenses.no_expenses')}</h3>
            <p className="text-sm text-muted-foreground/60 max-w-xs">{t('common.empty_states.expenses_desc')}</p>
        </div>
    );
  }
  
  const totalAmountARS = expenses.reduce((acc, expense) => acc + expense.amountARS, 0);
  const totalAmountUSD = expenses.reduce((acc, expense) => acc + expense.amountUSD, 0);

  const formatDate = (dateString: string) => {
    const date = parseDateSafely(dateString);
    if (!date) return 'Fecha inválida';
    return format(date, "dd 'de' LLLL, yyyy", { locale: currentLocale });
  };

  const formatCurrency = (amount: number, currency: 'USD' | 'ARS') => {
      const options: Intl.NumberFormatOptions = {
          style: 'currency',
          currency: currency,
          maximumFractionDigits: 0,
      };
      return new Intl.NumberFormat('es-AR', options).format(amount);
  };

  const renderActions = (expense: ExpenseWithDetails) => (
    <div className="flex items-center justify-end gap-1">
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingExpense(expense)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>{t('expenses.tooltips.edit')}</p></TooltipContent>
            </Tooltip>
            
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingExpense(expense)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>{t('expenses.tooltips.delete')}</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>
    </div>
  );

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="overflow-hidden border-2 border-blue-500/30 shadow-sm transition-all hover:shadow-md">
                <CardHeader className="bg-blue-500/10 py-3 px-4 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-[10px] font-black uppercase tracking-wider text-blue-700">{t('common.totals')} (ARS)</CardTitle>
                    <Banknote className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent className="p-4">
                    <p className="text-2xl font-black text-blue-700">{formatCurrency(totalAmountARS, 'ARS')}</p>
                </CardContent>
            </Card>
             <Card className="overflow-hidden border-2 border-green-500/30 shadow-sm transition-all hover:shadow-md">
                <CardHeader className="bg-green-500/10 py-3 px-4 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-[10px] font-black uppercase tracking-wider text-green-700">{t('common.totals')} (USD)</CardTitle>
                    <Banknote className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent className="p-4">
                    <p className="text-2xl font-black text-green-700">{formatCurrency(totalAmountUSD, 'USD')}</p>
                </CardContent>
            </Card>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {expenses.map(e => {
                const isProperty = e.assignment.type === 'property';
                return (
                    <Card key={e.id} className={cn(
                        "flex flex-col w-full overflow-hidden border-2 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
                        isProperty ? "border-blue-500/40" : "border-purple-500/40"
                    )}>
                        <CardHeader className={cn("p-4 py-3", isProperty ? "bg-blue-500/10" : "bg-purple-500/10")}>
                            <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0 flex-1">
                                    <CardTitle className={cn("text-lg truncate font-bold", isProperty ? "text-blue-700" : "text-purple-700")}>{e.assignmentName || 'N/A'}</CardTitle>
                                    <CardDescription className="font-medium text-[10px] flex items-center gap-1 uppercase">
                                        <CalendarIcon className="h-3 w-3" />
                                        {formatDate(e.date)}
                                    </CardDescription>
                                </div>
                                <Badge variant='outline' className="text-[10px] h-5 font-black uppercase" style={{backgroundColor: (!isProperty && isPersonalFlavor) ? e.assignmentColor : 'transparent', color: (!isProperty && isPersonalFlavor) ? 'white' : undefined}}>
                                    {isProperty ? t('tasks.assignment_types.property') : t('tasks.assignment_types.scope')}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4 text-sm flex-grow">
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-muted-foreground text-[10px] uppercase font-black flex items-center gap-1"><Tag className="h-3 w-3" /> {t('common.category')}</span>
                                <span className="font-bold">{e.categoryName || '-'}</span>
                            </div>
                            {isPersonalFlavor && e.providerName && (
                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-muted-foreground text-[10px] uppercase font-black flex items-center gap-1"><User className="h-3 w-3" /> {t('common.provider')}</span>
                                    <Badge variant="secondary" className="h-5 text-[10px] font-bold uppercase">{e.providerName}</Badge>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-[10px] uppercase font-black tracking-wider">{t('common.amount_ars')}</p>
                                    <p className="font-black text-lg text-primary leading-none">{formatCurrency(e.amountARS, 'ARS')}</p>
                                </div>
                                <div className="space-y-1 text-right border-l pl-4">
                                    <p className="text-muted-foreground text-[10px] uppercase font-black tracking-wider">{t('common.amount_usd')}</p>
                                    <p className="font-black text-lg text-primary leading-none">{formatCurrency(e.amountUSD, 'USD')}</p>
                                </div>
                            </div>
                            {e.description && (
                                <div className="mt-2 bg-muted/30 p-2 rounded-lg border border-dashed">
                                    <p className="text-muted-foreground text-[10px] uppercase font-black mb-1">{t('common.description')}</p>
                                    <p className="text-xs leading-tight whitespace-pre-wrap">{e.description}</p>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="p-2 px-4 justify-end border-t bg-muted/30">
                            {renderActions(e)}
                        </CardFooter>
                    </Card>
                );
            })}
        </div>

        {editingExpense && (
            <ExpenseEditForm 
                expense={editingExpense} 
                categories={categories} 
                providers={providers} 
                isOpen={!!editingExpense}
                onOpenChange={(open) => !open && setEditingExpense(null)}
                onExpenseUpdated={onDataChanged} 
            />
        )}

        {deletingExpense && (
            <ExpenseDeleteForm 
                expenseId={deletingExpense.id} 
                isOpen={!!deletingExpense}
                onOpenChange={(open) => !open && setDeletingExpense(null)}
                onExpenseDeleted={onDataChanged} 
            />
        )}
    </div>
  );
}
