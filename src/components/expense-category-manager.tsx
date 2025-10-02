
'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { ExpenseCategory, addExpenseCategory, updateExpenseCategory, deleteExpenseCategory } from '@/lib/data';
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
import { useToast } from './ui/use-toast';

function AddCategoryButton({ isPending }: { isPending: boolean }) {
    return (
        <Button type="submit" size="icon" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
        </Button>
    )
}

function CategoryAddRow({ onCategoryAdded }: { onCategoryAdded: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newCategory: Omit<ExpenseCategory, 'id'> = { name: formData.get('name') as string };

    startTransition(async () => {
        try {
            await addExpenseCategory(newCategory);
            toast({ title: 'Éxito', description: 'Categoría añadida.' });
            formRef.current?.reset();
            onCategoryAdded();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: `No se pudo añadir la categoría: ${error.message}` });
        }
    });
  };
  
  return (
    <form onSubmit={handleSubmit} ref={formRef} className="flex items-center gap-2 p-2 border-t">
        <Input name="name" placeholder="Nombre de la nueva categoría" className="flex-grow" required />
        <AddCategoryButton isPending={isPending}/>
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
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const updatedCategory: ExpenseCategory = { id: category.id, name: formData.get('name') as string };

        startTransition(async () => {
            try {
                await updateExpenseCategory(updatedCategory);
                toast({ title: 'Éxito', description: 'Categoría actualizada.' });
                onUpdated();
            } catch(error: any) {
                toast({ variant: 'destructive', title: 'Error', description: `No se pudo actualizar: ${error.message}` });
            }
        });
    }

    return (
         <TableRow>
            <TableCell colSpan={2}>
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <Input name="name" defaultValue={category.name} className="flex-grow" required />
                    <EditCategoryButtons onCancel={onCancel} isPending={isPending} />
                </form>
            </TableCell>
        </TableRow>
    )
}

function DeleteCategoryButton({ isPending, onClick }: { isPending: boolean, onClick: () => void }) {
    return (
         <Button type="button" variant="destructive" disabled={isPending} onClick={onClick}>
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
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleDelete = () => {
        startTransition(async () => {
            try {
                await deleteExpenseCategory(categoryId);
                toast({ title: 'Éxito', description: 'Categoría eliminada.' });
                onDeleted();
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: `No se pudo eliminar: ${error.message}` });
            }
        });
    }
    
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                 <AlertDialogHeader>
                 <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                 <AlertDialogDescription>
                     Esta acción no se puede deshacer. La categoría será eliminada permanentemente. Los gastos asociados no serán eliminados, pero quedarán sin categoría.
                 </AlertDialogDescription>
                 </AlertDialogHeader>
                 <AlertDialogFooter>
                 <AlertDialogCancel>Cancelar</AlertDialogCancel>
                 <AlertDialogAction asChild>
                    <DeleteCategoryButton isPending={isPending} onClick={handleDelete} />
                 </AlertDialogAction>
                 </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}


export default function ExpenseCategoryManager({ initialCategories }: { initialCategories: ExpenseCategory[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  
  const handleCategoryAction = () => {
     setEditingCategoryId(null);
     window.location.reload();
  };

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
                        ? <CategoryEditRow key={category.id} category={category} onCancel={() => setEditingCategoryId(null)} onUpdated={handleCategoryAction}/>
                        : (
                            <TableRow key={category.id}>
                                <TableCell>{category.name}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end">
                                        <Button variant="ghost" size="icon" onClick={() => setEditingCategoryId(category.id)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <CategoryDeleteAction categoryId={category.id} onDeleted={handleCategoryAction} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    ))}
                </TableBody>
            </Table>
            <CategoryAddRow onCategoryAdded={handleCategoryAction} />
        </div>
    </div>
  );
}

    