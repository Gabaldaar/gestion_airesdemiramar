
'use client';

import React, { useState, useRef, useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { EmailTemplate } from '@/lib/data';
import { addEmailTemplate, updateEmailTemplate, deleteEmailTemplate } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useQuill } from 'react-quilljs';
import 'quill/dist/quill.snow.css';


const placeholderHelpText = "Marcadores: {{inquilino.nombre}}, {{propiedad.nombre}}, {{fechaCheckIn}}, {{fechaCheckOut}}, {{montoReserva}}, {{saldoReserva}}, {{montoGarantia}}, {{montoPago}}, {{fechaPago}}, {{fechaGarantiaRecibida}}, {{fechaGarantiaDevuelta}}";

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

const Editor = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const { quill, quillRef } = useQuill({
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                ['link', 'clean']
            ]
        },
        placeholder: 'Escribe el cuerpo del email aquí...'
    });

    useEffect(() => {
        if (quill) {
            // Set initial content when quill is ready
            if (value && quill.root.innerHTML !== value) {
                const delta = quill.clipboard.convert(value);
                quill.setContents(delta, 'silent');
            }
            
            const handleChange = (delta: any, oldDelta: any, source: string) => {
                 if (source === 'user') {
                    onChange(quill.root.innerHTML);
                }
            };
            quill.on('text-change', handleChange);

            return () => {
                quill.off('text-change', handleChange);
            };
        }
    }, [quill, value, onChange]);

    return (
        <div className='bg-white text-black'>
            <div ref={quillRef} style={{ minHeight: '200px' }} />
        </div>
    );
}


function AddTemplateDialog({ onActionComplete }: { onActionComplete: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const [body, setBody] = useState('');
    const [state, formAction, isPending] = useActionState(addEmailTemplate, { success: false, message: '' });

    useEffect(() => {
        if (state.success) {
            setIsOpen(false);
            onActionComplete();
        }
    }, [state, onActionComplete]);
    
    useEffect(() => {
        if (!isOpen) {
            formRef.current?.reset();
            setBody('');
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4" /> Nueva Plantilla</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                <form 
                    ref={formRef} 
                    action={(formData) => {
                        formData.set('body', body);
                        formAction(formData);
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Añadir Nueva Plantilla</DialogTitle>
                        <DialogDescription>
                            Completa los detalles de la plantilla. Usa el editor para dar formato y los marcadores para insertar datos dinámicos.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input id="name" name="name" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subject">Asunto</Label>
                            <Input id="subject" name="subject" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="body">Cuerpo del Email</Label>
                            <Editor value={body} onChange={setBody} />
                        </div>
                         <p className="text-xs text-muted-foreground">{placeholderHelpText}</p>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                        <SubmitButton isPending={isPending} text="Crear Plantilla" pendingText="Creando..." />
                    </DialogFooter>
                    {state.message && !state.success && <p className="text-red-500 text-sm mt-2">{state.message}</p>}
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditTemplateDialog({ template, onActionComplete }: { template: EmailTemplate, onActionComplete: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const [body, setBody] = useState('');
    const [state, formAction, isPending] = useActionState(updateEmailTemplate, { success: false, message: '' });

    useEffect(() => {
        if (state.success) {
            setIsOpen(false);
            onActionComplete();
        }
    }, [state, onActionComplete]);
    
    useEffect(() => {
        if (isOpen) {
            setBody(template.body);
        }
    }, [isOpen, template.body]);

    return (
         <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                <form 
                    ref={formRef} 
                    action={(formData) => {
                        formData.set('body', body);
                        formAction(formData);
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Editar Plantilla</DialogTitle>
                         <DialogDescription>
                            Modifica los detalles de la plantilla.
                        </DialogDescription>
                    </DialogHeader>
                    <input type="hidden" name="id" value={template.id} />
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input id="name" name="name" defaultValue={template.name} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subject">Asunto</Label>
                            <Input id="subject" name="subject" defaultValue={template.subject} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="body">Cuerpo del Email</Label>
                             <Editor value={body} onChange={setBody} />
                        </div>
                         <p className="text-xs text-muted-foreground">{placeholderHelpText}</p>
                    </div>
                    <DialogFooter>
                         <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                         <SubmitButton isPending={isPending} text="Guardar Cambios" pendingText="Guardando..." />
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
    const handleActionComplete = () => {
        window.location.reload();
    };

    return (
        <div className="w-full space-y-4">
            <div className="flex justify-end">
                <AddTemplateDialog onActionComplete={handleActionComplete} />
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
                        {initialTemplates && initialTemplates.length > 0 ? (
                            initialTemplates.map((template) => (
                                <TableRow key={template.id}>
                                    <TableCell className="font-medium">{template.name}</TableCell>
                                    <TableCell>{template.subject}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end">
                                            <EditTemplateDialog template={template} onActionComplete={handleActionComplete} />
                                            <DeleteTemplateDialog templateId={template.id} onActionComplete={handleActionComplete} />
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
