'use client';

import React, { useState, useRef, useEffect, useTransition, useMemo } from 'react';
import { EmailTemplate } from '@/lib/data';
import { addEmailTemplateDbAction, updateEmailTemplateDbAction, deleteEmailTemplateDbAction } from '@/lib/actions';
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
import { PlusCircle, Pencil, Trash2, Loader2, Mail, Info, Copy, BookOpen, Save } from 'lucide-react';
import useWindowSize from '@/hooks/use-window-size';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { useToast } from './ui/use-toast';
import { useTranslation } from '@/i18n/useTranslation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useAuth } from './auth-provider';
import { EMAIL_TEMPLATES } from '@/lib/templates-library';
import { cn } from '@/lib/utils';

const initialState = { success: false, message: '' };

const basePlaceholderList = [
    { code: "{{inquilino.nombre}}", labelKey: "common.placeholders_labels.tenant_name" },
    { code: "{{inquilino.dni}}", labelKey: "common.placeholders_labels.tenant_id" },
    { code: "{{inquilino.direccion}}", labelKey: "common.placeholders_labels.tenant_address" },
    { code: "{{propiedad.nombre}}", labelKey: "common.placeholders_labels.property_name" },
    { code: "{{propiedad.direccion}}", labelKey: "common.placeholders_labels.property_address" },
    { code: "{{propietario.nombre}}", labelKey: "common.placeholders_labels.owner_name" },
    { code: "{{propietario.dni}}", labelKey: "common.placeholders_labels.owner_id" },
    { code: "{{fechaCheckIn}}", labelKey: "common.placeholders_labels.checkin_date" },
    { code: "{{fechaCheckOut}}", labelKey: "common.placeholders_labels.checkout_date" },
    { code: "{{montoReserva}}", labelKey: "common.placeholders_labels.booking_amount" },
    { code: "{{moneda}}", labelKey: "common.placeholders_labels.currency_code" },
    { code: "{{monedaNombre}}", labelKey: "common.placeholders_labels.currency_name" },
    { code: "{{saldoReserva}}", labelKey: "common.placeholders_labels.booking_balance" },
    { code: "{{montoEnLetras}}", labelKey: "common.placeholders_labels.amount_words" },
    { code: "{{montoGarantia}}", labelKey: "common.placeholders_labels.guarantee_amount" },
    { code: "{{montoGarantiaEnLetras}}", labelKey: "common.placeholders_labels.guarantee_amount_words" },
    { code: "{{monedaGarantia}}", labelKey: "common.placeholders_labels.guarantee_currency" },
    { code: "{{monedaGarantiaNombre}}", labelKey: "common.placeholders_labels.guarantee_currency_name" },
    { code: "{{montoPago}}", labelKey: "common.placeholders_labels.payment_amount" },
    { code: "{{fechaPago}}", labelKey: "common.placeholders_labels.payment_date" },
    { code: "{{fechaActual}}", labelKey: "common.placeholders_labels.current_date" },
    { code: "{{fechaGarantiaRecibida}}", labelKey: "common.placeholders_labels.guarantee_received_date" },
    { code: "{{fechaGarantiaDevuelta}}", labelKey: "common.placeholders_labels.guarantee_returned_date" }
];

const PlaceholderButton = ({ code, label }: { code: string; label: string }) => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const copyToClipboard = () => {
        navigator.clipboard.writeText(code);
        toast({ title: t('common.success'), description: `${label} (${code}) ${t('common.copy_link_success').toLowerCase()}` });
    };
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        onClick={copyToClipboard}
                        className="text-left px-2 py-0.5 rounded bg-background hover:bg-muted-foreground/20 transition-colors border border-input hover:border-primary/20 truncate text-[10px]"
                    >
                        {label}
                    </button>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="font-mono text-xs">{code}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

function SubmitButton({ isPending, text, pendingText }: { isPending: boolean, text: string, pendingText: string }) {
    return (
        <Button type="submit" disabled={isPending} className="font-bold uppercase text-[10px] tracking-widest h-11 px-8 shadow-lg">
            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {pendingText}</> : text}
        </Button>
    );
}

