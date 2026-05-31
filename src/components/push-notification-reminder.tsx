
'use client';

import { useState, useEffect } from 'react';
import { Bell, X, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { useTranslation } from '@/i18n/useTranslation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function PushNotificationReminder() {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // No mostrar en servidor
        if (typeof window === 'undefined') return;

        // Verificar soporte y permiso
        const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
        const currentPermission = Notification.permission;
        
        // Verificar si el usuario lo cerró recientemente (ej: por 7 días)
        const dismissedAt = localStorage.getItem('regentum_push_reminder_dismissed');
        const isRecentlyDismissed = dismissedAt && (new Date().getTime() - parseInt(dismissedAt)) < 7 * 24 * 60 * 60 * 1000;

        if (isSupported && currentPermission !== 'granted' && !isRecentlyDismissed) {
            // Pequeño delay para que no aparezca de golpe al cargar
            const timer = setTimeout(() => setIsVisible(true), 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('regentum_push_reminder_dismissed', new Date().getTime().toString());
    };

    if (!isVisible) return null;

    return (
        <div className="animate-in fade-in slide-in-from-top-4 duration-1000">
            <div className="bg-primary/10 border-2 border-primary/20 rounded-3xl p-4 sm:p-6 shadow-lg relative overflow-hidden group">
                {/* Elementos decorativos */}
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                    <Bell className="h-24 w-24" />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 relative z-10">
                    <div className="p-3 bg-primary text-white rounded-2xl shadow-xl shrink-0 animate-bounce group-hover:animate-none">
                        <Bell className="h-6 w-6" />
                    </div>
                    
                    <div className="flex-1 text-center sm:text-left space-y-1">
                        <h4 className="text-lg font-black uppercase italic tracking-tighter text-primary">
                            {t('dashboard.notifications_reminder.title')}
                        </h4>
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-md">
                            {t('dashboard.notifications_reminder.desc')}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button asChild className="flex-1 sm:flex-none font-bold uppercase text-[10px] tracking-widest h-11 px-6 shadow-xl rounded-xl">
                            <Link href="/settings?tab=alerts">
                                {t('dashboard.notifications_reminder.button')}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={handleDismiss}
                            className="h-11 w-11 rounded-xl text-muted-foreground hover:bg-background/50"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
