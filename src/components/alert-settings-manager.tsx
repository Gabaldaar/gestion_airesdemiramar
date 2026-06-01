
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { AlertSettings } from '@/lib/data';
import { updateAlertSettings, savePushSubscription as savePushSubscriptionAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Bell, CheckCircle2, RefreshCw, Info, Trash2, ShieldAlert, Send, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from '@/i18n/useTranslation';
import { useAuth } from './auth-provider';
import { cn } from '@/lib/utils';

/**
 * Sanitiza la llave pública de forma quirúrgica.
 */
const getSanitizedKey = () => {
    const rawKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
    const cleaned = rawKey.replace(/^["']|["']$/g, '').trim();
    return cleaned;
};

function SubmitButton() {
    const { t } = useTranslation();
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}
                </>
            ) : (
                t('common.save')
            )}
        </Button>
    )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function AlertSettingsManager({ initialSettings, isPersonalFlavor }: { initialSettings: AlertSettings | null, isPersonalFlavor: boolean }) {
    const { t } = useTranslation();
    const { orgId } = useAuth();
    const [state, setState] = useState({ message: '', success: false });
    const [isPending, startTransition] = useTransition();
    const [checkInDays, setCheckInDays] = useState(initialSettings?.checkInDays ?? 7);
    const [checkOutDays, setCheckOutDays] = useState(initialSettings?.checkOutDays ?? 3);
    const { toast } = useToast();

    const [isPushSupported, setIsPushSupported] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState('default');
    const [hasPushSubscription, setHasPushSubscription] = useState(false);
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isRunningCycle, setIsRunningCycle] = useState(false);

    const refreshPushStatus = async () => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
        setNotificationPermission(Notification.permission);
        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.getSubscription();
            setHasPushSubscription(!!sub);
        } catch {
            setHasPushSubscription(false);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            setIsPushSupported(true);
            refreshPushStatus();
        }
    }, []);

    useEffect(() => {
        if (!orgId || notificationPermission !== 'granted' || !isPushSupported) return;
        let cancelled = false;
        (async () => {
            try {
                const registration = await navigator.serviceWorker.ready;
                const sub = await registration.pushManager.getSubscription();
                if (!sub || cancelled) return;
                setHasPushSubscription(true);
                await savePushSubscriptionAction(JSON.parse(JSON.stringify(sub)), orgId);
            } catch {
                // El usuario puede activar manualmente si la sincronización falla.
            }
        })();
        return () => { cancelled = true; };
    }, [orgId, notificationPermission, isPushSupported]);

    const handleHardReset = async () => {
        setIsResetting(true);
        try {
            const sw = await navigator.serviceWorker.ready;
            const sub = await sw.pushManager.getSubscription();
            if (sub) {
                await sub.unsubscribe();
            }
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) {
                await registration.unregister();
            }
            if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map(key => caches.delete(key)));
            }
            toast({
                title: "Reseteo Completo",
                description: "Se ha limpiado la memoria de notificaciones. Por favor, refresca la página (F5) antes de intentar activar de nuevo."
            });
            setNotificationPermission('default');
            setHasPushSubscription(false);
        } catch (e) {
            console.error("[PUSH] Error en reseteo:", e);
        } finally {
            setIsResetting(false);
        }
    };

    const handleSubscribe = async () => {
        if (!isPushSupported || !orgId) return;
        
        const publicKey = getSanitizedKey();
        if (!publicKey || publicKey.length < 20) {
            toast({
                title: "Llave no encontrada",
                description: "La llave pública VAPID parece estar vacía en el servidor. Verifica tus variables de entorno en Netlify.",
                variant: "destructive"
            });
            return;
        }

        setIsSubscribing(true);
        try {
            let permission = Notification.permission;
            if (permission === 'default') {
                permission = await Notification.requestPermission();
            }
            setNotificationPermission(permission);

            if (permission !== 'granted') {
                toast({
                    title: "Permiso denegado",
                    description: "Debes permitir notificaciones en la configuración del navegador o del sistema.",
                    variant: "destructive"
                });
                setIsSubscribing(false);
                return;
            }

            await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
            const registration = await navigator.serviceWorker.ready;
            const applicationServerKey = urlBase64ToUint8Array(publicKey);
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey,
            });
            
            const result = await savePushSubscriptionAction(JSON.parse(JSON.stringify(subscription)), orgId);
            if (result.success) {
                setHasPushSubscription(true);
                toast({ title: t('common.success'), description: "Dispositivo registrado con éxito." });
            } else {
                 throw new Error(result.message);
            }
        } catch (error: any) {
            console.error("[PUSH] Error en registro:", error);
            toast({
                title: "Fallo de servicio",
                description: error?.message || "Error de registro. Usa 'Reseteo Forzado' abajo si el problema persiste.",
                variant: "destructive"
            });
        } finally {
            setIsSubscribing(false);
        }
    };

    const handleTestNotification = async () => {
        if (!orgId) return;
        setIsTesting(true);
        try {
            const response = await fetch('/api/test-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orgId })
            });
            const result = await response.json();
            if (result.success) {
                toast({ title: "Prueba Enviada", description: result.message });
            } else {
                toast({ title: "Fallo en la Prueba", description: result.error, variant: "destructive" });
            }
        } catch (e) {
            toast({ title: "Error", description: "No se pudo conectar con el servidor de prueba.", variant: "destructive" });
        } finally {
            setIsTesting(false);
        }
    };

    const handleRunFullCycle = async () => {
        if (!orgId) return;
        setIsRunningCycle(true);
        try {
            const response = await fetch('/api/notifications/run-cycle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orgId })
            });
            const result = await response.json();
            if (result.success) {
                toast({ 
                    title: "Ciclo Ejecutado", 
                    description: result.message 
                });
            } else {
                toast({ title: "Error en el Ciclo", description: result.error, variant: "destructive" });
            }
        } catch (e) {
            toast({ title: "Error", description: "No se pudo iniciar el ciclo manual.", variant: "destructive" });
        } finally {
            setIsRunningCycle(false);
        }
    };

    const formAction = (formData: FormData) => {
        startTransition(async () => {
            const result = await updateAlertSettings({ message: '', success: false }, formData);
            setState(result);
        });
    };

    const isSubscribed = notificationPermission === 'granted' && hasPushSubscription;
    const permissionOnly = notificationPermission === 'granted' && !hasPushSubscription;

    return (
        <div className="space-y-6 max-w-md">
            {isPersonalFlavor && (
                <form action={formAction} className="space-y-6 border-b pb-8">
                    <div className="space-y-2">
                        <Label htmlFor="checkInDays">{t('settings.alerts.checkin_label')}</Label>
                        <Input 
                            id="checkInDays" 
                            name="checkInDays" 
                            type="number"
                            value={checkInDays}
                            onChange={(e) => setCheckInDays(Number(e.target.value))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="checkOutDays">{t('settings.alerts.checkout_label')}</Label>
                        <Input 
                            id="checkOutDays" 
                            name="checkOutDays" 
                            type="number"
                            value={checkOutDays}
                            onChange={(e) => setCheckOutDays(Number(e.target.value))}
                        />
                    </div>
                    <SubmitButton />
                </form>
            )}
            
            <div className="pt-2 space-y-4">
                 <Label className="text-lg font-black uppercase italic tracking-tighter text-primary">Notificaciones Push</Label>
                 <Alert className={cn(isSubscribed ? "bg-green-50 border-green-200" : permissionOnly ? "bg-amber-50 border-amber-200" : "bg-muted/50")}>
                    <AlertTitle className="flex items-center gap-2 text-xs font-bold uppercase">
                        {isSubscribed ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Bell className="h-4 w-4" />}
                        Estado: <span className={isSubscribed ? "text-green-600" : permissionOnly ? "text-amber-600" : "text-yellow-600"}>
                            {isSubscribed ? "Activado" : permissionOnly ? "Permiso sin registro" : "Pendiente"}
                        </span>
                    </AlertTitle>
                    <AlertDescription className="text-xs">
                        {isSubscribed
                            ? "Este dispositivo está listo para recibir alertas."
                            : permissionOnly
                                ? "El navegador permite avisos, pero este dispositivo aún no está registrado en el servidor. Pulsa el botón de abajo."
                                : "Haz clic abajo para autorizar los avisos en este navegador."}
                    </AlertDescription>
                 </Alert>

                <div className="flex flex-col gap-2">
                    <Button 
                        onClick={handleSubscribe} 
                        disabled={isSubscribing || !isPushSupported || isResetting}
                        className={cn("w-full h-12 font-bold uppercase tracking-widest shadow-lg", isSubscribed && "bg-green-600 hover:bg-green-700")}
                    >
                        {isSubscribing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
                        {isSubscribing ? "Registrando..." : isSubscribed ? "Actualizar Registro" : "Activar en este dispositivo"}
                    </Button>

                    {isPersonalFlavor && (
                        <div className="grid grid-cols-1 gap-2 pt-4 border-t border-dashed">
                             <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Herramientas de Diagnóstico</Label>
                            <Button 
                                variant="outline" 
                                onClick={handleRunFullCycle} 
                                disabled={isRunningCycle}
                                className="w-full h-12 font-bold uppercase tracking-widest border-primary/20 hover:bg-primary/5 text-primary"
                            >
                                {isRunningCycle ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                                Ejecutar comprobación ahora
                            </Button>
                            
                            {(isSubscribed || permissionOnly) && (
                                <Button 
                                    variant="ghost" 
                                    onClick={handleTestNotification} 
                                    disabled={isTesting}
                                    className="w-full h-10 font-bold uppercase text-[10px] tracking-widest opacity-70 hover:opacity-100"
                                >
                                    {isTesting ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Send className="mr-2 h-3 w-3" />}
                                    Enviar solo prueba de conexión
                                </Button>
                            )}
                        </div>
                    )}

                    <div className="pt-4 border-t border-dashed">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleHardReset}
                            disabled={isResetting || isSubscribing}
                            className="w-full text-[10px] uppercase font-bold text-muted-foreground hover:text-destructive flex items-center justify-center gap-2"
                        >
                            {isResetting ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldAlert className="h-3 w-3" />}
                            ¿Problemas? Realizar Reseteo Forzado
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
