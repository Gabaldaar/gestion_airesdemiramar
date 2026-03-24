

'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { TaskScope, getTaskScopes } from '@/lib/data';
import { addTaskScope, updateTaskScope, deleteTaskScope } from '@/lib/actions';
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
import { useToast } from './ui/use-toast';

const initialState = {
  message: '',
  success: false,
};

function AddScopeButton({ isPending }: { isPending: boolean }) {
    return (
        <Button type="submit" size="icon" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
        </Button>
    )
}

function ScopeAddRow({ onActionComplete }: { onActionComplete: () => void }) {
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [color, setColor] = useState('#17628d');
  const { toast } = useToast();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
        const result = await addTaskScope(initialState, formData);
        setState(result);
    });
  }

  useEffect(() => {
    if (state.message) {
        toast({ title: state.success ? "Éxito" : "Error", description: state.message, variant: state.success ? "default" : "destructive" });
    }
    if (state.success) {
      formRef.current?.reset();
      setColor('#17628d');
      onActionComplete();
    }
  }, [state, onActionComplete, toast]);
  
  return (
    <form onSubmit={handleSubmit} ref={formRef} className="flex items-center gap-2 p-2 border-t">
        <Input name="name" placeholder="Nombre del nuevo ámbito" className="flex-grow" required />
        <Input name="color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-10 p-1" required />
        <AddScopeButton isPending={isPending} />
    </form>
  );
}

function EditScopeButtons({ onCancel, isPending }: { onCancel: () => void, isPending: boolean }) {
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

function ScopeEditRow({ scope, onCancel, onUpdated }: { scope: TaskScope, onCancel: () => void, onUpdated: () => void }) {
    const [state, setState] = useState(initialState);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            const result = await updateTaskScope(initialState, formData);
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
                    <input type="hidden" name="id" value={scope.id} />
                    <Input name="name" defaultValue={scope.name} className="flex-grow" required />
                    <Input name="color" type="color" defaultValue={scope.color} className="w-12 h-10 p-1" required />
                    <EditScopeButtons onCancel={onCancel} isPending={isPending} />
                </form>
            </TableCell>
        </TableRow>
    )
}

function DeleteScopeButton({ isPending }: { isPending: boolean }) {
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

function ScopeDeleteAction({ scopeId, onDeleted }: { scopeId: string, onDeleted: () => void }) {
    const [state, setState] = useState(initialState);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            const result = await deleteTaskScope(initialState, formData);
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
                    <input type="hidden" name="id" value={scopeId} />
                    <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. El ámbito será eliminado permanentemente. No se puede eliminar si está siendo utilizado por alguna tarea.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <DeleteScopeButton isPending={isPending} />
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    )
}


export default function TaskScopeManager({ initialScopes, onScopesChanged }: { initialScopes: TaskScope[], onScopesChanged: () => void }) {
  const [scopes, setScopes] = useState(initialScopes);
  const [editingScopeId, setEditingScopeId] = useState<string | null>(null);
  const { width } = useWindowSize();
  const isMobile = width < 768;
  
  const refreshScopes = async () => {
     setEditingScopeId(null);
     const updatedScopes = await getTaskScopes();
     setScopes(updatedScopes);
     onScopesChanged(); // Notify parent
  };

  useEffect(() => {
    setScopes(initialScopes);
  }, [initialScopes]);

  if (isMobile) {
    return (
        <div className="w-full mx-auto space-y-4">
            {scopes.map((scope) => (
                 editingScopeId === scope.id 
                 ? (
                    <Card key={scope.id}>
                        <CardContent className="p-2">
                             <form onSubmit={(e) => {
                                 e.preventDefault();
                                 updateTaskScope(initialState, new FormData(e.currentTarget)).then(refreshScopes);
                             }} className="flex items-center gap-2">
                                <input type="hidden" name="id" value={editingScopeId} />
                                <Input name="name" defaultValue={scopes.find(o => o.id === editingScopeId)?.name} className="flex-grow" required />
                                <Input name="color" type="color" defaultValue={scopes.find(o => o.id === editingScopeId)?.color} className="w-12 h-10 p-1" required />
                                <EditScopeButtons onCancel={() => setEditingScopeId(null)} isPending={false} />
                            </form>
                        </CardContent>
                    </Card>
                 ) : (
                    <Card key={scope.id}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: scope.color }} />
                                <span className="font-medium">{scope.name}</span>
                            </div>
                            <div className="flex items-center">
                                <Button variant="ghost" size="icon" onClick={() => setEditingScopeId(scope.id)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <ScopeDeleteAction scopeId={scope.id} onDeleted={refreshScopes} />
                            </div>
                        </CardContent>
                    </Card>
                )
            ))}
            <Card>
                <CardContent className="p-2">
                    <ScopeAddRow onActionComplete={refreshScopes} />
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
                        <TableHead>Color</TableHead>
                        <TableHead className="text-right w-[100px]">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {scopes.map((scope) => (
                        editingScopeId === scope.id 
                        ? <ScopeEditRow key={scope.id} scope={scope} onCancel={() => setEditingScopeId(null)} onUpdated={refreshScopes}/>
                        : (
                            <TableRow key={scope.id}>
                                <TableCell>{scope.name}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: scope.color }} />
                                        <span>{scope.color}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end">
                                        <Button variant="ghost" size="icon" onClick={() => setEditingScopeId(scope.id)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <ScopeDeleteAction scopeId={scope.id} onDeleted={refreshScopes} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    ))}
                </TableBody>
            </Table>
            <ScopeAddRow onActionComplete={refreshScopes} />
        </div>
    </div>
  );
}
