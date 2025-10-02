
'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { Origin, addOrigin, updateOrigin, deleteOrigin } from '@/lib/data';
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

function AddOriginButton({ isPending }: { isPending: boolean }) {
    return (
        <Button type="submit" size="icon" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
        </Button>
    )
}

function OriginAddRow({ onActionComplete }: { onActionComplete: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [color, setColor] = useState('#17628d');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newOrigin = {
      name: formData.get('name') as string,
      color: formData.get('color') as string,
    };
    startTransition(async () => {
      try {
        await addOrigin(newOrigin);
        toast({ title: 'Éxito', description: 'Origen añadido.' });
        formRef.current?.reset();
        setColor('#17628d');
        onActionComplete();
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: `No se pudo añadir el origen: ${error.message}` });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} ref={formRef} className="flex items-center gap-2 p-2 border-t">
        <Input name="name" placeholder="Nombre del nuevo origen" className="flex-grow" required />
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
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const updatedOrigin: Origin = {
        id: origin.id,
        name: formData.get('name') as string,
        color: formData.get('color') as string,
      };

      startTransition(async () => {
        try {
          await updateOrigin(updatedOrigin);
          toast({ title: 'Éxito', description: 'Origen actualizado.' });
          onUpdated();
        } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: `No se pudo actualizar el origen: ${error.message}` });
        }
      });
    }

    return (
         <TableRow>
            <TableCell colSpan={3}>
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <Input name="name" defaultValue={origin.name} className="flex-grow" required />
                    <Input name="color" type="color" defaultValue={origin.color} className="w-12 h-10 p-1" required />
                    <EditOriginButtons onCancel={onCancel} isPending={isPending} />
                </form>
            </TableCell>
        </TableRow>
    )
}

function DeleteOriginButton({ isPending, onClick }: { isPending: boolean, onClick: () => void }) {
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

function OriginDeleteAction({ originId, onDeleted }: { originId: string, onDeleted: () => void }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    
    const handleDelete = () => {
      startTransition(async () => {
        try {
          await deleteOrigin(originId);
          toast({ title: 'Éxito', description: 'Origen eliminado.' });
          onDeleted();
        } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: `No se pudo eliminar el origen: ${error.message}` });
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
                    Esta acción no se puede deshacer. El origen será eliminado permanentemente. Los inquilinos asociados quedarán sin origen asignado.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction asChild>
                    <DeleteOriginButton isPending={isPending} onClick={handleDelete} />
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}


export default function OriginManager({ initialOrigins, onOriginsChanged }: { initialOrigins: Origin[], onOriginsChanged: () => void }) {
  const [origins, setOrigins] = useState(initialOrigins);
  const [editingOriginId, setEditingOriginId] = useState<string | null>(null);
  
  const handleOriginAction = () => {
     setEditingOriginId(null);
     onOriginsChanged();
  };

  useEffect(() => {
    setOrigins(initialOrigins);
  }, [initialOrigins]);

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
                        ? <OriginEditRow key={origin.id} origin={origin} onCancel={() => setEditingOriginId(null)} onUpdated={handleOriginAction}/>
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
                                        <OriginDeleteAction originId={origin.id} onDeleted={handleOriginAction} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    ))}
                </TableBody>
            </Table>
            <OriginAddRow onActionComplete={handleOriginAction} />
        </div>
    </div>
  );
}

    