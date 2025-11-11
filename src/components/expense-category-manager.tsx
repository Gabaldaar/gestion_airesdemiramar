
'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { ExpenseCategory, getExpenseCategories } from '@/lib/data';
import { addExpenseCategory, updateExpenseCategory, deleteExpenseCategory } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle, Save, Trash2, Pencil, X, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import useWindowSize from '@/hooks/use-window-size';
import { Card, CardContent } from './ui/card';


const initialState = {
  message: '',
  success: false,
};

function AddCategoryButton({ isPending }: { isPending: boolean }) {
    return (
        <Button type="submit" size="icon" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
        </Button>
    )
}

function CategoryAddRow({ onActionComplete }: { onActionComplete: () => void }) {
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
        const result = await addExpenseCategory(initialState, formData);
        setState(result);
    });
  }

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      onActionComplete();
    }
  }, [state, onActionComplete]);
  
  return (
    <form onSubmit={handleSubmit} ref={formRef} className="flex items-center gap-2 p-2 border-t">
        <Input name="name" placeholder="Nombre de la nueva categoría" className="flex-grow" required />
        <AddCategoryButton isPending={isPending} />
    </form>
  );
}

function EditCategoryButtons({ onCancel, isPending }: { onCancel: () => void, isPending: boolean }) {
    return (
        <>
            <Button type="submit" variant="ghost" size="icon" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-green-600" />}
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={onCancel} disabled={isPending}>
                <X className="h-4 w-4 text-red-600" />
            </Button>
        </>
    )
}

function CategoryEditRow({ category, onCancel, onUpdated }: { category: ExpenseCategory, onCancel: () => void, onUpdated: () => void }) {
    const [state, setState] = useState(initialState);
    const [isPending, startTransition] = useTransition();
    
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            const result = await updateExpenseCategory(initialState, formData);
            setState(result);
        });
    }

    useEffect(() => {
        if (state.success) {
            onUpdated();
        }
    }, [state, onUpdated]);

    return (
         <TableRow>
            <TableCell colSpan={2}>
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={category.id} />
                    <Input name="name" defaultValue={category.name} className="flex-grow" required />
                    <EditCategoryButtons onCancel={onCancel} isPending={isPending} />
                </form>
            </TableCell>
        </TableRow>
    )
}

function DeleteCategoryButton({ isPending }: { isPending: boolean }) {
    return (
         <Button type="submit" variant="destructive" disabled={isPending}>
             {isPending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Eliminando...
                </>
            ) : (
                'Continuar'
            )}
        </Button>
    )
}

function CategoryDeleteAction({ categoryId, onDeleted }: { categoryId: string, onDeleted: () => void }) {
    const [state, setState] = useState(initialState);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            const result = await deleteExpenseCategory(initialState, formData);
            setState(result);
        });
    }

    useEffect(() => {
        if (state.success) {
            onDeleted();
        }
    }, [state, onDeleted]);
    
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                 <form onSubmit={handleSubmit}>
                    <input type="hidden" name="id" value={categoryId} />
                    <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. La categoría será eliminada permanentemente. Los gastos asociados no serán eliminados, pero quedarán sin categoría.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <DeleteCategoryButton isPending={isPending} />
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    )
}


export default function ExpenseCategoryManager({ initialCategories }: { initialCategories: ExpenseCategory[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const { width } = useWindowSize();
  const isMobile = width < 768;
  
  const refreshCategories = async () => {
      setEditingCategoryId(null);
      const updatedCategories = await getExpenseCategories();
      setCategories(updatedCategories);
  };
  
  useEffect(() => {
      setCategories(initialCategories);
  }, [initialCategories]);

  if (isMobile) {
    return (
      <div className="w-full mx-auto space-y-4">
        {categories.map((category) => (
             editingCategoryId === category.id 
             ? (
                <Card key={category.id}>
                    <CardContent className="p-2">
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            updateExpenseCategory(initialState, formData).then(refreshCategories);
                        }} className="flex items-center gap-2">
                            <input type="hidden" name="id" value={editingCategoryId} />
                            <Input name="name" defaultValue={categories.find(c => c.id === editingCategoryId)?.name} className="flex-grow" required />
                            <EditCategoryButtons onCancel={() => setEditingCategoryId(null)} isPending={false} />
                        </form>
                    </CardContent>
                </Card>
             ) : (
                <Card key={category.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                    <span className="font-medium">{category.name}</span>
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" onClick={() => setEditingCategoryId(category.id)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <CategoryDeleteAction categoryId={category.id} onDeleted={refreshCategories} />
                    </div>
                    </CardContent>
                </Card>
             )
        ))}
       
        <Card>
            <CardContent className="p-2">
                <CategoryAddRow onActionComplete={refreshCategories} />
            </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="text-right w-[100px]">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {categories.map((category) => (
                        editingCategoryId === category.id 
                        ? <CategoryEditRow key={category.id} category={category} onCancel={() => setEditingCategoryId(null)} onUpdated={refreshCategories}/>
                        : (
                            <TableRow key={category.id}>
                                <TableCell>{category.name}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end">
                                        <Button variant="ghost" size="icon" onClick={() => setEditingCategoryId(category.id)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <CategoryDeleteAction categoryId={category.id} onDeleted={refreshCategories} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    ))}
                </TableBody>
            </Table>
            <CategoryAddRow onActionComplete={refreshCategories} />
        </div>
    </div>
  );
}
