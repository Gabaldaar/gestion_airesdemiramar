'use client';

import { BookingWithDetails, BrandingSettings } from "@/lib/data";
import { notFound, useSearchParams } from "next/navigation";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ContractActions from "@/components/contract-actions";
import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import '../globals.css';
import { parseDateSafely } from "@/lib/utils";
import { EmailSender } from "@/components/email-sender";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { APP_CONFIG } from "@/lib/app-config";


// --- Number to Words Conversion Logic ---
const Millones = (num: number) => {
    let divisor = 1000000;
    let strMillones = Seccion(num, divisor, 'UN MILLON', 'MILLONES');
    let strMiles = Miles(num % divisor);
    if (strMillones === '') return strMiles;
    return (strMillones + ' ' + strMiles).trim();
};
const Miles = (num: number) => {
    let divisor = 1000;
    let strMiles = Seccion(num, divisor, 'UN MIL', 'MIL');
    let strCentenas = Centenas(num % divisor);
    if (strMiles === '') return strCentenas;
    return (strMiles + ' ' + strCentenas).trim();
};
const Seccion = (num: number, divisor: number, strSingular: string, strPlural: string) => {
    let cientos = Math.floor(num / divisor);
    let letras = '';
    if (cientos > 0) {
        if (cientos > 1) letras = Centenas(cientos) + ' ' + strPlural;
        else letras = strSingular;
    }
    return letras;
};
const Centenas = (num: number) => {
    let centenas = Math.floor(num / 100);
    let decenas = num % 100;
    switch (centenas) {
        case 1: if (decenas > 0) return 'CIENTO ' + Decenas(decenas); return 'CIEN';
        case 2: return 'DOSCIENTOS ' + Decenas(decenas);
        case 3: return 'TRESCIENTOS ' + Decenas(decenas);
        case 4: return 'CUATROCIENTOS ' + Decenas(decenas);
        case 5: return 'QUINIENTOS ' + Decenas(decenas);
        case 6: return 'SEISCIENTOS ' + Decenas(decenas);
        case 7: return 'SETECIENTOS ' + Decenas(decenas);
        case 8: return 'OCHOCIENTOS ' + Decenas(decenas);
        case 9: return 'NOVECIENTOS ' + Decenas(decenas);
        default: return Decenas(decenas);
    }
};
const Decenas = (num: number) => {
  let decena = Math.floor(num / 10);
  let unidad = num % 10;
  switch (decena) {
    case 1:
      switch (unidad) {
        case 0: return 'DIEZ'; case 1: return 'ONCE'; case 2: return 'DOCE'; case 3: return 'TRECE'; case 4: return 'CATORCE'; case 5: return 'QUINCE';
        default: return 'DIECI' + Unidades(unidad);
      }
    case 2: return unidad === 0 ? 'VEINTE' : 'VEINTI' + Unidades(unidad);
    case 3: return 'TREINTA' + (unidad > 0 ? ' Y ' + Unidades(unidad) : '');
    case 4: return 'CUARENTA' + (unidad > 0 ? ' Y ' + Unidades(unidad) : '');
    case 5: return 'CINCUENTA' + (unidad > 0 ? ' Y ' + Unidades(unidad) : '');
    case 6: return 'SESENTA' + (unidad > 0 ? ' Y ' + Unidades(unidad) : '');
    case 7: return 'SETENTA' + (unidad > 0 ? ' Y ' + Unidades(unidad) : '');
    case 8: return 'OCHENTA' + (unidad > 0 ? ' Y ' + Unidades(unidad) : '');
    case 9: return 'NOVENTA' + (unidad > 0 ? ' Y ' + Unidades(unidad) : '');
    default: return Unidades(unidad);
  }
};
const Unidades = (num: number) => {
  switch (num) {
    case 1: return 'UN'; case 2: return 'DOS'; case 3: return 'TRES'; case 4: return 'CUATRO'; case 5: return 'CINCO'; case 6: return 'SEIS'; case 7: return 'SIETE'; case 8: return 'OCHO'; case 9: return 'NUEVE';
    default: return '';
  }
};
const numeroALetras = (num: number) => {
    if (isNaN(num)) return '';
    let data = { numero: num, enteros: Math.floor(num), centavos: Math.round(num * 100) - Math.floor(num) * 100 };
    let result = data.enteros === 0 ? 'CERO' : Millones(data.enteros);
    if (data.centavos > 0) result += ' CON ' + Millones(data.centavos);
    return result.trim();
};
const currencyNames: {[key: string]: {singular: string, plural: string}} = {
    'ARS': { singular: 'PESO', plural: 'PESOS' },
    'USD': { singular: 'DÓLAR ESTADOUNIDENSE', plural: 'DÓLARES ESTADOUNIDENSES' },
};

