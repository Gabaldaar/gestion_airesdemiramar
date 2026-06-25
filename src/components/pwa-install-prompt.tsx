'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';

interface PwaInstallPromptProps {
  appName: string;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PwaInstallPrompt({ appName }: PwaInstallPromptProps) {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Verificar si la aplicación ya se ejecuta en modo standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevenir el prompt automático del navegador
      e.preventDefault();
      // Guardar el evento para dispararlo manualmente
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Mostrar nuestro prompt personalizado
      setShowPrompt(true);
    };

    const handleAppInstalled = () => {
      console.log('PWA instalada correctamente');
      setDeferredPrompt(null);
      setShowPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;
    
    // Disparar el prompt de instalación nativo
    await deferredPrompt.prompt();
    
    // Esperar la decisión del usuario
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Decisión de instalación del usuario: ${outcome}`);
    
    // Limpiar el prompt guardado
    setDeferredPrompt(null);
    setShowPrompt(false);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:bottom-6 md:right-6 md:left-auto z-50 max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-background/85 backdrop-blur-md border border-border/80 shadow-2xl rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden">
        {/* Adorno visual: gradiente sutil de fondo */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none" />
        
        <button 
          onClick={handleDismiss} 
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors"
          aria-label={t('common.close') || 'Cerrar'}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="bg-primary/15 text-primary p-2.5 rounded-xl flex-shrink-0">
            <Download className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">
              {t('pwa_install.title')?.replace('{{appName}}', appName) || `Instalar ${appName}`}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('pwa_install.message') || 'Instala la aplicación en tu dispositivo para acceder de forma rápida y sin conexión.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDismiss} 
            className="flex-1 text-[11px] font-bold h-9 uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            {t('pwa_install.btn_cancel') || 'Ahora no'}
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleInstallClick} 
            className="flex-1 text-[11px] font-bold h-9 uppercase tracking-wider shadow-md bg-primary hover:bg-primary/95 text-primary-foreground"
          >
            {t('pwa_install.btn_install') || 'Instalar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
