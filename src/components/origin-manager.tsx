'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { Origin, getOrigins } from '@/lib/data';
import { addOrigin, updateOrigin, deleteOrigin, seedOriginsAction } from '@/lib/actions';
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

function AddOriginButton({ isPending }: { isPending: boolean }) {
    return (
        <Button type="submit" size="icon" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
        </Button>
    )
}

function OriginAddRow({ onActionComplete }: { onActionComplete: () => void }) {
  const { t } = useTranslation();
  const { orgId } = useAuth();
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [color, setColor] = useState('#17628d');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
        const result = await addOrigin(initialState, formData);
        setState(result);
    });
  }

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setColor('#17628d');
      onActionComplete();
    }
  }, [state, onActionComplete]);
  
  return (
    <form onSubmit={handleSubmit} ref={formRef} className="flex items-center gap-2 p-2 border-t">
        <input type="hidden" name="orgId" value={orgId || ''} />
        <Input name="name" placeholder={t('settings.origins.new_placeholder')} className="flex-grow" required />
        <Input name="color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-10 p-1" required />
        <AddOriginButton isPending={isPending} />
    </form>
  );
}

function EditOriginButtons({ onCancel, isPending }: { onCancel: () => void, isPending: boolean }) {
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

function OriginEditRow({ origin, onCancel, onUpdated }: { origin: Origin, onCancel: () => void, onUpdated: () => void }) {
    const [state, setState] = useState(initialState);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            const result = await updateOrigin(initialState, formData);
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
            <TableCell colSpan={3}>
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={origin.id} />
                    <Input name="name" defaultValue={origin.name} className="flex-grow" required />
                    <Input name="color" type="color" defaultValue={origin.color} className="w-12 h-10 p-1" required />
                    <EditOriginButtons onCancel={onCancel} isPending={isPending} />
                </form>
            </TableCell>
        </TableRow>
    )
}

function DeleteOriginButton({ isPending }: { isPending: boolean }) {
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

function OriginDeleteAction({ originId, onDeleted }: { originId: string, onDeleted: () => void }) {
    const { t } = useTranslation();
    const [state, setState] = useState(initialState);
    const [isPending, startTransition] = useTransition();
    
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            const result = await deleteOrigin(initialState, formData);
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
                    <input type="hidden" name="id" value={originId} />
                    <AlertDialogHeader>
                    <AlertDialogTitle>{t('common.confirm_delete.title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('settings.origins.delete_confirm')}
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <DeleteOriginButton isPending={isPending} />
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    )
}


export default function OriginManager({ initialOrigins, onOriginsChanged }: { initialOrigins: Origin[], onOriginsChanged: () => void }) {
  const { t } = useTranslation();
  const { orgId, activeRole } = useAuth();
  const { toast } = useToast();
  const [origins, setOrigins] = useState(initialOrigins);
  const [editingOriginId, setEditingOriginId] = useState<string | null>(null);
  const [isPendingSeed, startSeedTransition] = useTransition();
  const { width } = useWindowSize();
  const isMobile = typeof width === 'number' ? width < 768 : false;
  
  const refreshOrigins = async () => {
     setEditingOriginId(null);
     const updatedOrigins = await getOrigins(orgId || 'global');
     setOrigins(updatedOrigins);
     onOriginsChanged(); 
  };

  useEffect(() => {
    setOrigins(initialOrigins);
  }, [initialOrigins]);

  const handleLoadExamples = () => {
      if (!orgId) return;
      startSeedTransition(async () => {
          const result = await seedOriginsAction(orgId);
          if (result.success) {
              toast({ title: t('common.success'), description: "Orígenes de ejemplo cargados." });
              refreshOrigins();
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
            {origins.map((origin) => (
                 editingOriginId === origin.id 
                 ? (
                    <Card key={origin.id}>
                        <CardContent className="p-2">
                             <form onSubmit={(e) => {
                                 e.preventDefault();
                                 updateOrigin(initialState, new FormData(e.currentTarget)).then(refreshOrigins);
                             }} className="flex items-center gap-2">
                                <input type="hidden" name="id" value={editingOriginId} />
                                <Input name="name" defaultValue={origins.find(o => o.id === editingOriginId)?.name} className="flex-grow" required />
                                <Input name="color" type="color" defaultValue={origins.find(o => o.id === editingOriginId)?.color} className="w-12 h-10 p-1" required />
                                <EditOriginButtons onCancel={() => setEditingOriginId(null)} isPending={false} />
                            </form>
                        </CardContent>
                    </Card>
                 ) : (
                    <Card key={origin.id}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: origin.color }} />
                                <span className="font-medium">{origin.name}</span>
                            </div>
                            <div className="flex items-center">
                                <Button variant="ghost" size="icon" onClick={() => setEditingOriginId(origin.id)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <OriginDeleteAction originId={origin.id} onDeleted={refreshOrigins} />
                            </div>
                        </CardContent>
                    </Card>
                )
            ))}
            <Card>
                <CardContent className="p-2">
                    <OriginAddRow onActionComplete={refreshOrigins} />
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
                        <TableHead>{t('common.currency')}</TableHead>
                        <TableHead className="text-right w-[100px]">{t('common.actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {origins.map((origin) => (
                        editingOriginId === origin.id 
                        ? <OriginEditRow key={origin.id} origin={origin} onCancel={() => setEditingOriginId(null)} onUpdated={refreshOrigins}/>
                        : (
                            <TableRow key={origin.id}>
                                <TableCell>{origin.name}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: origin.color }} />
                                        <span>{origin.color}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end">
                                        <Button variant="ghost" size="icon" onClick={() => setEditingOriginId(origin.id)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <OriginDeleteAction originId={origin.id} onDeleted={refreshOrigins} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    ))}
                </TableBody>
            </Table>
            <OriginAddRow onActionComplete={refreshOrigins} />
        </div>
    </div>
  );
}
