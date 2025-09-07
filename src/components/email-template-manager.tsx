
'use client';

import React, { useState, useRef, useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { EmailTemplate, getEmailTemplates } from '@/lib/data';
import { addEmailTemplate, updateEmailTemplate, deleteEmailTemplate } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogClose
} from '@/components/ui/dialog';
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
import { PlusCircle, Pencil, Trash2, Loader2 } from 'lucide-react';

const placeholderHelpText = "Marcadores disponibles: {{inquilino.nombre}}, {{propiedad.nombre}}, {{fechaCheckIn}}, {{fechaCheckOut}}, {{montoReserva}}, {{saldoReserva}}, {{montoGarantia}}, {{montoPago}}, {{fechaPago}}, {{fechaGarantiaRecibida}}, {{fechaGarantiaDevuelta}}";

function SubmitButton({ isPending, text, pendingText }: { isPending: boolean, text: string, pendingText: string }) {
    return (
        <Button type="submit" disabled={isPending}>
            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {pendingText}</> : text}
        </Button>
    );
}

function DeleteButton({ isPending }: { isPending: boolean }) {
     return (
        <Button type="submit" variant="destructive" disabled={isPending}>
            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eliminando...</> : 'Continuar'}
        </Button>
    );
}

function TemplateDialog({
  isOpen,
  setIsOpen,
  template,
  onActionComplete,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  template?: EmailTemplate;
  onActionComplete: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const action = template ? updateEmailTemplate : addEmailTemplate;
  const [state, formAction, isPending] = useActionState(action, { success: false, message: '' });

  const [name, setName] = useState(template?.name || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [body, setBody] = useState(template?.body || '');
  
  useEffect(() => {
    if (template) {
      setName(template.name);
      setSubject(template.subject);
      setBody(template.body);
    } else {
      setName('');
      setSubject('');
      setBody('');
    }
  }, [template, isOpen]);


  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
      onActionComplete();
    }
  }, [state, setIsOpen, onActionComplete]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {template ? (
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={() => setIsOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Nueva Plantilla
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <form
          ref={formRef}
          action={formAction}
          onSubmit={(e) => {
             e.preventDefault();
             const formData = new FormData(e.currentTarget);
             if (template) {
                formData.set('id', template.id);
             }
             formAction(formData);
          }}
        >
          <DialogHeader>
            <DialogTitle>{template ? 'Editar' : 'Añadir Nueva'} Plantilla</DialogTitle>
            <DialogDescription>
              Completa los detalles. Usa los marcadores para insertar datos dinámicos.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Asunto</Label>
              <Input id="subject" name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Cuerpo del Email</Label>
              <Textarea id="body" name="body" value={body} onChange={(e) => setBody(e.target.value)} className="h-40" required />
            </div>
            <p className="text-xs text-muted-foreground">{placeholderHelpText}</p>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <SubmitButton isPending={isPending} text={template ? 'Guardar Cambios' : 'Crear Plantilla'} pendingText={template ? 'Guardando...' : 'Creando...'} />
          </DialogFooter>
          {state.message && !state.success && <p className="text-red-500 text-sm mt-2">{state.message}</p>}
        </form>
      </DialogContent>
    </Dialog>
  );
}


function DeleteTemplateDialog({ templateId, onActionComplete }: { templateId: string, onActionComplete: () => void }) {
    const [state, formAction, isPending] = useActionState(deleteEmailTemplate, { success: false, message: '' });

    useEffect(() => {
        if (state.success) {
            onActionComplete();
        }
    }, [state, onActionComplete]);

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
                    <AlertDialogFooter className='mt-4'>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <DeleteButton isPending={isPending} />
                        </AlertDialogAction>
                    </AlertDialogFooter>
                    {state.message && !state.success && <p className="text-red-500 text-sm mt-2">{state.message}</p>}
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default function EmailTemplateManager({ initialTemplates }: { initialTemplates: EmailTemplate[] }) {
    const [templates, setTemplates] = useState(initialTemplates);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editTemplate, setEditTemplate] = useState<EmailTemplate | undefined>(undefined);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);


    const refreshTemplates = async () => {
        const updatedTemplates = await getEmailTemplates();
        setTemplates(updatedTemplates);
    };

    const handleEditClick = (template: EmailTemplate) => {
        setEditTemplate(template);
        setIsEditDialogOpen(true);
    }

    return (
        <div className="w-full space-y-4">
            <div className="flex justify-end">
                 <TemplateDialog isOpen={isAddDialogOpen} setIsOpen={setIsAddDialogOpen} onActionComplete={refreshTemplates} />
                 {editTemplate && <TemplateDialog isOpen={isEditDialogOpen} setIsOpen={setIsEditDialogOpen} template={editTemplate} onActionComplete={refreshTemplates} />}
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
                        {templates && templates.length > 0 ? (
                            templates.map((template) => (
                                <TableRow key={template.id}>
                                    <TableCell className="font-medium">{template.name}</TableCell>
                                    <TableCell>{template.subject}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(template)}><Pencil className="h-4 w-4" /></Button>
                                            <DeleteTemplateDialog templateId={template.id} onActionComplete={refreshTemplates} />
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

    