function ContractPageLoader() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const viewer = searchParams.get('viewer');
    if (!id) return <div className="p-8 text-red-500 text-center bg-white text-black">ID no proporcionado.</div>
    return <ContractPage entityId={id.trim()} isTenantView={viewer === 'tenant'} />;
}

export default function ContractPageWrapper() {
    return (
        <Suspense fallback={<div className="p-8 text-center bg-white text-black">Cargando contrato...</div>}>
            <ContractPageLoader />
        </Suspense>
    );
}

function ContractPage({ entityId, isTenantView }: { entityId: string, isTenantView: boolean }) {
    const [booking, setBooking] = useState<BookingWithDetails | null>(null);
    const [branding, setBranding] = useState<BrandingSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEmailSenderOpen, setIsEmailSenderOpen] = useState(false);
    
    useEffect(() => {
        const fetchEntity = async () => {
            setIsLoading(true);
            try {
                let entityData: any = null;
                const bookingSnap = await getDoc(doc(db, 'bookings', entityId));
                if (bookingSnap.exists()) {
                    entityData = { id: bookingSnap.id, ...bookingSnap.data() };
                } else {
                    const contratoSnap = await getDoc(doc(db, 'contratos', entityId));
                    if (contratoSnap.exists()) {
                        const contrato = { id: contratoSnap.id, ...contratoSnap.data() } as any;
                        entityData = { ...contrato, startDate: contrato.fechaInicio, endDate: contrato.fechaFin, amount: contrato.montoInicial, currency: contrato.moneda, guaranteeAmount: contrato.montoGarantia, guaranteeCurrency: contrato.monedaGarantia };
                    }
                }
                if (!entityData) {
                    setError('Documento no encontrado.');
                } else {
                    const orgId = entityData.orgId || 'global';
                    const [propSnap, tenantSnap, brandingSnap] = await Promise.all([ 
                        getDoc(doc(db, 'properties', entityData.propertyId)), 
                        getDoc(doc(db, 'tenants', entityData.tenantId)),
                        getDoc(doc(db, 'settings', `branding_${orgId}`))
                    ]);
                    setBooking({
                        ...entityData,
                        property: propSnap.exists() ? { id: propSnap.id, ...propSnap.data() } : null,
                        tenant: tenantSnap.exists() ? { id: tenantSnap.id, ...tenantSnap.data() } : null,
                    });
                    if (brandingSnap.exists()) {
                        setBranding(brandingSnap.data() as BrandingSettings);
                    } else {
                        // Fallback a configuración sin orgId por compatibilidad
                        const oldBrandingSnap = await getDoc(doc(db, 'settings', 'branding'));
                        if (oldBrandingSnap.exists()) setBranding(oldBrandingSnap.data() as BrandingSettings);
                    }
                }
            } catch (e) {
                console.error(e); setError('Error al cargar los datos.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchEntity();
    }, [entityId]);
    
    useEffect(() => {
        if (booking && booking.tenant?.name && booking.property?.name) {
            const checkInDate = parseDateSafely(booking.startDate);
            document.title = `Contrato_${booking.tenant.name.replace(/ /g, '_')}-${booking.property.name.replace(/ /g, '_')}-${checkInDate ? format(checkInDate, 'yyyy-MM-dd') : 'fecha'}`;
        }
    }, [booking]);
    
    if (isLoading) return <div className="p-8 text-center bg-white text-black">Cargando datos del contrato...</div>;
    if (error) return <div className="p-8 text-red-500 text-center bg-white text-black">{error}</div>;
    if (!booking) notFound();
    
    const { tenant, property } = booking;
    if (!tenant || !property) return <div className="p-8 text-red-500 bg-white">Faltan datos para generar el contrato.</div>

    const formatCurrencyValueOnly = (amount: number | null | undefined) => {
        return new Intl.NumberFormat('es-AR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount ?? 0);
    }
    
    const rentalCurrencyInfo = currencyNames[booking.currency || 'USD'] || { singular: 'DÓLAR', plural: 'DÓLARES' };
    const amountInWords = booking.amount ? numeroALetras(booking.amount) : '';
    const guaranteeCurrencyInfo = currencyNames[booking.guaranteeCurrency || 'USD'] || { singular: 'DÓLAR', plural: 'DÓLARES' };
    const guaranteeAmountInWords = booking.guaranteeAmount ? numeroALetras(booking.guaranteeAmount) : '';
    const checkInDate = parseDateSafely(booking.startDate);
    const checkOutDate = parseDateSafely(booking.endDate);

    const replacements: { [key: string]: string } = {
        '{{inquilino.nombre}}': tenant.name,
        '{{inquilino.dni}}': tenant.dni || 'N/A',
        '{{inquilino.direccion}}': `${tenant.address || ''}, ${tenant.city || ''}`.trim().replace(/^,|,$/g, ''),
        '{{propiedad.nombre}}': property.name,
        '{{propiedad.direccion}}': property.address,
        '{{fechaCheckIn}}': checkInDate ? format(checkInDate, "dd 'de' LLLL 'de' yyyy", { locale: es }) : 'Fecha inválida',
        '{{fechaCheckOut}}': checkOutDate ? format(checkOutDate, "dd 'de' LLLL 'de' yyyy", { locale: es }) : 'Fecha inválida',
        '{{monto}}': formatCurrencyValueOnly(booking.amount),
        '{{moneda}}': booking.currency || '',
        '{{monedaNombre}}': rentalCurrencyInfo.plural,
        '{{montoEnLetras}}': amountInWords,
        '{{montoGarantia}}': formatCurrencyValueOnly(booking.guaranteeAmount),
        '{{montoGarantiaEnLetras}}': guaranteeAmountInWords,
        '{{monedaGarantia}}': booking.guaranteeCurrency || '',
        '{{monedaGarantiaNombre}}': guaranteeCurrencyInfo.plural,
        '{{propietario.nombre}}': property.ownerName || '',
        '{{propietario.dni}}': property.ownerDni || '',
        '{{fechaActual}}': format(new Date(), "dd 'de' LLLL 'de' yyyy", { locale: es }),
    };

    let processedTemplate = property.contractTemplate || 'No hay plantilla de contrato definida.';
    for (const key in replacements) { processedTemplate = processedTemplate.replaceAll(key, replacements[key]); }
    const paragraphs = processedTemplate.split('\n').filter(p => p.trim() !== '');

    const logoSrc = branding?.logoDocUrl || branding?.logoMainUrl || APP_CONFIG.logo.contract;
    const mainLogoSrc = branding?.logoMainUrl || APP_CONFIG.logo.main;
    const appName = branding?.appName || APP_CONFIG.name;
    const appSlogan = branding?.appSlogan || APP_CONFIG.slogan;

    return (
        <>
            <div className="bg-white text-black p-4 sm:p-8 md:p-12 print:p-0">
                <div className="max-w-4xl mx-auto bg-white p-8 print:p-0">
                    <header className="flex justify-between items-center pb-8 border-b">
                        <div className="relative w-[225px] h-[60px]">
                            <Image 
                              src={logoSrc} 
                              alt="Logo" 
                              fill 
                              className="object-contain"
                              data-ai-hint="corporate identity"
                            />
                        </div>
                        <div className="print:hidden">
                            <h1 className="text-2xl font-bold text-right">Vista Previa del Contrato</h1>
                            <ContractActions onEmailOpen={() => setIsEmailSenderOpen(true)} showEmailButton={!isTenantView} />
                        </div>
                    </header>
                    <main className="mt-8">
                        <div className="prose prose-sm sm:prose-base max-w-none text-justify space-y-4">
                            {paragraphs.map((p, index) => ( <p key={index}>{p}</p> ))}
                        </div>
                    </main>
                    <footer className="mt-40">
                        <div className="flex justify-between items-end">
                            <div className="text-center">
                                <div className="h-20 w-48 flex items-center justify-center">
                                    {booking.tenantSignatureUrl && <Image src={booking.tenantSignatureUrl} alt="Firma locatario" width={150} height={75} className="object-contain" />}
                                </div>
                                <p className="pt-2 border-t border-black w-48 text-center text-xs">Firma Locatario</p>
                            </div>
                            <div className="text-center">
                                <div className="h-20 w-48 flex items-center justify-center">
                                    {property.contractSignatureUrl && <Image src={property.contractSignatureUrl} alt="Firma locador" width={150} height={75} className="object-contain" />}
                                </div>
                                <p className="pt-2 border-t border-black w-48 text-center text-xs">Firma Locador</p>
                            </div>
                        </div>

                        {/* Pie de página de marca para impresión */}
                        <div className="mt-20 pt-8 border-t flex flex-col items-center gap-2 opacity-50">
                            <div className="relative w-32 h-8 grayscale opacity-70">
                                <Image src={mainLogoSrc} alt={appName} fill className="object-contain" />
                            </div>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">
                                Gestionado con {appName} — {appSlogan}
                            </p>
                        </div>
                    </footer>
                </div>
            </div>
            {booking && <EmailSender booking={booking} isOpen={isEmailSenderOpen} onOpenChange={setIsEmailSenderOpen} />}
        </>
    );
}
