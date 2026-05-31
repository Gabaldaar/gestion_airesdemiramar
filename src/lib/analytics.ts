
'use client';

/**
 * ID de Medición verificado por el usuario.
 */
const MEASUREMENT_ID = "G-YTGTZMEC74";

/**
 * Inicialización directa de Google Tag (gtag.js)
 * Este método es más robusto que el SDK de Firebase cuando hay problemas de vinculación
 * en la consola de Firebase, ya que envía los datos directamente a GA4.
 */
const initializeGtag = () => {
    if (typeof window === 'undefined') return;
    if ((window as any).gtag) return;

    // Inyectar el script principal de Google Tag
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    document.head.appendChild(script1);

    // Configurar la función gtag y los comandos iniciales
    const script2 = document.createElement('script');
    script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', '${MEASUREMENT_ID}', { 
            'debug_mode': true,
            'send_page_view': true,
            'cookie_flags': 'SameSite=None;Secure'
        });
    `;
    document.head.appendChild(script2);
    
    console.log(`%c[ANALYTICS] Motor Directo GTag inicializado: ${MEASUREMENT_ID}`, "color: #16a34a; font-weight: bold;");
};

// Intentar inicializar inmediatamente si estamos en el cliente
if (typeof window !== 'undefined') {
    initializeGtag();
}

/**
 * Registra un evento en Google Analytics usando gtag.js directamente.
 */
export const logEvent = (eventName: string, eventParams?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        try {
            (window as any).gtag('event', eventName, {
                ...eventParams,
                debug_mode: true 
            });
            
            console.log(
                `%c[GA4 EVENT] ${eventName}`, 
                'background: #17628d; color: #fff; padding: 2px 5px; border-radius: 3px; font-weight: bold;', 
                eventParams
            );
        } catch (error) {
            console.error("[ANALYTICS ERROR] Falló el registro del evento:", error);
        }
    } else {
        // Si gtag no está listo, intentamos inicializar de nuevo
        if (typeof window !== 'undefined') initializeGtag();
    }
};
