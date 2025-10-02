
'use client';

import React, { useState, useRef, useEffect, useTransition } from 'react';
import { EmailTemplate, getEmailTemplates, addEmailTemplate, updateEmailTemplate, deleteEmailTemplate } from '@/lib/data';
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
import { useToast } from './ui/use-toast';

const placeholderHelpText = "Marcadores disponibles: {{inquilino.nombre}}, {{propiedad.nombre}}, {{propiedad.direccion}}, {{fechaCheckIn}}, {{fechaCheckOut}}, {{montoReserva}}, {{saldoReserva}}, {{montoGarantia}}, {{montoPago}}, {{fechaPago}}, {{fechaGarantiaRecibida}}, {{fechaGarantiaDevuelta}}, {{propiedad.customField1Label}}, {{propiedad.customField1Value}} ...hasta el 6";

function SubmitButton({ isPending, text, pendingText }: { isPending: boolean, text: string, pendingText: string }) {
    return (
        <Button type="submit" disabled={isPending}>
            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {pendingText}</> : text}
        </Button>
    );
}

function DeleteButton({ isPending, onClick }: { isPending: boolean, onClick: () => void }) {
     return (
        <Button type="button" variant="destructive" disabled={isPending} onClick={onClick}>
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
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  
  useEffect(() => {
    if (isOpen) {
        if (template) {
            setName(template.name);
            setSubject(template.subject);
            setBody(template.body);
        } else {
            setName('');
            setSubject('');
            setBody('');
        }
    }
  }, [template, isOpen]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
        try {
            if (template) {
                const updatedTemplate: EmailTemplate = {
                    id: template.id,
                    name: formData.get('name') as string,
                    subject: formData.get('subject') as string,
                    body: formData.get('body') as string,
                };
                await updateEmailTemplate(updatedTemplate);
                toast({ title: 'Éxito', description: 'Plantilla actualizada.' });
            } else {
                 const newTemplate: Omit<EmailTemplate, 'id'> = {
                    name: formData.get('name') as string,
                    subject: formData.get('subject') as string,
                    body: formData.get('body') as string,
                };
                await addEmailTemplate(newTemplate);
                toast({ title: 'Éxito', description: 'Plantilla creada.' });
            }
            setIsOpen(false);
            onActionComplete();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: `No se pudo guardar la plantilla: ${error.message}` });
        }
    });
  };

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
        <form ref={formRef} onSubmit={handleSubmit}>
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
        </form>
      </DialogContent>
    </Dialog>
  );
}


function DeleteTemplateDialog({ templateId, onActionComplete }: { templateId: string, onActionComplete: () => void }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleDelete = () => {
        startTransition(async () => {
            try {
                await deleteEmailTemplate(templateId);
                toast({ title: 'Éxito', description: 'Plantilla eliminada.' });
                onActionComplete();
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: `No se pudo eliminar la plantilla: ${error.message}` });
            }
        });
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. La plantilla será eliminada permanentemente.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className='mt-4'>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <DeleteButton isPending={isPending} onClick={handleDelete} />
                    </AlertDialogAction>
                </AlertDialogFooter>
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
    
    const handleAddDialogChange = (open: boolean) => {
        setIsAddDialogOpen(open);
    }

    const handleEditDialogChange = (open: boolean) => {
        setIsEditDialogOpen(open);
        if (!open) {
            setEditTemplate(undefined);
        }
    }


    return (
        <div className="w-full space-y-4">
            <div className="flex justify-end">
                 <TemplateDialog isOpen={isAddDialogOpen} setIsOpen={handleAddDialogChange} onActionComplete={refreshTemplates} />
                 {editTemplate && <TemplateDialog isOpen={isEditDialogOpen} setIsOpen={handleEditDialogChange} template={editTemplate} onActionComplete={refreshTemplates} />}
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

    