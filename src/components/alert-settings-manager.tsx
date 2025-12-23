
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { AlertSettings } from '@/lib/data';
import { updateAlertSettings, savePushSubscription as savePushSubscriptionAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, BellRing } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                </>
            ) : (
                'Guardar Cambios'
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


export function AlertSettingsManager({ initialSettings }: { initialSettings: AlertSettings | null }) {
    const [state, setState] = useState({ message: '', success: false });
    const [isPending, startTransition] = useTransition();
    const [checkInDays, setCheckInDays] = useState(initialSettings?.checkInDays ?? 7);
    const [checkOutDays, setCheckOutDays] = useState(initialSettings?.checkOutDays ?? 3);
    const { toast } = useToast();

    // State for Push Notifications
    const [isPushSupported, setIsPushSupported] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState('default');
    const [isSubscribing, setIsSubscribing] = useState(false);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsPushSupported(true);
            setNotificationPermission(Notification.permission);
        }
    }, []);


    const handleSubscribe = async () => {
        if (!isPushSupported) return;
        setIsSubscribing(true);
        
        let permission = Notification.permission;
        if (permission === 'default') {
            permission = await Notification.requestPermission();
        }

        setNotificationPermission(permission);

        if (permission !== 'granted') {
            toast({
                title: "Permiso denegado",
                description: "No se pueden activar las notificaciones. Revisa la configuración de tu navegador.",
                variant: "destructive"
            });
            setIsSubscribing(false);
            return;
        }
        
        // At this point, permission is granted.
        toast({ title: 'Permiso concedido', description: 'Suscribiendo este dispositivo...', variant: 'default' });

        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
            console.error("VAPID public key not found.");
            toast({ title: "Error de configuración", description: "Falta la clave pública VAPID.", variant: "destructive" });
            setIsSubscribing(false);
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            
            // Unsubscribe from any existing subscription on this device to ensure a fresh one
            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
                await existingSubscription.unsubscribe();
            }

            // Create a new subscription
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });
            
            // Send the new subscription to the server
            const result = await savePushSubscriptionAction(JSON.parse(JSON.stringify(subscription)));

            if (result.success) {
                toast({
                    title: "¡Dispositivo suscrito!",
                    description: "Ahora recibirás notificaciones aquí.",
                });
            } else {
                 throw new Error(result.message);
            }

        } catch (error) {
            console.error("Failed to subscribe:", error);
            toast({
                title: "Error al suscribir",
                description: (error instanceof Error ? error.message : "No se pudo completar la suscripción."),
                variant: "destructive"
            });
        } finally {
            setIsSubscribing(false);
        }
    }


    const formAction = (formData: FormData) => {
        startTransition(async () => {
            const result = await updateAlertSettings({ message: '', success: false }, formData);
            setState(result);
        });
    };

    useEffect(() => {
        if (state.message) {
            toast({
                title: state.success ? 'Éxito' : 'Error',
                description: state.message,
                variant: state.success ? 'default' : 'destructive',
            });
        }
    }, [state, toast]);

    const getPermissionStatus = () => {
        if (!isPushSupported) return { text: "No soportadas", color: "text-red-500" };
        switch(notificationPermission) {
            case 'granted': return { text: "Permitidas", color: "text-green-500" };
            case 'denied': return { text: "Bloqueadas", color: "text-red-500" };
            default: return { text: "Pendientes", color: "text-yellow-500" };
        }
    }

    return (
        <div className="space-y-6 max-w-md">
            <form action={formAction} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="checkInDays">Días de aviso para Check-in</Label>
                    <p className="text-sm text-muted-foreground">
                        Comenzar a notificar cuando un check-in esté a esta cantidad de días (o menos).
                    </p>
                    <Input 
                        id="checkInDays" 
                        name="checkInDays" 
                        type="number"
                        value={checkInDays}
                        onChange={(e) => setCheckInDays(Number(e.target.value))}
                        placeholder="Ej: 7" 
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="checkOutDays">Días de aviso para Check-out</Label>
                    <p className="text-sm text-muted-foreground">
                        Comenzar a notificar cuando un check-out esté a esta cantidad de días (o menos).
                    </p>
                    <Input 
                        id="checkOutDays" 
                        name="checkOutDays" 
                        type="number"
                        value={checkOutDays}
                        onChange={(e) => setCheckOutDays(Number(e.target.value))}
                        placeholder="Ej: 3" 
                    />
                </div>
                <SubmitButton />
            </form>
            <div className="border-t pt-6 space-y-4">
                 <Label>Notificaciones Push</Label>
                 <Alert>
                    <AlertTitle className="flex items-center gap-2">Estado de las Notificaciones 
                        <span className={`font-bold ${getPermissionStatus().color}`}>
                            ({getPermissionStatus().text})
                        </span>
                    </AlertTitle>
                    <AlertDescription>
                        Activa las notificaciones en tu navegador. Si ya están activadas pero no recibes alertas, usa este botón para forzar una re-suscripción de este dispositivo.
                    </AlertDescription>
                 </Alert>
                <Button onClick={handleSubscribe} disabled={isSubscribing || !isPushSupported}>
                    {isSubscribing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Procesando...
                        </>
                    ) : (
                        <>
                            <BellRing className="mr-2 h-4 w-4" />
                            Activar / Re-suscribir Dispositivo
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
