
'use client';

import { useState, useRef } from 'react';
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

// --- Form Dialog for Add/Edit ---
function TemplateFormDialog({
  trigger,
  title,
  description,
  template,
  onSuccess,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  template?: EmailTemplate;
  onSuccess: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsPending(true);
    const formData = new FormData(event.currentTarget);
    
    const action = template ? updateEmailTemplate : addEmailTemplate;
    const result = await action(initialState, formData);

    setIsPending(false);
    if (result.success) {
      setIsOpen(false);
      onSuccess();
    } else {
      setError(result.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
                {isPending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                    </>
                ) : (
                    template ? 'Guardar Cambios' : 'Crear Plantilla'
                )}
            </Button>
          </DialogFooter>
          {error && <Alert variant="destructive" className="mt-4"><AlertDescription>{error}</AlertDescription></Alert>}
        </form>
      </DialogContent>
    </Dialog>
  );
}


// --- Delete Dialog ---
function TemplateDeleteDialog({ templateId, onSuccess }: { templateId: string, onSuccess: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        setError(null);
        setIsPending(true);
        const formData = new FormData();
        formData.append('id', templateId);
        
        const result = await deleteEmailTemplate(initialState, formData);
        setIsPending(false);
        if (result.success) {
            setIsOpen(false);
            onSuccess();
        } else {
            setError(result.message);
        }
    };
    
    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. La plantilla será eliminada permanentemente.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                        {isPending ? (
                             <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Eliminando...
                            </>
                        ) : 'Continuar'}
                    </Button>
                </AlertDialogFooter>
                 {error && <Alert variant="destructive" className="mt-4"><AlertDescription>{error}</AlertDescription></Alert>}
            </AlertDialogContent>
        </AlertDialog>
    );
}

// --- Main Component ---
export default function EmailTemplateManager({ initialTemplates }: { initialTemplates: EmailTemplate[] }) {
  const handleActionComplete = () => {
    // A page reload is simpler and ensures all server data is fresh.
    window.location.reload();
  };

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
                title="Crear Nueva Plantilla de Email"
                description="Define el contenido para tus comunicaciones."
                onSuccess={handleActionComplete}
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
                                     <TemplateFormDialog
                                        trigger={
                                            <Button variant="ghost" size="icon">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        }
                                        title="Editar Plantilla de Email"
                                        description="Modifica el contenido de la plantilla."
                                        template={template}
                                        onSuccess={handleActionComplete}
                                    />
                                    <TemplateDeleteDialog templateId={template.id} onSuccess={handleActionComplete} />
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
