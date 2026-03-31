

'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExpenseWithDetails, ExpenseCategory, Provider } from "@/lib/data";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ExpenseEditForm } from "./expense-edit-form";
import { ExpenseDeleteForm } from "./expense-delete-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Wrench } from 'lucide-react';
import useWindowSize from '@/hooks/use-window-size';


interface ExpensesListProps {
  expenses: ExpenseWithDetails[];
  categories: ExpenseCategory[];
  providers: Provider[];
  onDataChanged: () => void;
}

const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' LLL, yyyy", { locale: es });
};

const formatCurrency = (amount: number, currency: 'USD' | 'ARS') => {
    const options: Intl.NumberFormatOptions = {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    };
    if (currency === 'ARS') {
      return new Intl.NumberFormat('es-AR', { ...options, style: 'currency', currency: 'ARS'}).format(amount);
    }
    return `USD ${new Intl.NumberFormat('es-AR', options).format(amount)}`;
}

function ExpenseActions({ expense, categories, providers, onDataChanged }: { 
    expense: ExpenseWithDetails; 
    categories: ExpenseCategory[]; 
    providers: Provider[];
    onDataChanged: () => void; 
}) {
    return (
        <div className="flex items-center justify-end gap-2">
            <ExpenseEditForm
                expense={expense}
                categories={categories}
                providers={providers}
                onExpenseUpdated={onDataChanged}
            />
            <ExpenseDeleteForm expenseId={expense.id} onExpenseDeleted={onDataChanged} />
        </div>
    );
}

function ExpenseCard({ expense, categories, providers, onDataChanged }: { 
    expense: ExpenseWithDetails; 
    categories: ExpenseCategory[],
    providers: Provider[],
    onDataChanged: () => void; 
}) {
    return (
        <Card className="flex flex-col w-full">
            <CardHeader className="p-4">
                <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                        <CardTitle className="text-lg truncate">{expense.assignmentName || 'N/A'}</CardTitle>
                        <CardDescription>{formatDate(expense.date)}</CardDescription>
                    </div>
                     <Badge 
                        variant='outline' 
                        style={{
                            backgroundColor: expense.assignment.type === 'scope' ? expense.assignmentColor : 'transparent',
                            color: expense.assignment.type === 'scope' ? 'white' : undefined,
                        }}
                    >
                        {expense.assignment.type === 'property' ? 'Propiedad' : 'Ámbito'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-sm flex-grow">
                 <div className="flex justify-between items-baseline border-b pb-2">
                    <span className="font-bold text-lg text-primary">{formatCurrency(expense.amountUSD, 'USD')}</span>
                    <span className="text-muted-foreground">{formatCurrency(expense.amountARS, 'ARS')}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Categoría</span>
                    <span className="font-medium text-right truncate min-w-0">{expense.categoryName || '-'}</span>
                </div>
                {expense.providerName && (
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1"><Wrench className="h-3 w-3" /> Proveedor</span>
                        <span className="font-medium text-right truncate min-w-0">{expense.providerName}</span>
                    </div>
                )}
                
                {expense.description && (
                    <div className="space-y-1 pt-2">
                        <span className="text-muted-foreground">Descripción</span>
                        <p className="font-medium text-sm p-2 bg-muted/50 rounded-md whitespace-pre-wrap break-words">{expense.description}</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-2 justify-end">
                <ExpenseActions expense={expense} categories={categories} providers={providers} onDataChanged={onDataChanged} />
            </CardFooter>
        </Card>
    );
}

function ExpenseRow({ expense, categories, providers, onDataChanged }: { 
    expense: ExpenseWithDetails; 
    categories: ExpenseCategory[],
    providers: Provider[],
    onDataChanged: () => void; 
}) {
     return (
        <TableRow key={expense.id}>
            <TableCell>{formatDate(expense.date)}</TableCell>
            <TableCell>
                <div className="flex flex-col">
                    <span className="font-medium">{expense.assignmentName}</span>
                    <Badge 
                        variant='outline' 
                        className="w-fit"
                        style={{
                            backgroundColor: expense.assignment.type === 'scope' ? expense.assignmentColor : 'transparent',
                            color: expense.assignment.type === 'scope' ? 'white' : undefined,
                        }}
                    >
                        {expense.assignment.type === 'property' ? 'Propiedad' : 'Ámbito'}
                    </Badge>
                </div>
            </TableCell>
            <TableCell>{expense.categoryName || '-'}</TableCell>
            <TableCell>{expense.providerName || '-'}</TableCell>
            <TableCell className="font-medium max-w-xs truncate">{expense.description}</TableCell>
            <TableCell className="text-right">{formatCurrency(expense.amountARS, 'ARS')}</TableCell>
            <TableCell className="text-right">{formatCurrency(expense.amountUSD, 'USD')}</TableCell>
            <TableCell className="text-right">
                <ExpenseActions expense={expense} categories={categories} providers={providers} onDataChanged={onDataChanged} />
            </TableCell>
          </TableRow>
    );
}


export default function ExpensesList({ expenses, categories, providers, onDataChanged }: ExpensesListProps) {
  const { width } = useWindowSize();
  const useCardView = width < 1280;

  if (expenses.length === 0) {
    return <p className="text-sm text-center text-muted-foreground py-8">No hay gastos para mostrar con los filtros seleccionados.</p>;
  }
  
  const totalAmountARS = expenses.reduce((acc, expense) => acc + expense.amountARS, 0);
  const totalAmountUSD = expenses.reduce((acc, expense) => acc + expense.amountUSD, 0);

    const TableView = () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Asignación</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Monto (ARS)</TableHead>
                    <TableHead className="text-right">Monto (USD)</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {expenses.map((expense) => (
                    <ExpenseRow key={expense.id} expense={expense} categories={categories} providers={providers} onDataChanged={onDataChanged} />
                ))}
            </TableBody>
            <TableFooter>
                <TableRow>
                    <TableCell colSpan={5} className="font-bold text-right">Totales</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(totalAmountARS, 'ARS')}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(totalAmountUSD, 'USD')}</TableCell>
                    <TableCell></TableCell>
                </TableRow>
            </TableFooter>
        </Table>
    );

    const CardView = () => (
         <div className="space-y-4">
            {expenses.map(expense => (
                <ExpenseCard key={expense.id} expense={expense} categories={categories} providers={providers} onDataChanged={onDataChanged} />
            ))}
        </div>
    );

    return (
        <div className="space-y-4">
            <Card className="bg-muted">
                <CardContent className="p-4 grid grid-cols-2 text-center">
                    <div>
                        <p className="text-sm text-muted-foreground">Total (ARS)</p>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(totalAmountARS, 'ARS')}</p>
                    </div>
                     <div>
                        <p className="text-sm text-muted-foreground">Total (USD)</p>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(totalAmountUSD, 'USD')}</p>
                    </div>
                </CardContent>
            </Card>
            
            {useCardView ? <CardView /> : <TableView />}
        </div>
    )
}
