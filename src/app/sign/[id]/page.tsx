'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useParams, notFound } from 'next/navigation';
import { BookingWithDetails, BrandingSettings } from '@/lib/data';
import { saveTenantSignature } from '@/lib/actions';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, PenLine } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Image from "next/image";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseDateSafely } from '@/lib/utils';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { APP_CONFIG } from '@/lib/app-config';

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
    let result = Math.floor(num) === 0 ? 'CERO' : Millones(Math.floor(num));
    const centavos = Math.round(num * 100) - Math.floor(num) * 100;
    if (centavos > 0) result += ' CON ' + Millones(centavos);
    return result.trim();
};
const currencyNames: {[key: string]: {singular: string, plural: string}} = {
    'ARS': { singular: 'PESO', plural: 'PESOS' },
    'USD': { singular: 'DÓLAR ESTADOUNIDENSE', plural: 'DÓLARES ESTADOUNIDENSES' },
};


function SignPageLoader() {
    const params = useParams();
    const id = params.id as string;
    if (!id) return <div className="p-8 text-red-500 text-center bg-white text-black">ID no proporcionado.</div>
    return <SignPage entityId={id.trim()} />;
}

export default function SignPageWrapper() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Cargando...</div>}>
            <SignPageLoader />
        </Suspense>
    );
}

function SignPage({ entityId }: { entityId: string }) {
    const [booking, setBooking] = useState<BookingWithDetails | null>(null);
    const [branding, setBranding] = useState<BrandingSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    
    const sigCanvas = useRef<SignatureCanvas>(null);
    const { toast } = useToast();

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
                    
                    setBooking({ ...entityData, property: propSnap.exists() ? { id: propSnap.id, ...propSnap.data() } : null, tenant: tenantSnap.exists() ? { id: tenantSnap.id, ...tenantSnap.data() } : null });
                    if (brandingSnap.exists()) setBranding(brandingSnap.data() as BrandingSettings);
                    if (entityData.contractStatus === 'signed' && entityData.tenantSignatureUrl) setIsSuccess(true);
                }
            } catch (e) {
                console.error(e); setError('Error al cargar.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchEntity();
    }, [entityId]);
    
    const clearSignature = () => sigCanvas.current?.clear();

    const saveSignature = async () => {
        if (sigCanvas.current?.isEmpty()) {
            toast({ variant: 'destructive', title: 'Firma Vacía', description: 'Por favor, dibuja tu firma.' });
            return;
        }
        setIsSubmitting(true);
        const signatureDataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
        const formData = new FormData();
        formData.append('id', entityId);
        formData.append('signatureImage', signatureDataUrl || '');
        const result = await saveTenantSignature({ success: false, message: '' }, formData);
        if (result.success) {
            toast({ title: '¡Éxito!', description: result.message });
            setIsSuccess(true);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center">Cargando contrato...</div>;
    if (error) return <div className="p-8 text-red-500 text-center">{error}</div>;
    if (!booking || !booking.tenant || !booking.property) return <div className="p-8 text-red-500">Datos incompletos.</div>

    const { tenant, property } = booking;
    const formatCurrencyValueOnly = (amount: number | null | undefined) => new Intl.NumberFormat('es-AR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount ?? 0);
    
    const checkInDate = parseDateSafely(booking.startDate);
    const checkOutDate = parseDateSafely(booking.endDate);

    const rentalCurrencyInfo = currencyNames[booking.currency || 'USD'] || { singular: 'DÓLAR', plural: 'DÓLARES' };
    const guaranteeCurrencyInfo = currencyNames[booking.guaranteeCurrency || 'USD'] || { singular: 'DÓLAR', plural: 'DÓLARES' };

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
        '{{montoEnLetras}}': booking.amount ? numeroALetras(booking.amount) : '',
        '{{montoGarantia}}': formatCurrencyValueOnly(booking.guaranteeAmount),
        '{{montoGarantiaEnLetras}}': booking.guaranteeAmount ? numeroALetras(booking.guaranteeAmount) : '',
        '{{monedaGarantia}}': booking.guaranteeCurrency || '',
        '{{monedaGarantiaNombre}}': guaranteeCurrencyInfo.plural,
        '{{propietario.nombre}}': property.ownerName || '',
        '{{propietario.dni}}': property.ownerDni || '',
        '{{fechaActual}}': format(new Date(), "dd 'de' LLLL 'de' yyyy", { locale: es }),
    };

    let processedTemplate = property.contractTemplate || 'Sin plantilla.';
    for (const key in replacements) { processedTemplate = processedTemplate.replaceAll(key, replacements[key]); }
    const paragraphs = processedTemplate.split('\n').filter(p => p.trim() !== '');

    const logoSrc = branding?.logoDocUrl || branding?.logoMainUrl || APP_CONFIG.logo.contract;

    if (isSuccess) return (
        <div className="bg-background text-foreground min-h-screen p-4 sm:p-8 flex items-center justify-center">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <CardTitle>¡Firma Recibida!</CardTitle>
                    <CardDescription>Gracias, {tenant.name}. Tu contrato ha sido firmado.</CardDescription>
                </CardHeader>
                <CardFooter><Button asChild className="w-full"><Link href={`/contract?id=${booking.id}&viewer=tenant`} target="_blank">Ver Contrato Final</Link></Button></CardFooter>
            </Card>
        </div>
    );

    return (
        <div className="bg-gray-100 dark:bg-gray-900 text-foreground p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center pb-4 border-b">
                            <div className="relative w-[180px] h-[48px]">
                                <Image 
                                    src={logoSrc} 
                                    alt="Logo" 
                                    fill 
                                    className="object-contain" 
                                    data-ai-hint="corporate identity"
                                />
                            </div>
                            <h1 className="text-xl font-bold text-right text-primary">Firma de Contrato</h1>
                        </div>
                        <CardDescription className="pt-4">Hola {tenant.name}, revisa los términos y firma abajo.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="prose prose-sm sm:prose-base max-w-none text-justify space-y-4 p-6 border rounded-lg bg-background">
                            {paragraphs.map((p, index) => ( <p key={index}>{p}</p> ))}
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col items-stretch gap-6">
                        <div className="w-full space-y-2">
                             <Label className="text-lg font-medium flex items-center gap-2"><PenLine/> Dibuja tu firma aquí</Label>
                             <div className="border rounded-lg bg-gray-50 touch-none">
                                <SignatureCanvas ref={sigCanvas} penColor="black" canvasProps={{ className: 'w-full h-48 rounded-lg' }} />
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end gap-2">
                            <Button variant="outline" onClick={clearSignature} disabled={isSubmitting}><RefreshCw className="mr-2 h-4 w-4" /> Limpiar</Button>
                            <Button onClick={saveSignature} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PenLine className="mr-2 h-4 w-4" />} Firmar y Enviar</Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