function DeleteTemplateDialog({ templateId, onActionComplete }: { templateId: string, onActionComplete: () => void }) {
    const { t } = useTranslation();
    const [state, setState] = useState(initialState);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            const result = await deleteEmailTemplateDbAction(initialState, formData);
            setState(result);
        });
    }

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
                <form onSubmit={handleSubmit}>
                    <input type="hidden" name="id" value={templateId} />
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('common.confirm_delete.title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('settings.templates.delete_confirm')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className='mt-4'>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button type="submit" variant="destructive" disabled={isPending}>
                                {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('common.loading')}</> : t('common.confirm_delete.confirm')}
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
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
  const { t } = useTranslation();
  const { appUser, orgId } = useAuth();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const action = template ? updateEmailTemplateDbAction : addEmailTemplateDbAction;
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  
  const isPersonalFlavor = appUser?.appFlavor === 'personal';

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
        setState(initialState);
    }
  }, [template, isOpen]);


  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
      onActionComplete();
    }
  }, [state, setIsOpen, onActionComplete]);
  
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
        const result = await action(initialState, formData);
        setState(result);
    });
  };

  const handleCopyBody = () => {
    navigator.clipboard.writeText(body);
    toast({ title: t('common.success'), description: "Cuerpo del mensaje copiado." });
  };

  const placeholders = useMemo(() => {
    if (!isPersonalFlavor) return basePlaceholderList;
    
    const personalExtras = [];
    for (let i = 1; i <= 6; i++) {
        personalExtras.push({ code: `{{propiedad.customField${i}Label}}`, label: `Etiqueta ${i}` });
        personalExtras.push({ code: `{{propiedad.customField${i}Value}}`, label: `Valor ${i}` });
    }
    
    return [...basePlaceholderList, ...personalExtras.map(p => ({ code: p.code, labelKey: '', label: p.label }))];
  }, [isPersonalFlavor]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {template ? (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="font-bold">
            <PlusCircle className="mr-2 h-4 w-4" /> {t('settings.templates.new_button')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-2xl p-0 overflow-hidden rounded-3xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="bg-muted/30"
        >
          {template && <input type="hidden" name="id" value={template.id} />}
          <input type="hidden" name="orgId" value={orgId || ''} />
          <DialogHeader className="p-6 bg-background border-b">
            <DialogTitle>{template ? t('settings.templates.edit_title') : t('settings.templates.add_title')}</DialogTitle>
            <DialogDescription>
              {t('settings.templates.desc')}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 max-h-[60vh] overflow-y-auto shadow-inner border-y border-muted-foreground/10 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('settings.templates.name_label')}</Label>
              <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Confirmación de Reserva" required className="h-11 bg-background shadow-sm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('settings.templates.subject_label')}</Label>
              <Input id="subject" name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ej: Tu reserva en {{propiedad.nombre}}" required className="h-11 bg-background shadow-sm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('settings.templates.body_label')}</Label>
              <div className="relative group">
                <Textarea id="body" name="body" value={body} onChange={(e) => setBody(e.target.value)} className="h-40 font-sans text-sm pr-10 bg-background leading-relaxed shadow-inner" placeholder="Escribe el contenido aquí..." required />
                <Button 
                    type="button" 
                    size="icon" 
                    variant="ghost" 
                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 hover:bg-background shadow-sm"
                    onClick={handleCopyBody}
                >
                    <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-4 rounded-2xl bg-background border shadow-sm space-y-3">
                <h5 className="text-[10px] font-black uppercase flex items-center gap-2 text-primary tracking-widest">
                    <Info className="h-3 w-3" />
                    {t('settings.templates.placeholders_help')}
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                    {placeholders.map(p => (
                        <PlaceholderButton 
                            key={p.code} 
                            code={p.code} 
                            label={p.labelKey ? t(p.labelKey) : (p as any).label} 
                        />
                    ))}
                </div>
            </div>
          </div>
          <DialogFooter className="p-6 bg-background border-t">
            <DialogClose asChild><Button type="button" variant="outline" className="font-bold uppercase text-[10px] tracking-widest h-11">{t('common.cancel')}</Button></DialogClose>
            <SubmitButton isPending={isPending} text={template ? t('common.save') : t('settings.templates.new_button')} pendingText={t('common.loading')} />
          </DialogFooter>
          {state.message && !state.success && <p className="text-red-500 text-sm mt-2 px-6 pb-6">{state.message}</p>}
        </form>
      </DialogContent>
    </Dialog>
  );
}


