
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

// --- Separate Button Components ---

function FormSubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Guardando...
        </>
      ) : isEditing ? (
        'Guardar Cambios'
      ) : (
        'Crear Plantilla'
      )}
    </Button>
  );
}

function FormDeleteButton() {
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
}


// --- Main Manager Component ---

export default function EmailTemplateManager({ initialTemplates }: { initialTemplates: EmailTemplate[] }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  const [addState, addAction] = useActionState(addEmailTemplate, initialState);
  const [updateState, updateAction] = useActionState(updateEmailTemplate, initialState);
  const [deleteState, deleteAction] = useActionState(deleteEmailTemplate, initialState);
  
  const formRef = useRef<HTMLFormElement>(null);

  // Effect to handle form submission success
  useEffect(() => {
    if (addState.success || updateState.success) {
      setIsFormOpen(false);
      window.location.reload();
    }
  }, [addState, updateState]);
  
  useEffect(() => {
    if (deleteState.success) {
      setIsDeleteOpen(false);
      window.location.reload();
    }
  }, [deleteState]);

  const handleAddNew = () => {
    setSelectedTemplate(null);
    setIsFormOpen(true);
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsFormOpen(true);
  };
  
  const handleDelete = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsDeleteOpen(true);
  }

  const formAction = selectedTemplate ? updateAction : addAction;
  const formState = selectedTemplate ? updateState : addState;

  return (
    <div className="w-full">
      <div className="flex justify-end mb-4">
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva Plantilla
        </Button>
      </div>

      {/* Templates Table */}
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
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(template)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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

      {/* Add/Edit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTemplate ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}</DialogTitle>
            <DialogDescription>
              {selectedTemplate ? 'Modifica los detalles de la plantilla.' : 'Define el contenido para tus comunicaciones.'}
            </DialogDescription>
          </DialogHeader>
          <form ref={formRef} action={formAction} className="space-y-4">
            {selectedTemplate && <input type="hidden" name="id" value={selectedTemplate.id} />}
            <div>
              <Label htmlFor="name">Nombre de la Plantilla</Label>
              <Input id="name" name="name" defaultValue={selectedTemplate?.name} placeholder="Ej: Recibo de Pago de Reserva" required />
            </div>
            <div>
              <Label htmlFor="subject">Asunto del Email</Label>
              <Input id="subject" name="subject" defaultValue={selectedTemplate?.subject} placeholder="Ej: Confirmación de pago para tu reserva" required />
            </div>
            <div>
              <Label htmlFor="body">Cuerpo del Email</Label>
              <Textarea id="body" name="body" defaultValue={selectedTemplate?.body} className="h-48" placeholder="Escribe el cuerpo del email. Usa marcadores como {{inquilino.nombre}}." required />
              <p className="text-xs text-muted-foreground mt-2">
                Marcadores disponibles: `{{'{'}}{'{'}inquilino.nombre{'}'}{'}'}`, `{{'{'}}{'{'}propiedad.nombre{'}'}{'}'}`, `{{'{'}}{'{'}fechaCheckIn{'}'}{'}'}`, `{{'{'}}{'{'}fechaCheckOut{'}'}{'}'}`, `{{'{'}}{'{'}montoReserva{'}'}{'}'}`, `{{'{'}}{'{'}saldoReserva{'}'}{'}'}`, `{{'{'}}{'{'}montoGarantia{'}'}{'}'}`, `{{'{'}}{'{'}fechaGarantiaRecibida{'}'}{'}'}`, `{{'{'}}{'{'}fechaGarantiaDevuelta{'}'}{'}'}`
              </p>
            </div>
            {formState.message && !formState.success && (
              <Alert variant="destructive"><AlertDescription>{formState.message}</AlertDescription></Alert>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
              <FormSubmitButton isEditing={!!selectedTemplate} />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <form action={deleteAction}>
            <input type="hidden" name="id" value={selectedTemplate?.id || ''} />
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. La plantilla será eliminada permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {deleteState.message && !deleteState.success && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{deleteState.message}</AlertDescription>
              </Alert>
            )}
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction asChild>
                <FormDeleteButton />
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    