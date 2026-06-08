'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { TaskCategory, getTaskCategories } from '@/lib/data';
import { addTaskCategory, updateTaskCategory, deleteTaskCategory, seedTaskCategoriesAction } from '@/lib/actions';
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
import { PlusCircle, Save, Trash2, Pencil, X, Loader2, BookOpen } from 'lucide-react';
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
import { useTranslation } from '@/i18n/useTranslation';
import { useAuth } from './auth-provider';
import { useToast } from './ui/use-toast';


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
  const { t } = useTranslation();
  const { orgId } = useAuth();
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
        const result = await addTaskCategory(initialState, formData);
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
        <input type="hidden" name="orgId" value={orgId || ''} />
        <Input name="name" placeholder={t('settings.categories.new_placeholder')} className="flex-grow" required />
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

function CategoryEditRow({ category, onCancel, onUpdated }: { category: TaskCategory, onCancel: () => void, onUpdated: () => void }) {
    const [state, setState] = useState(initialState);
    const [isPending, startTransition] = useTransition();
    
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            const result = await updateTaskCategory(initialState, formData);
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
    const { t } = useTranslation();
    return (
         <Button type="submit" variant="destructive" disabled={isPending}>
             {isPending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}
                </>
            ) : (
                t('common.confirm_delete.confirm')
            )}
        </Button>
    )
}

function CategoryDeleteAction({ categoryId, onDeleted }: { categoryId: string, onDeleted: () => void }) {
    const { t } = useTranslation();
    const [state, setState] = useState(initialState);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            const result = await deleteTaskCategory(initialState, formData);
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
                    <AlertDialogTitle>{t('common.confirm_delete.title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('settings.categories.tasks_delete_confirm')}
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <DeleteCategoryButton isPending={isPending} />
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    )
}


export default function TaskCategoryManager({ initialCategories, onCategoriesChanged }: { initialCategories: TaskCategory[], onCategoriesChanged: () => void }) {
  const { t } = useTranslation();
  const { orgId, activeRole } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState(initialCategories);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [isPendingSeed, startSeedTransition] = useTransition();
  const { width } = useWindowSize();
  const isMobile = typeof width === 'number' ? width < 768 : false;
  
  const refreshCategories = () => {
      setEditingCategoryId(null);
      onCategoriesChanged();
  };
  
  useEffect(() => {
      setCategories(initialCategories);
  }, [initialCategories]);

  const handleLoadExamples = () => {
      if (!orgId) return;
      startSeedTransition(async () => {
          const result = await seedTaskCategoriesAction(orgId);
          if (result.success) {
              toast({ title: t('common.success'), description: "Categorías de ejemplo cargadas." });
              refreshCategories();
          }
      });
  };

  const showSeedButton = activeRole === 'admin' || activeRole === 'socio';

  if (isMobile) {
    return (
      <div className="w-full mx-auto space-y-4">
        {showSeedButton && (
            <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={handleLoadExamples} disabled={isPendingSeed} className="text-xs font-bold gap-2">
                    {isPendingSeed ? <Loader2 className="h-3 w-3 animate-spin"/> : <BookOpen className="h-3 w-3"/>}
                    {t('common.load_examples')}
                </Button>
            </div>
        )}
        {categories.map((category) => (
             editingCategoryId === category.id 
             ? (
                <Card key={category.id}>
                    <CardContent className="p-2">
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            updateTaskCategory(initialState, formData).then(refreshCategories);
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
    <div className="w-full max-w-md mx-auto space-y-4">
        {showSeedButton && (
            <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={handleLoadExamples} disabled={isPendingSeed} className="text-xs font-bold gap-2">
                    {isPendingSeed ? <Loader2 className="h-3 w-3 animate-spin"/> : <BookOpen className="h-3 w-3"/>}
                    {t('common.load_examples')}
                </Button>
            </div>
        )}
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('tenants.copy_format.name')}</TableHead>
                        <TableHead className="text-right w-[100px]">{t('common.actions')}</TableHead>
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
