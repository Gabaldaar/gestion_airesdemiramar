
'use client';

import { useState, useRef, useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Origin, getOrigins } from '@/lib/data';
import { addOrigin, updateOrigin, deleteOrigin } from '@/lib/actions';
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

function AddOriginButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" size="icon" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
        </Button>
    )
}

function OriginAddRow({ onActionComplete }: { onActionComplete: () => void }) {
  const [state, formAction] = useActionState(addOrigin, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [color, setColor] = useState('#17628d');

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setColor('#17628d');
      onActionComplete();
    }
  }, [state, onActionComplete]);
  
  return (
    <form action={formAction} ref={formRef} className="flex items-center gap-2 p-2 border-t">
        <Input name="name" placeholder="Nombre del nuevo origen" className="flex-grow" required />
        <Input name="color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-10 p-1" required />
        <AddOriginButton />
    </form>
  );
}

function EditOriginButtons({ onCancel }: { onCancel: () => void }) {
    const { pending } = useFormStatus();
    return (
        <>
            <Button type="submit" variant="ghost" size="icon" disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-green-600" />}
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={onCancel} disabled={pending}>
                <X className="h-4 w-4 text-red-600" />
            </Button>
        </>
    )
}

function OriginEditRow({ origin, onCancel, onUpdated }: { origin: Origin, onCancel: () => void, onUpdated: () => void }) {
    const [state, formAction] = useActionState(updateOrigin, initialState);

    useEffect(() => {
        if (state.success) {
            onUpdated();
        }
    }, [state, onUpdated]);

    return (
         <TableRow>
            <TableCell colSpan={3}>
                <form action={formAction} onSubmit={onUpdated} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={origin.id} />
                    <Input name="name" defaultValue={origin.name} className="flex-grow" required />
                    <Input name="color" type="color" defaultValue={origin.color} className="w-12 h-10 p-1" required />
                    <EditOriginButtons onCancel={onCancel} />
                </form>
            </TableCell>
        </TableRow>
    )
}

function DeleteOriginButton() {
    const { pending } = useFormStatus();
    return (
         <Button type="submit" variant="destructive" disabled={pending}>
             {pending ? (
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

function OriginDeleteAction({ originId, onDeleted }: { originId: string, onDeleted: () => void }) {
    const [state, formAction] = useActionState(deleteOrigin, initialState);

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
                 <form action={formAction}>
                    <input type="hidden" name="id" value={originId} />
                    <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. El origen será eliminado permanentemente. Los inquilinos y reservas asociados quedarán sin origen asignado.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <DeleteOriginButton />
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    )
}


export default function OriginManager({ initialOrigins, onOriginsChanged }: { initialOrigins: Origin[], onOriginsChanged: () => void }) {
  const [origins, setOrigins] = useState(initialOrigins);
  const [editingOriginId, setEditingOriginId] = useState<string | null>(null);
  const { width } = useWindowSize();
  const isMobile = width < 768;
  
  const refreshOrigins = async () => {
     setEditingOriginId(null);
     const updatedOrigins = await getOrigins();
     setOrigins(updatedOrigins);
     onOriginsChanged(); // Notify parent
  };

  useEffect(() => {
    setOrigins(initialOrigins);
  }, [initialOrigins]);

  if (isMobile) {
    return (
        <div className="w-full max-w-md mx-auto space-y-4">
            {origins.map((origin) => (
                 editingOriginId === origin.id 
                 ? (
                    <Card key={origin.id}>
                        <CardContent className="p-2">
                             <form action={updateOrigin} onSubmit={refreshOrigins} className="flex items-center gap-2">
                                <input type="hidden" name="id" value={editingOriginId} />
                                <Input name="name" defaultValue={origins.find(o => o.id === editingOriginId)?.name} className="flex-grow" required />
                                <Input name="color" type="color" defaultValue={origins.find(o => o.id === editingOriginId)?.color} className="w-12 h-10 p-1" required />
                                <EditOriginButtons onCancel={() => setEditingOriginId(null)} />
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
