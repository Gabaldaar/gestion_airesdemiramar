

'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { AdjustmentCategory } from '@/lib/data';
import { addAdjustmentCategory, updateAdjustmentCategory, deleteAdjustmentCategory } from '@/lib/actions';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from './ui/use-toast';

const initialState = {
  message: '',
  success: false,
};

function AddButton({ isPending }: { isPending: boolean }) {
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
  const { toast } = useToast();
  
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
        const result = await addAdjustmentCategory(initialState, formData);
        setState(result);
    });
  }

  useEffect(() => {
    if (state.message) {
      toast({ title: state.success ? "Éxito" : "Error", description: state.message, variant: state.success ? "default" : "destructive" });
    }
    if (state.success) {
      formRef.current?.reset();
      onActionComplete();
    }
  }, [state, onActionComplete, toast]);
  
  return (
    <form onSubmit={handleSubmit} ref={formRef} className="flex items-center gap-2 p-2 border-t">
        <Input name="name" placeholder="Nombre de la nueva categoría" className="flex-grow" required />
        <Select name="type" defaultValue='addition' required>
            <SelectTrigger className='w-[150px]'><SelectValue /></SelectTrigger>
            <SelectContent>
                <SelectItem value="addition">Adición</SelectItem>
                <SelectItem value="deduction">Deducción</SelectItem>
            </SelectContent>
        </Select>
        <AddButton isPending={isPending} />
    </form>
  );
}

function EditButtons({ onCancel, isPending }: { onCancel: () => void, isPending: boolean }) {
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

function CategoryEditRow({ category, onCancel, onUpdated }: { category: AdjustmentCategory, onCancel: () => void, onUpdated: () => void }) {
    const [state, setState] = useState(initialState);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            const result = await updateAdjustmentCategory(initialState, formData);
            setState(result);
        });
    }

    useEffect(() => {
        if (state.message) {
          toast({ title: state.success ? "Éxito" : "Error", description: state.message, variant: state.success ? "default" : "destructive" });
        }
        if (state.success) {
            onUpdated();
        }
    }, [state, onUpdated, toast]);

    return (
         <TableRow>
            <TableCell colSpan={3}>
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={category.id} />
                    <Input name="name" defaultValue={category.name} className="flex-grow" required />
                    <Select name="type" defaultValue={category.type} required>
                        <SelectTrigger className='w-[150px]'><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="addition">Adición</SelectItem>
                            <SelectItem value="deduction">Deducción</SelectItem>
                        </SelectContent>
                    </Select>
                    <EditButtons onCancel={onCancel} isPending={isPending} />
                </form>
            </TableCell>
        </TableRow>
    )
}

function DeleteButton({ isPending }: { isPending: boolean }) {
    return (
         <Button type="submit" variant="destructive" disabled={isPending}>
             {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eliminando...</> : 'Continuar'}
        </Button>
    )
}

function CategoryDeleteAction({ categoryId, onDeleted }: { categoryId: string, onDeleted: () => void }) {
    const [state, setState] = useState(initialState);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            const result = await deleteAdjustmentCategory(initialState, formData);
            setState(result);
        });
    }

    useEffect(() => {
        if (state.message) {
            toast({ title: state.success ? "Éxito" : "Error", description: state.message, variant: state.success ? "default" : "destructive" });
        }
        if (state.success) {
            onDeleted();
        }
    }, [state, onDeleted, toast]);
    
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
                        Esta acción no se puede deshacer. La categoría será eliminada permanentemente, pero solo si no está en uso.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <DeleteButton isPending={isPending} />
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    )
}


export default function AdjustmentCategoryManager({ initialCategories, onCategoriesChanged }: { initialCategories: AdjustmentCategory[], onCategoriesChanged: () => void }) {
  const [categories, setCategories] = useState(initialCategories);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const { width } = useWindowSize();
  const isMobile = width < 768;
  
  const refreshCategories = () => {
      setEditingCategoryId(null);
      onCategoriesChanged();
  };
  
  useEffect(() => {
      setCategories(initialCategories);
  }, [initialCategories]);

  const typeLabels = {
    addition: 'Adición (Suma)',
    deduction: 'Deducción (Resta)',
  }

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
                            updateAdjustmentCategory(initialState, formData).then(refreshCategories);
                        }} className="flex items-center gap-2">
                            <input type="hidden" name="id" value={editingCategoryId} />
                            <Input name="name" defaultValue={categories.find(c => c.id === editingCategoryId)?.name} className="flex-grow" required />
                            <Select name="type" defaultValue={category.type} required>
                                <SelectTrigger className='w-[150px]'><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="addition">Adición</SelectItem>
                                    <SelectItem value="deduction">Deducción</SelectItem>
                                </SelectContent>
                            </Select>
                            <EditButtons onCancel={() => setEditingCategoryId(null)} isPending={false} />
                        </form>
                    </CardContent>
                </Card>
             ) : (
                <Card key={category.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="font-medium">{category.name}</p>
                            <p className="text-sm text-muted-foreground">{typeLabels[category.type]}</p>
                        </div>
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
    <div className="w-full max-w-lg mx-auto">
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Tipo</TableHead>
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
                                <TableCell>{typeLabels[category.type]}</TableCell>
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