export default function EmailTemplateManager({ initialTemplates, onTemplatesChanged }: { initialTemplates: EmailTemplate[], onTemplatesChanged: () => void }) {
    const { t } = useTranslation();
    const { orgId } = useAuth();
    const { toast } = useToast();
    const [templates, setTemplates] = useState(initialTemplates);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editTemplate, setEditTemplate] = useState<EmailTemplate | undefined>(undefined);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isPendingExamples, startExampleTransition] = useTransition();
    const { width } = useWindowSize();
    const isMobile = typeof width === 'number' ? width < 768 : false;


    const refreshTemplates = () => {
        onTemplatesChanged();
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

    const handleLoadExamples = () => {
        if (!orgId) return;
        startExampleTransition(async () => {
            let count = 0;
            for (const tmpl of EMAIL_TEMPLATES) {
                const fd = new FormData();
                fd.append('orgId', orgId);
                fd.append('name', tmpl.name);
                fd.append('subject', tmpl.subject);
                fd.append('body', tmpl.body);
                const res = await addEmailTemplateDbAction({ success: false, message: '' }, fd);
                if (res.success) count++;
            }
            toast({ title: t('common.success'), description: `Se han cargado ${count} plantillas de ejemplo.` });
            refreshTemplates();
        });
    };

    useEffect(() => {
        setTemplates(initialTemplates);
    }, [initialTemplates]);


    return (
        <div className="w-full space-y-4">
            <div className="flex flex-col sm:flex-row justify-end gap-2">
                 <Button variant="outline" onClick={handleLoadExamples} disabled={isPendingExamples} className="font-bold border-primary/30 text-primary">
                    {isPendingExamples ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookOpen className="mr-2 h-4 w-4" />}
                    {t('common.load_example_templates')}
                 </Button>
                 <TemplateDialog isOpen={isAddDialogOpen} setIsOpen={handleAddDialogChange} onActionComplete={refreshTemplates} />
                 {editTemplate && <TemplateDialog isOpen={isEditDialogOpen} setIsOpen={handleEditDialogChange} template={editTemplate} onActionComplete={refreshTemplates} />}
            </div>

            {isMobile ? (
                 <div className="space-y-4">
                    {templates && templates.length > 0 ? (
                        templates.map((template) => (
                            <Card key={template.id} className="overflow-hidden border shadow-sm">
                                <CardHeader className="p-4 py-3 bg-primary/5">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-lg text-primary flex items-center gap-2">
                                            <Mail className="h-4 w-4" />
                                            {template.name}
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 grid gap-2 text-sm">
                                    <div className="flex flex-col space-y-1">
                                        <span className="text-muted-foreground uppercase text-[10px] font-bold">{t('settings.templates.subject_label')}</span>
                                        <p className="font-medium line-clamp-2">{template.subject}</p>
                                    </div>
                                </CardContent>
                                <CardFooter className="p-2 px-4 justify-end border-t bg-muted/30">
                                    <div className="flex items-center justify-end">
                                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(template)}><Pencil className="h-4 w-4" /></Button>
                                        <DeleteTemplateDialog templateId={template.id} onActionComplete={refreshTemplates} />
                                    </div>
                                </CardFooter>
                            </Card>
                        ))
                    ) : (
                        <Card>
                            <CardContent className="text-center text-sm text-muted-foreground p-8">
                                {t('settings.templates.no_templates')}
                            </CardContent>
                        </Card>
                    )}
                 </div>
            ) : (
                 <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('tenants.copy_format.name')}</TableHead>
                                <TableHead>{t('settings.templates.subject_label')}</TableHead>
                                <TableHead className="text-right w-[100px]">{t('common.actions')}</TableHead>
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
                                        {t('settings.templates.no_templates')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
