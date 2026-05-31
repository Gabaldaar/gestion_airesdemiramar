'use client';

import React, { useTransition, useState, useEffect, useMemo, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { Property, Provider, TaskScope } from '@/lib/data';
import { updateProperty } from '@/lib/actions';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { PropertyDeleteForm } from './property-delete-form';
import { Loader2, Upload, Info, Home, Copy, ChevronLeft, ChevronRight, Save, MapPin, PlusCircle, AlertTriangle, Wrench, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from './ui/use-toast';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import { useTranslation } from '@/i18n/useTranslation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { collection, getDocs, query, where } from 'firebase/firestore';
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
        <Button type="submit" disabled={pending} className="w-full sm:w-auto font-bold uppercase tracking-widest gap-2 shadow-lg">
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

export function PropertyEditForm({ 
    property, 
    providers, 
    isPersonalFlavor,
    onPropertyDeleted,
    onPropertyUpdated,
    onClose
}: { 
    property: Property; 
    providers: Provider[], 
    isPersonalFlavor: boolean,
    onPropertyDeleted?: () => void,
    onPropertyUpdated?: () => void,
    onClose?: () => void
}) {
  const { t } = useTranslation();
  const { orgId } = useAuth();
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [scopes, setScopes] = useState<TaskScope[]>([]);
  
  // Estados de los campos para validación y persistencia
  const [name, setName] = useState(property.name || '');
  const [address, setAddress] = useState(property.address || '');
  const [imageUrl, setImageUrl] = useState(property.imageUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState(property.contractSignatureUrl || '');
  const [isSignatureUploading, setIsSignatureUploading] = useState(false);
  const [contractTemplate, setContractTemplate] = useState(property.contractTemplate || '');

  const formRef = useRef<HTMLFormElement>(null);

  const steps = [
    { id: 'info', title: t('properties.form.sections.info'), icon: Home },
    { id: 'owner', title: t('properties.form.sections.owner'), icon: MapPin },
    { id: 'content', title: t('properties.form.sections.content'), icon: Info },
    ...(isPersonalFlavor ? [{ id: 'extra', title: t('properties.form.sections.additional'), icon: PlusCircle }] : [])
  ];

  useEffect(() => {
    if (isPersonalFlavor && orgId) {
        const q = query(collection(db, 'task_scopes'), where('orgId', '==', orgId));
        getDocs(q).then(snap => {
            setScopes(snap.docs.map(d => ({ id: d.id, ...d.data() } as TaskScope)));
        });
    }
  }, [isPersonalFlavor, orgId]);

  const visitRateProviders = useMemo(() => {
    return providers.filter(p => p.billingType === 'per_visit' || p.billingType === 'hourly_or_visit');
  }, [providers]);

  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await updateProperty(initialState, formData);
        setState(result);
        if (result.success) {
            if (onPropertyUpdated) onPropertyUpdated();
            if (onClose) onClose();
        }
    });
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: t('common.error'), description: "La imagen no debe superar 2MB.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const storageRef = ref(storage, `property_images/${property.id}/main_image.jpg`);

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
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      toast({ title: t('common.error'), description: "La firma no debe superar 1MB.", variant: "destructive" });
      return;
    }
    
    setIsSignatureUploading(true);
    const storageRef = ref(storage, `property_signatures/${property.id}/signature.png`);

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
    <div className="flex flex-col h-full bg-background rounded-3xl overflow-hidden">
        <header className="p-6 pb-4 bg-background border-b relative z-10 shrink-0">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-primary flex items-center gap-2">
                        {React.createElement(steps[currentStep].icon, { className: "h-5 w-5" })}
                        {steps[currentStep].title}
                    </h3>
                    <p className="text-xs text-muted-foreground">Paso {currentStep + 1} de {steps.length}</p>
                </div>
                <div className="flex gap-1.5">
                    {steps.map((_, idx) => (
                        <div key={idx} className={cn("h-2 w-6 rounded-full transition-all duration-300", idx <= currentStep ? "bg-primary" : "bg-primary/20")} />
                    ))}
                </div>
            </div>
        </header>

        <form action={formAction} className="flex-1 flex flex-col overflow-hidden bg-muted/30">
            <input type="hidden" name="id" value={property.id} />
            <input type="hidden" name="imageUrl" value={imageUrl} />
            <input type="hidden" name="contractSignatureUrl" value={signatureUrl} />

            <div className="flex-1 overflow-y-auto px-6 py-8 shadow-inner border-y border-muted-foreground/10">
                {/* PASO 1: INFO GENERAL */}
                <div className={cn("space-y-8 animate-in fade-in slide-in-from-right-4 duration-300", currentStep !== 0 && "hidden")}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('properties.form.labels.name')} <span className="text-destructive">*</span></Label>
                            <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required className="h-11 bg-background shadow-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('properties.form.labels.address')} <span className="text-destructive">*</span></Label>
                            <Input id="address" name="address" value={address} onChange={(e) => setAddress(e.target.value)} required className="h-11 bg-background shadow-sm" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="propertyUrl" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('properties.form.labels.property_url')}</Label>
                            <Input id="propertyUrl" name="propertyUrl" defaultValue={property.propertyUrl} className="h-11 bg-background shadow-sm" />
                        </div>
                        {isPersonalFlavor && (
                            <div className="space-y-2">
                                <Label htmlFor="priceSheetName" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('properties.form.labels.price_sheet')}</Label>
                                <Input id="priceSheetName" name="priceSheetName" defaultValue={property.priceSheetName} className="h-11 bg-background shadow-sm" />
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
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white rounded-xl">
                                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Subiendo...</p>
                                </div>
                            )}
                        </div>
                        <div className="text-center space-y-3">
                            <Label htmlFor={`image-upload-${property.id}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), "cursor-pointer font-bold uppercase text-[10px] tracking-widest h-10 bg-background shadow-sm", isUploading && "opacity-50 pointer-events-none")}>
                                <Upload className="mr-2 h-4 w-4" /> {t('properties.form.labels.upload_image')}
                            </Label>
                            <Input id={`image-upload-${property.id}`} type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" disabled={isUploading} />
                            <p className="text-[10px] text-muted-foreground font-medium italic">{t('properties.form.labels.image_hint')}</p>
                        </div>
                    </div>
                </div>

                {/* PASO 2: PROPIETARIO */}
                <div className={cn("space-y-6 animate-in fade-in slide-in-from-right-4 duration-300", currentStep !== 1 && "hidden")}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="ownerName" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('properties.form.labels.owner_name')}</Label>
                            <Input id="ownerName" name="ownerName" defaultValue={property.ownerName} className="h-11 bg-background shadow-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ownerDni" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('properties.form.labels.owner_dni')}</Label>
                            <Input id="ownerDni" name="ownerDni" defaultValue={property.ownerDni} className="h-11 bg-background shadow-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ownerPhone" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('properties.form.labels.owner_phone')}</Label>
                            <Input id="ownerPhone" name="ownerPhone" defaultValue={property.ownerPhone} className="h-11 bg-background shadow-sm" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="ownerEmail" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('properties.form.labels.owner_email')}</Label>
                            <Input id="ownerEmail" name="ownerEmail" type="email" defaultValue={property.ownerEmail} className="h-11 bg-background shadow-sm" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="ownerAddress" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('properties.form.labels.owner_address')}</Label>
                            <Input id="ownerAddress" name="ownerAddress" defaultValue={property.ownerAddress} className="h-11 bg-background shadow-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="managementCommission" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('properties.form.labels.commission')}</Label>
                            <div className="relative">
                                <Input id="managementCommission" name="managementCommission" type="number" step="0.1" defaultValue={property.managementCommission || 0} className="h-11 pr-8 bg-background shadow-sm" />
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
                            <Textarea id="notes" name="notes" defaultValue={property.notes} className="min-h-[100px] bg-background shadow-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ownerNotes" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('properties.form.labels.owner_notes')}</Label>
                            <Textarea id="ownerNotes" name="ownerNotes" defaultValue={property.ownerNotes} className="min-h-[100px] bg-background border-dashed border-primary/30 shadow-sm" />
                        </div>
                        <div className="space-y-4">
                            <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('properties.form.labels.signature')}</Label>
                            <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed rounded-2xl bg-background shadow-sm">
                                <div className="relative w-full h-24 flex items-center justify-center">
                                    {signatureUrl ? (
                                        <Image src={signatureUrl} alt="Firma" fill className="object-contain" />
                                    ) : (
                                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-30">{t('common.none')}</span>
                                    )}
                                    {isSignatureUploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl"><Loader2 className="h-6 w-6 animate-spin text-white" /></div>}
                                </div>
                                <div className="text-center space-y-2">
                                    <Label htmlFor={`sig-upload-${property.id}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), "cursor-pointer font-bold uppercase text-[10px] tracking-widest h-9 bg-background shadow-sm", isSignatureUploading && "opacity-50 pointer-events-none")}>
                                        <Upload className="mr-2 h-3 w-3" /> {t('properties.form.labels.upload_signature')}
                                    </Label>
                                    <Input id={`sig-upload-${property.id}`} type="file" className="hidden" onChange={handleSignatureFileChange} accept="image/png" disabled={isSignatureUploading} />
                                    <p className="text-[10px] text-muted-foreground italic">PNG transparente. Máximo: 1MB.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <Label htmlFor="contractTemplate" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('properties.form.labels.contract_template')}</Label>
                        <div className="relative group shadow-sm rounded-lg overflow-hidden border">
                            <Textarea 
                                id="contractTemplate" 
                                name="contractTemplate" 
                                value={contractTemplate}
                                onChange={(e) => setContractTemplate(e.target.value)}
                                placeholder={t('properties.form.placeholders.contract')} 
                                className="min-h-[300px] font-mono text-[11px] pr-10 bg-background border-none leading-relaxed shadow-inner" 
                            />
                            <div className="absolute top-2 right-2 flex flex-col gap-2">
                                <Button type="button" size="icon" variant="ghost" className="h-8 w-8 bg-background/50 hover:bg-background" onClick={handleCopyContract}>
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
                                        <Label className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">{t('properties.form.labels.custom_label').replace('{{index}}', i.toString())}</Label>
                                        <Input name={`customField${i}Label`} defaultValue={property[`customField${i}Label` as keyof Property] as string} className="h-9 text-xs bg-background" />
                                    </div>
                                    <div className='space-y-1'>
                                        <Label className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">{t('properties.form.labels.custom_value').replace('{{index}}', i.toString())}</Label>
                                        <Input name={`customField${i}Value`} defaultValue={property[`customField${i}Value` as keyof Property] as string} className="h-9 text-xs bg-background" />
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
                                        <Label className="font-bold text-sm text-primary uppercase text-[10px] tracking-widest">{p.name}</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">$</span>
                                            <Input name={`visitRate_${p.id}`} type="number" step="0.01" defaultValue={property.visitRates?.[p.id] || ''} className="pl-7 h-10 bg-background" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-background pt-4 pb-6 border-t px-6 relative z-10 shrink-0 shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex gap-2">
                        {currentStep > 0 ? (
                            <Button type="button" variant="outline" onClick={handleBack} className="font-bold uppercase text-[10px] tracking-widest h-11 bg-background">
                                <ChevronLeft className="mr-2 h-4 w-4" /> {t('common.back')}
                            </Button>
                        ) : (
                            <PropertyDeleteForm propertyId={property.id} propertyName={property.name} onPropertyDeleted={onPropertyDeleted} />
                        )}
                        <Button type="button" variant="ghost" onClick={onClose} className="font-bold uppercase text-[10px] tracking-widest h-11">
                            {t('common.cancel')}
                        </Button>
                    </div>

                    <div className="flex-1 flex justify-end gap-3">
                        {currentStep < steps.length - 1 ? (
                            <Button type="button" onClick={handleNext} disabled={!isCurrentStepValid} className="w-full sm:w-auto font-bold uppercase text-[10px] tracking-widest h-11 shadow-lg px-8">
                                {t('common.next')} <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <SubmitButton />
                        )}
                    </div>
                </div>
            </div>
        </form>
    </div>
  );
}
