'use client';

import { useState, useRef, useEffect, useActionState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PlusCircle, Trash2, Pencil, Loader2 } from 'lucide-react';
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
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';

const initialState = {
  message: '',
  success: false,
};

// --- Submit Button Component ---
function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                </>
            ) : (
                isEditing ? 'Guardar Cambios' : 'Crear Plantilla'
            )}
        </Button>
    );
};

// --- Form Dialog (for Add/Edit) ---
function TemplateFormDialog({
  template,
  trigger,
}: {
  template?: EmailTemplate;
  trigger: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const action = template ? updateEmailTemplate : addEmailTemplate;
  const [state, formAction] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
      window.location.reload();
    }
  }, [state]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
        formRef.current?.reset();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{template ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}</DialogTitle>
          <DialogDescription>
            {template ? 'Modifica los detalles de la plantilla.' : 'Define el contenido para tus comunicaciones.'}
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          {template && <input type="hidden" name="id" value={template.id} />}
          <div>
            <Label htmlFor="name">Nombre de la Plantilla</Label>
            <Input id="name" name="name" defaultValue={template?.name} placeholder="Ej: Recibo de Pago de Reserva" required />
          </div>
          <div>
            <Label htmlFor="subject">Asunto del Email</Label>
            <Input id="subject" name="subject" defaultValue={template?.subject} placeholder="Ej: Confirmación de pago para tu reserva" required />
          </div>
          <div>
            <Label htmlFor="body">Cuerpo del Email</Label>
            <Textarea id="body" name="body" defaultValue={template?.body} className="h-48" placeholder="Escribe el cuerpo del email. Usa marcadores como {{inquilino.nombre}}." required />
            <p className="text-xs text-muted-foreground mt-2">
              Marcadores disponibles: `{{'{'}}{'{'}inquilino.nombre{'}'}{'}'}`, `{{'{'}}{'{'}propiedad.nombre{'}'}{'}'}`, `{{'{'}}{'{'}fechaCheckIn{'}'}{'}'}`, `{{'{'}}{'{'}fechaCheckOut{'}'}{'}'}`, `{{'{'}}{'{'}montoReserva{'}'}{'}'}`, `{{'{'}}{'{'}saldoReserva{'}'}{'}'}`, `{{'{'}}{'{'}montoGarantia{'}'}{'}'}`, `{{'{'}}{'{'}fechaGarantiaRecibida{'}'}{'}'}`, `{{'{'}}{'{'}fechaGarantiaDevuelta{'}'}{'}'}`
            </p>
          </div>
           {state.message && !state.success && (
                <Alert variant="destructive"><AlertDescription>{state.message}</AlertDescription></Alert>
            )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <SubmitButton isEditing={!!template} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Delete Button Component ---
function DeleteButton() {
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
    );
};

// --- Delete Dialog ---
function TemplateDeleteDialog({ templateId }: { templateId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [state, formAction] = useActionState(deleteEmailTemplate, initialState);

    useEffect(() => {
        if (state.success) {
            setIsOpen(false);
            window.location.reload();
        }
    }, [state]);

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <form action={formAction}>
                    <input type="hidden" name="id" value={templateId} />
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. La plantilla será eliminada permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {state.message && !state.success && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertDescription>{state.message}</AlertDescription>
                        </Alert>
                    )}
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction asChild>
                           <DeleteButton />
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// --- Main Component ---
export default function EmailTemplateManager({ initialTemplates }: { initialTemplates: EmailTemplate[] }) {

  return (
    <div className="w-full">
      <div className="flex justify-end mb-4">
        <TemplateFormDialog
          trigger={
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Plantilla
            </Button>
          }
        />
      </div>
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
                    <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>{template.subject}</TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end">
                                <TemplateFormDialog
                                    trigger={
                                        <Button variant="ghost" size="icon">
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    }
                                    template={template}
                                />
                                <TemplateDeleteDialog templateId={template.id} />
                            </div>
                        </TableCell>
                    </TableRow>
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
      </div>
    </div>
  );
}