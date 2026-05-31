'use client';

import React, { useEffect, useRef, useState, useTransition, useMemo, useCallback } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addProperty } from '@/lib/actions';
import { PlusCircle, Loader2, Info, Copy, Upload, Home, MapPin, Wrench, AlertTriangle, ChevronRight, ChevronLeft, Save, BookOpen } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Provider, Property, TaskScope } from '@/lib/data';
import { useToast } from './ui/use-toast';
import { useTranslation } from "@/i18n/useTranslation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, doc } from 'firebase/firestore';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useAuth } from './auth-provider';
import { CONTRACT_TEMPLATES } from '@/lib/templates-library';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const initialState = {
  message: '',
  success: false,
};

function SubmitButton() {
    const { t } = useTranslation();
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full sm:w-auto font-bold uppercase tracking-widest gap-2">
            {pending ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('common.loading')}
                </>
            ) : (
                <>
                    <Save className="h-4 w-4" />
                    {t('common.save')}
                </>
            )}
        </Button>
    )
}

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
                        className="text-left px-2 py-1 rounded bg-background hover:bg-muted-foreground/20 transition-colors border border-input hover:border-primary/20 truncate text-[10px]"
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

export function PropertyAddForm({ 
    providers, 
    isPersonalFlavor,
    onPropertyAdded,
    children
}: { 
    providers: Provider[], 
    isPersonalFlavor: boolean,
    onPropertyAdded?: () => void,
    children?: React.ReactNode
}) {
  const { t } = useTranslation();
  const { orgId } = useAuth();
  const { toast } = useToast();
  
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [scopes, setScopes] = useState<TaskScope[]>([]);
  
  // Estados para validación
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contractTemplate, setContractTemplate] = useState('');
  
  const formRef = useRef<HTMLFormElement>(null);

  // ID preventivo para las subidas de archivos
  const [pendingId, setPendingId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState('');
  const [isSignatureUploading, setIsSignatureUploading] = useState(false);

  const steps = [
    { id: 'info', title: t('properties.form.sections.info'), icon: Home },
    { id: 'owner', title: t('properties.form.sections.owner'), icon: MapPin },
    { id: 'content', title: t('properties.form.sections.content'), icon: Info },
    ...(isPersonalFlavor ? [{ id: 'extra', title: t('properties.form.sections.additional'), icon: PlusCircle }] : [])
  ];

  const visitRateProviders = useMemo(() => {
    return providers.filter(p => p.billingType === 'per_visit' || p.billingType === 'hourly_or_visit');
  }, [providers]);

  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await addProperty(initialState, formData);
        setState(result);
    });
  };

  useEffect(() => {
    if (isOpen) {
        setPendingId(doc(collection(db, 'properties')).id);
        setImageUrl('');
        setSignatureUrl('');
        setContractTemplate('');
        setCurrentStep(0);
        setName('');
        setAddress('');
        setState(initialState);
        
        if (isPersonalFlavor) {
            import('@/lib/data').then(({ getTaskScopes }) => {
                const currentOrgId = orgId || 'global';
                getTaskScopes(currentOrgId).then(setScopes);
            });
        }
    }
  }, [isOpen, isPersonalFlavor, orgId]);

  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
      formRef.current?.reset();
      toast({ title: t('common.success'), description: "Propiedad creada correctamente." });
      if (onPropertyAdded) onPropertyAdded();
    }
  }, [state.success, onPropertyAdded, toast, t]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !pendingId) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: t('common.error'), description: "La imagen no debe superar 2MB.", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    const storageRef = ref(storage, `property_images/${pendingId}/main_image.jpg`);
    try {
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setImageUrl(url);
    } catch (error) {
      toast({ title: t('common.error'), description: "Error al subir imagen.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleSignatureFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !pendingId) return;
    if (file.size > 1 * 1024 * 1024) {
      toast({ title: t('common.error'), description: "La firma no debe superar 1MB.", variant: "destructive" });
      return;
    }
    setIsSignatureUploading(true);
    const storageRef = ref(storage, `property_signatures/${pendingId}/signature.png`);
    try {
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setSignatureUrl(url);
    } catch (error) {
      toast({ title: t('common.error'), description: "Error al subir firma.", variant: "destructive" });
    } finally {
      setIsSignatureUploading(false);
    }
  };

  const handleCopyContract = () => {
    navigator.clipboard.writeText(contractTemplate);
    toast({ title: t('common.success'), description: "Texto de contrato copiado." });
  };

  const loadContractTemplate = (content: string) => {
    setContractTemplate(content);
    toast({ title: "Modelo cargado", description: "Puedes editar el texto ahora." });
  };

  // Validación del paso actual
  const isCurrentStepValid = useMemo(() => {
    if (currentStep === 0) {
        return name.trim() !== '' && address.trim() !== '';
    }
    return true;
  }, [currentStep, name, address]);

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isCurrentStepValid && currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
        const modal = document.querySelector('[role="dialog"]');
        if (modal) modal.scrollTop = 0;
    }
  };

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const contractPlaceholders = [
    { code: '{{inquilino.nombre}}', labelKey: 'common.placeholders_labels.tenant_name' },
    { code: '{{inquilino.dni}}', labelKey: 'common.placeholders_labels.tenant_id' },
    { code: '{{inquilino.direccion}}', labelKey: 'common.placeholders_labels.tenant_address' },
    { code: '{{propietario.nombre}}', labelKey: 'common.placeholders_labels.owner_name' },
    { code: '{{propietario.dni}}', labelKey: 'common.placeholders_labels.owner_id' },
    { code: '{{propiedad.nombre}}', labelKey: 'common.placeholders_labels.property_name' },
    { code: '{{propiedad.direccion}}', labelKey: 'common.placeholders_labels.property_address' },
    { code: '{{fechaCheckIn}}', labelKey: 'common.placeholders_labels.checkin_date' },
    { code: '{{fechaCheckOut}}', labelKey: 'common.placeholders_labels.checkout_date' },
    { code: '{{monto}}', labelKey: 'common.placeholders_labels.booking_amount' },
    { code: '{{moneda}}', labelKey: 'common.placeholders_labels.currency_code' },
    { code: '{{monedaNombre}}', labelKey: 'common.placeholders_labels.currency_name' },
    { code: '{{montoEnLetras}}', labelKey: 'common.placeholders_labels.amount_words' },
    { code: '{{montoGarantia}}', labelKey: 'common.placeholders_labels.guarantee_amount' },
    { code: '{{montoGarantiaEnLetras}}', labelKey: 'common.placeholders_labels.guarantee_amount_words' },
    { code: '{{monedaGarantia}}', labelKey: 'common.placeholders_labels.guarantee_currency' },
    { code: '{{monedaGarantiaNombre}}', labelKey: 'common.placeholders_labels.guarantee_currency_name' },
    { code: '{{fechaActual}}', labelKey: 'common.placeholders_labels.current_date' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="font-bold uppercase tracking-widest shadow-lg hover:scale-105 transition-transform">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('properties.new_property')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-6 pb-4 bg-background border-b relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-black uppercase italic tracking-tighter text-primary flex items-center gap-2">
                {React.createElement(steps[currentStep].icon, { className: "h-5 w-5" })}
                {steps[currentStep].title}
              </DialogTitle>
              <DialogDescription>
                Paso {currentStep + 1} de {steps.length}
              </DialogDescription>
            </div>
            {/* Progress Bar */}
            <div className="flex gap-1.5">
                {steps.map((_, idx) => (
                    <div 
                        key={idx} 
                        className={cn(
                            "h-2 w-6 rounded-full transition-all duration-300",
                            idx <= currentStep ? "bg-primary" : "bg-primary/20"
                        )} 
                    />
                ))}
            </div>
          </div>
        </DialogHeader>
        
        <form action={formAction} ref={formRef} className="flex-1 flex flex-col overflow-hidden bg-muted/30">
            <input type="hidden" name="id" value={pendingId} />
            <input type="hidden" name="orgId" value={orgId || ''} />
            <input type="hidden" name="imageUrl" value={imageUrl} />
            <input type="hidden" name="contractSignatureUrl" value={signatureUrl} />

            <div className="flex-1 overflow-y-auto px-6 py-8 shadow-inner border-y border-muted-foreground/10">
                {/* PASO 1: INFO GENERAL */}
                <div className={cn("space-y-8 animate-in fade-in slide-in-from-right-4 duration-300", currentStep !== 0 && "hidden")}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
                                {t('properties.form.labels.name')} <span className="text-destructive">*</span>
                            </Label>
                            <Input 
                                id="name" 
                                name="name" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('properties.form.placeholders.name')} 
                                required 
                                className="h-11 bg-background shadow-sm" 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
                                {t('properties.form.labels.address')} <span className="text-destructive">*</span>
                            </Label>
                            <Input 
                                id="address" 
                                name="address" 
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder={t('properties.form.placeholders.address')} 
                                required 
                                className="h-11 bg-background shadow-sm" 
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="propertyUrl" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('properties.form.labels.property_url')}</Label>
                            <Input id="propertyUrl" name="propertyUrl" defaultValue={""} placeholder={t('properties.form.placeholders.property_url')} className="h-11 bg-background shadow-sm" />
                        </div>
                        {isPersonalFlavor && (
                            <div className="space-y-2">
                                <Label htmlFor="priceSheetName" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('properties.form.labels.price_sheet')}</Label>
                                <Input id="priceSheetName" name="priceSheetName" defaultValue={""} placeholder={t('properties.form.placeholders.price_sheet')} className="h-11 bg-background shadow-sm" />
                            </div>
                        )}
                    </div>
                    <div className="space-y-4">
                        <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('properties.form.labels.image_url')}</Label>
                        <div className="relative aspect-video w-full max-w-lg mx-auto overflow-hidden rounded-2xl border-2 border-dashed bg-background shadow-sm">
                            {imageUrl ? (
                                <Image src={imageUrl} alt="Vista previa" fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-30">
                                    <Home className="h-12 w-12 text-primary" />
                                    <span className="text-[10px] uppercase font-black tracking-widest">{t('common.no_image')}</span>
                                </div>
                            )}
                            {isUploading && (
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Subiendo...</p>
                                </div>
                            )}
                        </div>
                        <div className="text-center space-y-3">
                            <Label htmlFor="image-upload-new" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), "cursor-pointer font-bold uppercase text-[10px] tracking-widest h-10 bg-background", isUploading && "opacity-50 pointer-events-none")}>
                                <Upload className="mr-2 h-4 w-4" /> {t('properties.form.labels.upload_image')}
                            </Label>
                            <Input id="image-upload-new" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" disabled={isUploading} />
                            <p className="text-[10px] text-muted-foreground font-medium italic">
                                {t('properties.form.labels.image_hint')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* PASO 2: PROPIETARIO */}
                <div className={cn("space-y-6 animate-in fade-in slide-in-from-right-4 duration-300", currentStep !== 1 && "hidden")}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="ownerName" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('properties.form.labels.owner_name')}</Label>
                            <Input id="ownerName" name="ownerName" className="h-11 bg-background shadow-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ownerDni" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('properties.form.labels.owner_dni')}</Label>
                            <Input id="ownerDni" name="ownerDni" className="h-11 bg-background shadow-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ownerPhone" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('properties.form.labels.owner_phone')}</Label>
                            <Input id="ownerPhone" name="ownerPhone" placeholder="+54..." className="h-11 bg-background shadow-sm" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="ownerEmail" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('properties.form.labels.owner_email')}</Label>
                            <Input id="ownerEmail" name="ownerEmail" type="email" className="h-11 bg-background shadow-sm" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="ownerAddress" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('properties.form.labels.owner_address')}</Label>
                            <Input id="ownerAddress" name="ownerAddress" className="h-11 bg-background shadow-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="managementCommission" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('properties.form.labels.commission')}</Label>
                            <div className="relative">
                                <Input id="managementCommission" name="managementCommission" type="number" step="0.1" min="0" max="100" defaultValue={0} className="h-11 pr-8 bg-background shadow-sm" />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PASO 3: CONTRATOS Y NOTAS */}
                <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-4 duration-300", currentStep !== 2 && "hidden")}>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="notes" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('properties.form.labels.internal_notes')}</Label>
                            <Textarea id="notes" name="notes" placeholder={t('properties.form.placeholders.internal_notes')} className="min-h-[100px] bg-background shadow-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ownerNotes" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('properties.form.labels.owner_notes')}</Label>
                            <Textarea id="ownerNotes" name="ownerNotes" placeholder={t('properties.form.placeholders.owner_notes')} className="min-h-[100px] bg-background border-dashed border-primary/30 shadow-sm" />
                        </div>
                        <div className="space-y-4">
                            <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('properties.form.labels.signature')}</Label>
                            <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed rounded-2xl bg-background shadow-sm">
                                <div className="relative w-full h-24 flex items-center justify-center overflow-hidden">
                                    {signatureUrl ? (
                                        <Image src={signatureUrl} alt="Firma" fill className="object-contain" />
                                    ) : (
                                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-30">{t('common.none')}</span>
                                    )}
                                    {isSignatureUploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl"><Loader2 className="h-6 w-6 animate-spin text-white" /></div>}
                                </div>
                                <div className="text-center space-y-2">
                                    <Label htmlFor="sig-upload-new" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), "cursor-pointer font-bold uppercase text-[10px] tracking-widest h-9", isSignatureUploading && "opacity-50 pointer-events-none")}>
                                        <Upload className="mr-2 h-3 w-3" /> {t('properties.form.labels.upload_signature')}
                                    </Label>
                                    <Input id="sig-upload-new" type="file" className="hidden" onChange={handleSignatureFileChange} accept="image/png" disabled={isSignatureUploading} />
                                    <p className="text-[10px] text-muted-foreground font-medium italic px-4">
                                        Formato: PNG (fondo transparente). Máximo: 1MB.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <Label htmlFor="contractTemplate" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('properties.form.labels.contract_template')}</Label>
                        <div className="relative group">
                            <Textarea 
                                id="contractTemplate" 
                                name="contractTemplate" 
                                value={contractTemplate}
                                onChange={(e) => setContractTemplate(e.target.value)}
                                placeholder={t('properties.form.placeholders.contract')} 
                                className="min-h-[300px] font-mono text-[11px] pr-10 bg-background leading-relaxed shadow-inner" 
                            />
                            <div className="absolute top-2 right-2 flex flex-col gap-2">
                                <Button 
                                    type="button" 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-8 w-8 bg-background/50 hover:bg-background"
                                    onClick={handleCopyContract}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button 
                                                        type="button" 
                                                        size="icon" 
                                                        variant="ghost" 
                                                        className="h-8 w-8 bg-background/50 hover:bg-background text-primary"
                                                    >
                                                        <BookOpen className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56">
                                                    <div className="p-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b mb-1">Modelos de Ejemplo</div>
                                                    {CONTRACT_TEMPLATES.map(tmpl => (
                                                        <DropdownMenuItem key={tmpl.id} onClick={() => loadContractTemplate(tmpl.content)} className="text-xs font-bold py-2 cursor-pointer">
                                                            {tmpl.name}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{t('properties.form.labels.load_template_tooltip')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                        <div className="p-3 rounded-xl bg-background border shadow-sm space-y-3">
                            <h5 className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                                <Info className="h-3 w-3" /> {t('properties.form.labels.markers_help')}
                            </h5>
                            <div className="grid grid-cols-2 gap-1">
                                {contractPlaceholders.map(p => <PlaceholderButton key={p.code} code={p.code} label={t(p.labelKey)} />)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* PASO 4: PERSONALIZACION Y TARIFAS */}
                <div className={cn("space-y-10 animate-in fade-in slide-in-from-right-4 duration-300", currentStep !== 3 && "hidden")}>
                    <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                            <PlusCircle className="h-4 w-4" /> {t('properties.form.sections.additional')}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="p-4 border rounded-2xl bg-background shadow-sm space-y-3 transition-all hover:border-primary/30">
                                    <div className='space-y-1'>
                                        <Label className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">
                                            {t('properties.form.labels.custom_label').replace('{{index}}', i.toString())}
                                        </Label>
                                        <Input name={`customField${i}Label`} placeholder="Ej: Clave WiFi" className="h-9 text-xs" />
                                    </div>
                                    <div className='space-y-1'>
                                        <Label className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">
                                            {t('properties.form.labels.custom_value').replace('{{index}}', i.toString())}
                                        </Label>
                                        <Input name={`customField${i}Value`} placeholder="..." className="h-9 text-xs" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {visitRateProviders.length > 0 && (
                        <div className="space-y-6 border-t pt-8">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                <Wrench className="h-4 w-4" /> {t('properties.form.sections.rates')}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {visitRateProviders.map(p => (
                                    <div key={p.id} className="flex flex-col space-y-2 p-4 border rounded-2xl bg-background shadow-sm hover:border-primary/30 transition-all">
                                        <Label htmlFor={`visitRate_${p.id}`} className="font-bold text-sm text-primary">{p.name}</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">$</span>
                                            <Input id={`visitRate_${p.id}`} name={`visitRate_${p.id}`} type="number" step="0.01" className="pl-7 h-10" placeholder={t('properties.form.placeholders.visit_rate')} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="sticky bottom-0 bg-background pt-4 pb-6 border-t mt-auto px-6 relative z-10 shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex gap-3">
                        {currentStep > 0 ? (
                            <Button type="button" variant="outline" onClick={handleBack} className="font-bold uppercase text-[10px] tracking-widest h-11">
                                <ChevronLeft className="mr-2 h-4 w-4" /> {t('common.back')}
                            </Button>
                        ) : (
                            <DialogClose asChild>
                                <Button type="button" variant="ghost" className="font-bold uppercase text-[10px] tracking-widest h-11">
                                    {t('common.cancel')}
                                </Button>
                            </DialogClose>
                        )}
                    </div>

                    <div className="flex-1 flex justify-end">
                        {currentStep < steps.length - 1 ? (
                            <Button 
                                type="button" 
                                onClick={handleNext} 
                                disabled={!isCurrentStepValid}
                                className="w-full sm:w-auto font-bold uppercase text-[10px] tracking-widest h-11 shadow-lg px-8"
                            >
                                {t('common.next')} <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <SubmitButton />
                        )}
                    </div>
                </div>
            </div>
        </form>
         {state.message && !state.success && (
            <div className="px-6 pb-6 animate-in fade-in slide-in-from-bottom-2">
                <p className="text-red-500 text-xs p-4 bg-red-50 rounded-xl border border-red-200 font-bold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> {state.message}
                </p>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
