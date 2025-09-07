
'use client';

import { useState, useRef, useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { EmailTemplate } from '@/lib/data';
import { addEmailTemplate, updateEmailTemplate, deleteEmailTemplate } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

const initialState = {
  message: '',
  success: false,
};

// --- Action Buttons ---
function AddButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="col-span-2 md:col-span-1">
            {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Añadiendo...</> : <><PlusCircle className="mr-2 h-4 w-4" />Añadir Plantilla</>}
        </Button>
    )
}

function EditButtons({ onCancel }: { onCancel: () => void }) {
    const { pending } = useFormStatus();
    return (
        <div className="flex items-center justify-end">
            <Button type="submit" variant="ghost" size="icon" disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-green-600" />}
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={onCancel} disabled={pending}>
                <X className="h-4 w-4 text-red-600" />
            </Button>
        </div>
    )
}

function DeleteButton() {
    const { pending } = useFormStatus();
    return (
         <Button type="submit" variant="destructive" disabled={pending}>
             {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Eliminando...</> : 'Continuar'}
        </Button>
    )
}


// --- Form/Row Components ---
function AddTemplateForm() {
  const [addState, addAction] = useActionState(addEmailTemplate, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (addState.success) {
      formRef.current?.reset();
      window.location.reload();
    }
  }, [addState]);
  
  return (
    <form ref={formRef} action={addAction} className="p-4 border-t space-y-4">
        <h3 className="font-medium">Añadir Nueva Plantilla</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <Input name="name" placeholder="Nombre de la plantilla" className="md:col-span-1" required />
             <Input name="subject" placeholder="Asunto del email" className="md:col-span-3" required />
             <Textarea name="body" placeholder="Cuerpo del email. Usa marcadores como {{inquilino.nombre}}..." className="md:col-span-4" required />
        </div>
        <p className="text-xs text-muted-foreground">
            Marcadores: `{{'{'}}{'{'}inquilino.nombre{'}'}{'}'}`, `{{'{'}}{'{'}propiedad.nombre{'}'}{'}'}`, `{{'{'}}{'{'}fechaCheckIn{'}'}{'}'}`, `{{'{'}}{'{'}fechaCheckOut{'}'}{'}'}`, `{{'{'}}{'{'}montoReserva{'}'}{'}'}`, `{{'{'}}{'{'}saldoReserva{'}'}{'}'}`, `{{'{'}}{'{'}montoGarantia{'}'}{'}'}`, `{{'{'}}{'{'}fechaGarantiaRecibida{'}'}{'}'}`, `{{'{'}}{'{'}fechaGarantiaDevuelta{'}'}{'}'}`
        </p>
        <div className="flex justify-end">
            <AddButton />
        </div>
         {addState.message && !addState.success && <p className="text-red-500 text-sm">{addState.message}</p>}
    </form>
  );
}

function EditTemplateRow({ template, onCancel }: { template: EmailTemplate, onCancel: () => void }) {
    const [updateState, updateAction] = useActionState(updateEmailTemplate, initialState);

    useEffect(() => {
        if (updateState.success) {
            onCancel(); // Exit edit mode
            window.location.reload();
        }
    }, [updateState, onCancel]);

    return (
         <TableRow className="bg-muted/50">
            <TableCell colSpan={3}>
                <form action={updateAction}>
                    <input type="hidden" name="id" value={template.id} />
                    <div className="space-y-2">
                        <Input name="name" defaultValue={template.name} required />
                        <Input name="subject" defaultValue={template.subject} required />
                        <Textarea name="body" defaultValue={template.body} required />
                        <EditButtons onCancel={onCancel} />
                    </div>
                    {updateState.message && !updateState.success && <p className="text-red-500 text-sm pt-2">{updateState.message}</p>}
                </form>
            </TableCell>
        </TableRow>
    )
}

function DeleteTemplateAction({ templateId }: { templateId: string }) {
    const [deleteState, deleteAction] = useActionState(deleteEmailTemplate, initialState);

    useEffect(() => {
        if (deleteState.success) {
            window.location.reload();
        }
    }, [deleteState]);
    
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                 <form action={deleteAction}>
                    <input type="hidden" name="id" value={templateId} />
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. La plantilla será eliminada permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {deleteState.message && !deleteState.success && <p className="text-red-500 text-sm pt-2">{deleteState.message}</p>}
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <DeleteButton />
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    )
}

// --- Main Component ---
export default function EmailTemplateManager({ initialTemplates }: { initialTemplates: EmailTemplate[] }) {
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  return (
    <div className="w-full">
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Asunto</TableHead>
              <TableHead className="text-right w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialTemplates.length > 0 ? (
              initialTemplates.map((template) => (
                editingTemplateId === template.id 
                ? <EditTemplateRow key={template.id} template={template} onCancel={() => setEditingTemplateId(null)} />
                : (
                    <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>{template.subject}</TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end">
                                <Button variant="ghost" size="icon" onClick={() => setEditingTemplateId(template.id)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <DeleteTemplateAction templateId={template.id} />
                            </div>
                        </TableCell>
                    </TableRow>
                )
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-sm text-muted-foreground p-8">
                  No has creado ninguna plantilla de email todavía.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <AddTemplateForm />
      </div>
    </div>
  );
}
