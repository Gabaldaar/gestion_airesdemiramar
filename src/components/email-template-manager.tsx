
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PlusCircle, Save, Trash2, Pencil, Loader2 } from 'lucide-react';
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

const initialState = {
  message: '',
  success: false,
};

function TemplateDialog({
  trigger,
  title,
  description,
  template,
  action,
  buttonText
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  template?: EmailTemplate;
  action: (state: any, formData: FormData) => Promise<any>;
  buttonText: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(action, initialState);

  useEffect(() => {
    if (state?.success) {
      setIsOpen(false);
      formRef.current?.reset();
    }
  }, [state, isOpen]);
  
  function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                </>
            ) : (
                buttonText
            )}
        </Button>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef} className="space-y-4">
          <input type="hidden" name="id" value={template?.id} />
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <SubmitButton />
          </DialogFooter>
          {state?.message && !state?.success && <p className="text-sm text-red-500">{state.message}</p>}
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteTemplateButton() {
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

function TemplateDeleteAction({ templateId }: { templateId: string }) {
    const [state, formAction] = useActionState(deleteEmailTemplate, initialState);
    
    return (
        <AlertDialog>
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
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <DeleteTemplateButton />
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    )
}


export default function EmailTemplateManager({ initialTemplates }: { initialTemplates: EmailTemplate[] }) {
  
  return (
    <div className="w-full">
        <div className="flex justify-end mb-4">
            <TemplateDialog
                trigger={
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nueva Plantilla
                    </Button>
                }
                title="Crear Nueva Plantilla de Email"
                description="Define el contenido para tus comunicaciones."
                action={addEmailTemplate}
                buttonText="Crear Plantilla"
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
                    {initialTemplates.map((template) => (
                        <TableRow key={template.id}>
                            <TableCell className="font-medium">{template.name}</TableCell>
                            <TableCell>{template.subject}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end">
                                     <TemplateDialog
                                        trigger={
                                            <Button variant="ghost" size="icon">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        }
                                        title="Editar Plantilla de Email"
                                        description="Modifica el contenido de la plantilla."
                                        template={template}
                                        action={updateEmailTemplate}
                                        buttonText="Guardar Cambios"
                                    />
                                    <TemplateDeleteAction templateId={template.id} />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
             {initialTemplates.length === 0 && (
                <p className="text-center text-sm text-muted-foreground p-8">No has creado ninguna plantilla de email todavía.</p>
            )}
        </div>
    </div>
  );
}
