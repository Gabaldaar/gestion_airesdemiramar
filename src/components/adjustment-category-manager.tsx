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
import { useTranslation } from '@/i18n/useTranslation';
import { useAuth } from './auth-provider';

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
  const { t } = useTranslation();
  const { orgId } = useAuth();
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
      toast({ title: state.success ? t('common.success') : t('common.error'), description: state.message, variant: state.success ? "default" : "destructive" });
    }
    if (state.success) {
      formRef.current?.reset();
      onActionComplete();
    }
  }, [state, onActionComplete, toast, t]);
  
  return (
    <form onSubmit={handleSubmit} ref={formRef} className="flex items-center gap-2 p-2 border-t">
        <input type="hidden" name="orgId" value={orgId || ''} />
        <Input name="name" placeholder={t('settings.categories.new_placeholder')} className="flex-grow" required />
        <Select name="type" defaultValue='addition' required>
            <SelectTrigger className='w-[150px]'><SelectValue /></SelectTrigger>
            <SelectContent>
                <SelectItem value="addition">{t('liquidations.adjustment_types.addition')}</SelectItem>
                <SelectItem value="deduction">{t('liquidations.adjustment_types.deduction')}</SelectItem>
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
    const { t } = useTranslation();
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
          toast({ title: state.success ? t('common.success') : t('common.error'), description: state.message, variant: state.success ? "default" : "destructive" });
        }
        if (state.success) {
            onUpdated();
        }
    }, [state, onUpdated, toast, t]);

    return (
         <TableRow>
            <TableCell colSpan={3}>
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={category.id} />
                    <Input name="name" defaultValue={category.name} className="flex-grow" required />
                    <Select name="type" defaultValue={category.type} required>
                        <SelectTrigger className='w-[150px]'><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="addition">{t('liquidations.adjustment_types.addition')}</SelectItem>
                            <SelectItem value="deduction">{t('liquidations.adjustment_types.deduction')}</SelectItem>
                        </SelectContent>
                    </Select>
                    <EditButtons onCancel={onCancel} isPending={isPending} />
                </form>
            </TableCell>
        </TableRow>
    )
}

function DeleteButton({ isPending }: { isPending: boolean }) {
    const { t } = useTranslation();
    return (
         <Button type="submit" variant="destructive" disabled={isPending}>
             {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('common.loading')}</> : t('common.confirm_delete.confirm')}
        </Button>
    )
}

function CategoryDeleteAction({ categoryId, onDeleted }: { categoryId: string, onDeleted: () => void }) {
    const { t } = useTranslation();
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
            toast({ title: state.success ? t('common.success') : t('common.error'), description: state.message, variant: state.success ? "default" : "destructive" });
        }
        if (state.success) {
            onDeleted();
        }
    }, [state, onDeleted, toast, t]);
    
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
                        {t('settings.categories.adjustments_delete_confirm')}
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
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
  const { t } = useTranslation();
  const [categories, setCategories] = useState(initialCategories);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const { width } = useWindowSize();
  const isMobile = typeof width === 'number' ? width < 768 : false;
  
  const refreshCategories = () => {
      setEditingCategoryId(null);
      onCategoriesChanged();
  };
  
  useEffect(() => {
      setCategories(initialCategories);
  }, [initialCategories]);

  const typeLabels = {
    addition: t('liquidations.adjustment_types.addition'),
    deduction: t('liquidations.adjustment_types.deduction'),
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
                                    <SelectItem value="addition">{t('liquidations.adjustment_types.addition')}</SelectItem>
                                    <SelectItem value="deduction">{t('liquidations.adjustment_types.deduction')}</SelectItem>
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
                        <TableHead>{t('tenants.copy_format.name')}</TableHead>
                        <TableHead>{t('expenses.filters.type')}</TableHead>
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
