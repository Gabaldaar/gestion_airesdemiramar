'use client';

import { useState, useTransition, useEffect } from 'react';
import { BrandingSettings } from '@/lib/data';
import { updateBrandingSettings } from '@/lib/actions';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from './ui/use-toast';
import { Loader2, Upload, Trash2, Info } from 'lucide-react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import { APP_CONFIG } from '@/lib/app-config';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/useTranslation';
import { useAuth } from './auth-provider';

interface BrandingManagerProps {
    initialSettings: BrandingSettings | null;
    onSettingsChanged: () => void;
    isPersonalFlavor: boolean;
}

export function BrandingManager({ initialSettings, onSettingsChanged, isPersonalFlavor }: BrandingManagerProps) {
    const { orgId } = useAuth();
    const { t } = useTranslation();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const [appName, setAppName] = useState(initialSettings?.appName || APP_CONFIG.name);
    const [appSlogan, setAppSlogan] = useState(initialSettings?.appSlogan || APP_CONFIG.slogan);
    const [logoMainUrl, setLogoMainUrl] = useState(initialSettings?.logoMainUrl || '');
    const [logoDocUrl, setLogoDocUrl] = useState(initialSettings?.logoDocUrl || '');

    const [isUploadingMain, setIsUploadingMain] = useState(false);
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);

    const handleUpload = async (file: File, type: 'main' | 'doc') => {
        if (file.size > 2 * 1024 * 1024) {
            toast({ variant: 'destructive', title: t('common.error'), description: 'El tamaño máximo permitido es 2MB.' });
            return;
        }

        const setUpload = type === 'main' ? setIsUploadingMain : setIsUploadingDoc;
        const setUrl = type === 'main' ? setLogoMainUrl : setLogoDocUrl;
        const fileName = type === 'main' ? 'logo_main.png' : 'logo_doc.png';

        setUpload(true);
        try {
            const storageRef = ref(storage, `branding/${fileName}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            setUrl(url);
            toast({ title: t('common.success'), description: 'Recuerda guardar los cambios para aplicar.' });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: t('common.error'), description: 'No se pudo subir la imagen. Verifica tu conexión.' });
        } finally {
            setUpload(false);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('orgId', orgId || '');
        formData.append('appName', appName);
        formData.append('appSlogan', appSlogan);
        formData.append('logoMainUrl', logoMainUrl);
        formData.append('logoDocUrl', logoDocUrl);

        startTransition(async () => {
            const result = await updateBrandingSettings({ success: false, message: '' }, formData);
            if (result.success) {
                toast({ title: t('common.success'), description: result.message });
                onSettingsChanged();
            }
        });
    };

    return (
        <form onSubmit={handleFormSubmit} className="space-y-8 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {isPersonalFlavor && (
                    <div className="space-y-6">
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                            <h3 className="font-bold text-sm uppercase tracking-wider text-primary border-b pb-1">{t('settings.branding.interface_texts')}</h3>
                            <div className="space-y-2">
                                <Label htmlFor="appName">{t('settings.branding.app_name')}</Label>
                                <Input id="appName" value={appName} onChange={(e) => setAppName(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="appSlogan">{t('settings.branding.slogan')}</Label>
                                <Input id="appSlogan" value={appSlogan} onChange={(e) => setAppSlogan(e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-4 p-4 border rounded-lg">
                            <h3 className="font-bold text-sm uppercase tracking-wider text-primary border-b pb-1">{t('settings.branding.main_logo')}</h3>
                            <div className="flex items-start gap-3 bg-blue-50 p-2 rounded text-[10px] text-blue-700">
                                <Info className="h-4 w-4 shrink-0" />
                                <p>{t('settings.branding.logo_recom')}</p>
                            </div>
                            <div className="relative aspect-[4/1] w-full border rounded bg-white flex items-center justify-center overflow-hidden">
                                {logoMainUrl ? (
                                    <Image src={logoMainUrl} alt="Logo Main" fill className="object-contain p-2" />
                                ) : (
                                    <Image src={APP_CONFIG.logo.main} alt="Default Main" fill className="object-contain p-2 opacity-50 grayscale" />
                                )}
                                {isUploadingMain && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-white" /></div>}
                            </div>
                            <div className="flex gap-2">
                                <Label htmlFor="upload-main" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), "flex-1 cursor-pointer", isUploadingMain && "opacity-50 pointer-events-none")}>
                                    <Upload className="mr-2 h-4 w-4" /> {t('settings.branding.upload_logo')}
                                </Label>
                                <input id="upload-main" type="file" className="hidden" accept="image/png, image/jpeg" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'main')} disabled={isUploadingMain} />
                                {logoMainUrl && (
                                    <Button type="button" variant="ghost" size="sm" onClick={() => setLogoMainUrl('')}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className={cn("space-y-6", !isPersonalFlavor && "col-span-1 md:col-span-2 max-w-xl mx-auto")}>
                    <div className="space-y-4 p-4 border rounded-lg bg-primary/5 border-primary/10">
                        <h3 className="font-bold text-sm uppercase tracking-wider text-primary border-b border-primary/20 pb-1">{t('settings.branding.doc_logo')}</h3>
                        <div className="flex items-start gap-3 bg-primary/10 p-3 rounded text-xs text-primary">
                            <Info className="h-5 w-5 shrink-0" />
                            <div>
                                <p className="font-bold">{t('settings.branding.logo_instr_title')}</p>
                                <ul className="list-disc ml-4 mt-1 space-y-0.5 opacity-80">
                                    <li>{t('settings.branding.logo_instr_1')}</li>
                                    <li>{t('settings.branding.logo_instr_2')}</li>
                                    <li>{t('settings.branding.logo_instr_3')}</li>
                                    <li>{t('settings.branding.logo_instr_4')}</li>
                                </ul>
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">{t('settings.branding.logo_doc_usage')}</p>
                        <div className="relative aspect-[4/1] w-full border rounded bg-white flex items-center justify-center overflow-hidden shadow-inner">
                            {logoDocUrl ? (
                                <Image src={logoDocUrl} alt="Logo Doc" fill className="object-contain p-2" />
                            ) : (
                                <Image src={APP_CONFIG.logo.contract} alt="Default Doc" fill className="object-contain p-2 opacity-30 grayscale" />
                            )}
                            {isUploadingDoc && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-white" /></div>}
                        </div>
                        <div className="flex gap-2">
                            <Label htmlFor="upload-doc" className={cn(buttonVariants({ variant: 'default', size: 'sm' }), "flex-1 cursor-pointer", isUploadingDoc && "opacity-50 pointer-events-none")}>
                                <Upload className="mr-2 h-4 w-4" /> {t('settings.branding.select_image')}
                            </Label>
                            <input id="upload-doc" type="file" className="hidden" accept="image/png, image/jpeg" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'doc')} disabled={isUploadingDoc} />
                            {logoDocUrl && (
                                <Button type="button" variant="ghost" size="sm" onClick={() => setLogoDocUrl('')}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            )}
                        </div>
                    </div>
                    
                    {!isPersonalFlavor && (
                        <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                            <p>{t('settings.branding.commercial_disclaimer')}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end pt-6 border-t">
                <Button type="submit" disabled={isPending || isUploadingMain || isUploadingDoc} size="lg" className="px-8 font-bold">
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('common.save')}
                </Button>
            </div>
        </form>
    );
}
