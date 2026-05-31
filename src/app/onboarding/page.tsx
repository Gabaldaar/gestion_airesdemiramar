'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Rocket, AlertTriangle, CheckCircle2, Mail } from 'lucide-react';
import { doc, setDoc, writeBatch, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { APP_CONFIG } from '@/lib/app-config';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// Identificador único del Administrador Maestro (seguro de exponer)
const MASTER_ADMIN_UID = 'ymBtFDZUWKR7VCxWNTHWflXc5mx1';

export default function OnboardingPage() {
    const { user, signOut, loading: authLoading } = useAuth();
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'preparing' | 'connecting' | 'saving' | 'success'>('idle');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Función de extracción robusta de email
    const getEmailFromUser = useCallback((firebaseUser: any) => {
        if (!firebaseUser) return '';
        
        let detected = (firebaseUser.email || '').toLowerCase().trim();
        
        // Si el campo principal está vacío, buscamos en los perfiles vinculados (providerData)
        if (!detected && firebaseUser.providerData) {
            for (const profile of firebaseUser.providerData) {
                if (profile.email) {
                    detected = profile.email.toLowerCase().trim();
                    break;
                }
            }
        }
        return detected;
    }, []);

    useEffect(() => {
        if (user) {
            setName(user.displayName || '');
            const detected = getEmailFromUser(user);
            setEmail(detected);
        }
    }, [user, getEmailFromUser]);

    const handleCreateWorkspace = async () => {
        if (!user || !name || !email) {
            setErrorMsg("Por favor, complete todos los campos obligatorios.");
            return;
        }
        
        if (!email.includes('@')) {
            setErrorMsg("Por favor, ingrese un correo electrónico válido.");
            return;
        }

        setErrorMsg(null);
        setStatus('preparing');

        try {
            const finalEmail = email.toLowerCase().trim();
            const isMaster = user.uid === MASTER_ADMIN_UID;
            
            const orgId = isMaster ? 'global' : user.uid;
            const flavor = isMaster ? 'personal' : 'commercial';
            
            setStatus('connecting');
            
            // Usamos un batch para crear todos los datos iniciales de forma atómica
            const batch = writeBatch(db);

            // 1. Crear Perfil de Proveedor/Dueño
            const providerRef = doc(db, 'providers', user.uid);
            batch.set(providerRef, {
                orgId: orgId,
                name: name,
                email: finalEmail,
                role: 'admin',
                status: 'active',
                userId: user.uid,
                managementType: 'tasks',
                appFlavor: flavor,
                createdAt: new Date().toISOString()
            });

            // 2. Crear Configuraciones por defecto
            const brandingRef = doc(db, 'settings', `branding_${orgId}`);
            batch.set(brandingRef, {
                orgId: orgId,
                appName: APP_CONFIG.name,
                appSlogan: APP_CONFIG.slogan
            });

            const currenciesRef = doc(db, 'settings', `currencies_${orgId}`);
            batch.set(currenciesRef, {
                orgId: orgId,
                baseCurrency: 'USD',
                favoriteCurrencies: ['USD', 'ARS']
            });

            // 3. Sembrar datos de fábrica (Seed Data)
            setStatus('saving');

            // Orígenes
            const seedOrigins = [
                { name: 'Airbnb', color: '#FF5A5F' },
                { name: 'Booking.com', color: '#003580' },
                { name: 'WhatsApp', color: '#25D366' },
                { name: 'Instagram', color: '#E1306C' },
                { name: 'Recomendados / Directo', color: '#64748b' }
            ];
            seedOrigins.forEach(item => {
                const ref = doc(collection(db, 'origins'));
                batch.set(ref, { ...item, orgId });
            });

            // Categorías de Gasto
            const seedExpenseCats = [
                { name: 'Limpieza y Lavandería' },
                { name: 'Mantenimiento y Reparaciones' },
                { name: 'Servicios (Luz/Gas/Agua/WiFi)' },
                { name: 'Impuestos y Tasas' },
                { name: 'Suministros e Insumos' }
            ];
            seedExpenseCats.forEach(item => {
                const ref = doc(collection(db, 'expense_categories'));
                batch.set(ref, { ...item, orgId });
            });

            // Categorías de Tarea
            const seedTaskCats = [
                { name: 'Preparación Check-in' },
                { name: 'Control Check-out' },
                { name: 'Reparación Urgente' },
                { name: 'Mantenimiento Preventivo' },
                { name: 'Gestión Administrativa' }
            ];
            seedTaskCats.forEach(item => {
                const ref = doc(collection(db, 'task_categories'));
                batch.set(ref, { ...item, orgId });
            });

            // Categorías de Colaborador
            const seedProviderCats = [
                { name: 'Limpieza' },
                { name: 'Mantenimiento Técnico' },
                { name: 'Administración / Recepción' }
            ];
            seedProviderCats.forEach(item => {
                const ref = doc(collection(db, 'provider_categories'));
                batch.set(ref, { ...item, orgId });
            });

            // Ejecutar todas las escrituras
            await batch.commit();

            setStatus('success');
            
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);

        } catch (error: any) {
            console.error("[ONBOARDING] Error:", error);
            setStatus('idle');
            setErrorMsg(error.message || 'Error al crear su espacio de trabajo.');
        }
    };

    if (authLoading) return <div className="flex h-screen items-center justify-center bg-muted/40"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

    if (!user) {
        router.push('/login');
        return null;
    }

    const isBusy = status !== 'idle' && status !== 'success';

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <Card className="w-full max-w-md shadow-2xl border-2 border-primary/10">
                <CardHeader className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="p-4 bg-primary/10 rounded-3xl">
                            {status === 'success' ? (
                                <CheckCircle2 className="h-12 w-12 text-green-600 animate-in zoom-in duration-500" />
                            ) : (
                                <Rocket className={cn("h-12 w-12 text-primary", isBusy && "animate-bounce")} />
                            )}
                        </div>
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-black text-primary italic uppercase tracking-tighter">Bienvenido</CardTitle>
                        <CardDescription className="text-base">Configure su nuevo espacio de trabajo profesional.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {errorMsg && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Atención</AlertTitle>
                            <AlertDescription className="text-xs mt-1">
                                {errorMsg}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Su Nombre o Empresa</Label>
                            <Input 
                                id="name" 
                                placeholder="Ej: Inmobiliaria Central" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)}
                                className="h-11"
                                disabled={isBusy || status === 'success'}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center gap-2">
                                <Mail className="h-3 w-3" /> Correo Electrónico
                            </Label>
                            <Input 
                                id="email" 
                                type="email"
                                placeholder="ejemplo@gmail.com" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-11 font-medium"
                                disabled={isBusy || status === 'success'}
                            />
                        </div>
                    </div>

                    <p className="text-xs text-muted-foreground text-center italic px-4">
                        Al continuar, se creará una instancia privada vinculada a su identidad de Google y se pre-configurarán categorías básicas para ayudarle a empezar.
                    </p>

                    {isBusy && (
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                            <p className="text-xs font-bold text-blue-700 uppercase tracking-widest animate-pulse">
                                {status === 'preparing' && "Preparando..."}
                                {status === 'connecting' && "Configurando seguridad..."}
                                {status === 'saving' && "Iniciando base de datos..."}
                            </p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pt-4">
                    <Button 
                        onClick={handleCreateWorkspace} 
                        className="w-full h-14 text-lg font-black uppercase italic shadow-xl" 
                        disabled={isBusy || status === 'success' || !name.trim() || !email.trim()}
                    >
                        {status === 'success' ? "¡Listo!" : isBusy ? "Procesando..." : "Empezar ahora"}
                    </Button>
                    <Button variant="ghost" onClick={signOut} className="text-muted-foreground" disabled={isBusy}>
                        Cerrar Sesión
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}