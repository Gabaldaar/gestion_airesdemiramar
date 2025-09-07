
'use client';

import { useState, useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { EmailTemplate } from '@/lib/data';
import { addEmailTemplate, updateEmailTemplate, deleteEmailTemplate } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

const initialState = { success: false, message: '' };

// --- Action Buttons ---
function SubmitButton({ isPending, text = "Guardar" }: { isPending: boolean, text?: string }) {
    return (
        <Button type="submit" disabled={isPending}>
            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : text}
        </Button>
    )
}

function DeleteButton({ isPending }: { isPending: boolean }) {
    return (
        <Button type="submit" variant="destructive" disabled={isPending}>
            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eliminando...</> : 'Continuar'}
        </Button>
    )
}

// --- Add/Edit Dialog Component ---
function TemplateFormDialog({ template, onActionComplete }: { template?: EmailTemplate, onActionComplete: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const [state, formAction] = useActionState(template ? updateEmailTemplate : addEmailTemplate, initialState);

    useEffect(() => {
        if (state.success) {
            setIsOpen(false);
            onActionComplete();
        }
    }, [state, onActionComplete]);
    
    // Reset form when dialog closes
    useEffect(() => {
        if (!isOpen) {
            formRef.current?.reset();
        }
    }, [isOpen]);

    const triggerButton = template ? (
        <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
    ) : (
        <Button><PlusCircle className="mr-2 h-4 w-4" /> Nueva Plantilla</Button>
    );

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{triggerButton}</DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{template ? 'Editar Plantilla' : 'Añadir Nueva Plantilla'}</DialogTitle>
                    <DialogDescription>
                        Completa los detalles de la plantilla. Usa marcadores como `{{'{'}}{'{'}inquilino.nombre{'}'}{'}'}`.
                    </DialogDescription>
                </DialogHeader>
                <form action={formAction} ref={formRef}>
                    {template && <input type="hidden" name="id" value={template.id} />}
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input id="name" name="name" defaultValue={template?.name} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subject">Asunto</Label>
                            <Input id="subject" name="subject" defaultValue={template?.subject} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="body">Cuerpo del Email</Label>
                            <Textarea id="body" name="body" defaultValue={template?.body} required className="h-40" />
                        </div>
                         <p className="text-xs text-muted-foreground">
                            Marcadores: `{{'{'}}{'{'}inquilino.nombre{'}'}{'}'}`, `{{'{'}}{'{'}propiedad.nombre{'}'}{'}'}`, `{{'{'}}{'{'}fechaCheckIn{'}'}{'}'}`, `{{'{'}}{'{'}fechaCheckOut{'}'}{'}'}`, `{{'{'}}{'{'}montoReserva{'}'}{'}'}`, `{{'{'}}{'{'}saldoReserva{'}'}{'}'}`, `{{'{'}}{'{'}montoGarantia{'}'}{'}'}`
                        </p>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                        <SubmitButton isPending={false} text={template ? "Guardar Cambios" : "Añadir Plantilla"}/>
                    </DialogFooter>
                    {state.message && !state.success && <p className="text-red-500 text-sm mt-2">{state.message}</p>}
                </form>
            </DialogContent>
        </Dialog>
    );
}

// --- Delete Dialog Component ---
function DeleteTemplateDialog({ templateId, onActionComplete }: { templateId: string, onActionComplete: () => void }) {
    const [state, formAction] = useActionState(deleteEmailTemplate, initialState);

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
                            <DeleteButton isPending={false} />
                        </AlertDialogAction>
                    </AlertDialogFooter>
                    {state.message && !state.success && <p className="text-red-500 text-sm mt-2">{state.message}</p>}
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}


// --- Main Component ---
export default function EmailTemplateManager({ initialTemplates }: { initialTemplates: EmailTemplate[] }) {
    
    const handleActionComplete = () => {
        window.location.reload();
    };

    return (
        <div className="w-full space-y-4">
            <div className="flex justify-end">
                <TemplateFormDialog onActionComplete={handleActionComplete} />
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
                                            <TemplateFormDialog template={template} onActionComplete={handleActionComplete} />
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
