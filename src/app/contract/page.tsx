
'use client';

import { getBookingWithDetails } from "@/lib/data";
import { notFound, useSearchParams } from "next/navigation";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ContractActions from "@/components/contract-actions";
import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import LogoCont from "@/assets/logocont.png";
import Firma from "@/assets/firma.png";
import '../globals.css';
import { BookingWithDetails } from "@/lib/data";


// --- Number to Words Conversion Logic ---
const Unidades = (num: number) => {
  switch (num) {
    case 1: return 'UN';
    case 2: return 'DOS';
    case 3: return 'TRES';
    case 4: return 'CUATRO';
    case 5: return 'CINCO';
    case 6: return 'SEIS';
    case 7: return 'SIETE';
    case 8: return 'OCHO';
    case 9: return 'NUEVE';
    default: return '';
  }
};

const Decenas = (num: number) => {
  let decena = Math.floor(num / 10);
  let unidad = num % 10;
  switch (decena) {
    case 1:
      switch (unidad) {
        case 0: return 'DIEZ';
        case 1: return 'ONCE';
        case 2: return 'DOCE';
        case 3: return 'TRECE';
        case 4: return 'CATORCE';
        case 5: return 'QUINCE';
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

const Centenas = (num: number) => {
    let centenas = Math.floor(num / 100);
    let decenas = num % 100;
    switch (centenas) {
        case 1:
            if (decenas > 0) return 'CIENTO ' + Decenas(decenas);
            return 'CIEN';
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

const Seccion = (num: number, divisor: number, strSingular: string, strPlural: string) => {
    let cientos = Math.floor(num / divisor);
    let resto = num % divisor;
    let letras = '';
    if (cientos > 0) {
        if (cientos > 1) letras = Centenas(cientos) + ' ' + strPlural;
        else letras = strSingular;
    }
    if (resto > 0) letras += '';
    return letras;
};

const Miles = (num: number) => {
    let divisor = 1000;
    let cientos = Math.floor(num / divisor);
    let resto = num % divisor;
    let strMiles = Seccion(num, divisor, 'UN MIL', 'MIL');
    let strCentenas = Centenas(resto);
    if (strMiles === '') return strCentenas;
    return (strMiles + ' ' + strCentenas).trim();
};

const Millones = (num: number) => {
    let divisor = 1000000;
    let cientos = Math.floor(num / divisor);
    let resto = num % divisor;
    let strMillones = Seccion(num, divisor, 'UN MILLON DE', 'MILLONES DE');
    let strMiles = Miles(resto);
    if (strMillones === '') return strMiles;
    return (strMillones + ' ' + strMiles).trim();
};

const numeroALetras = (num: number, currency: { plural: string; singular: string; centPlural: string; centSingular: string }) => {
    let data = {
        numero: num,
        enteros: Math.floor(num),
        centavos: Math.round(num * 100) - Math.floor(num) * 100,
        letrasCentavos: '',
        letrasMonedaPlural: currency.plural,
        letrasMonedaSingular: currency.singular,
        letrasMonedaCentavoPlural: currency.centPlural,
        letrasMonedaCentavoSingular: currency.centSingular,
    };

    if (data.centavos > 0) {
        data.letrasCentavos = 'CON ' + (() => {
            if (data.centavos === 1) return Millones(data.centavos) + ' ' + data.letrasMonedaCentavoSingular;
            else return Millones(data.centavos) + ' ' + data.letrasMonedaCentavoPlural;
        })();
    }

    if (data.enteros === 0) return 'CERO ' + data.letrasMonedaPlural + ' ' + data.letrasCentavos;
    if (data.enteros === 1) return Millones(data.enteros) + ' ' + data.letrasMonedaSingular + ' ' + data.letrasCentavos;
    else return Millones(data.enteros) + ' ' + data.letrasMonedaPlural + ' ' + data.letrasCentavos;
};

// --- End of Conversion Logic ---

function ContractPageLoader() {
    const searchParams = useSearchParams();
    const bookingId = searchParams.get('id');

    if (!bookingId) {
        return <div className="p-8 text-red-500 text-center bg-white text-black">ID de reserva no proporcionado.</div>
    }
    
    return <ContractPage bookingId={bookingId} />;
}


export default function ContractPageWrapper() {
    return (
        <Suspense fallback={<div className="p-8 text-center bg-white text-black">Cargando contrato...</div>}>
            <ContractPageLoader />
        </Suspense>
    );
}

function ContractPage({ bookingId }: { bookingId: string }) {
    const [booking, setBooking] = useState<BookingWithDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const fetchBooking = async () => {
            setIsLoading(true);
            try {
                const fetchedBooking = await getBookingWithDetails(bookingId);
                if (!fetchedBooking) {
                    setError('Reserva no encontrada.');
                } else {
                    setBooking(fetchedBooking);
                }
            } catch (e) {
                console.error(e);
                setError('Error al cargar la reserva.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBooking();
    }, [bookingId]);
    
    useEffect(() => {
        if (booking && booking.tenant?.name && booking.property?.name) {
            const checkInDate = format(new Date(booking.startDate), 'yyyy-MM-dd');
            const tenantName = booking.tenant.name.replace(/ /g, '_');
            const propertyName = booking.property.name.replace(/ /g, '_');
            document.title = `Contrato_${tenantName}-${propertyName}-${checkInDate}`;
        }
    }, [booking]);
    
    if (isLoading) {
        return <div className="p-8 text-center bg-white text-black">Cargando datos del contrato...</div>;
    }
    
    if (error) {
        return <div className="p-8 text-red-500 text-center bg-white text-black">{error}</div>;
    }
    
    if (!booking) {
        notFound();
    }
    
    const { tenant, property } = booking;
    if (!tenant || !property) {
        return <div className="p-8 text-red-500 bg-white">Faltan datos del inquilino o la propiedad para generar el contrato.</div>
    }

    const formatCurrency = (amount: number, currency: 'USD' | 'ARS') => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    }
    
    const currencyConfig = {
      plural: booking.currency === 'ARS' ? 'PESOS' : 'DÓLARES ESTADOUNIDENSES',
      singular: booking.currency === 'ARS' ? 'PESO' : 'DÓLAR ESTADOUNIDENSE',
      centPlural: 'CENTAVOS',
      centSingular: 'CENTAVO',
    };
    const amountInWords = booking.amount ? numeroALetras(booking.amount, currencyConfig) : '';


    const replacements: { [key: string]: string } = {
        '{{inquilino.nombre}}': tenant.name,
        '{{inquilino.dni}}': tenant.dni || 'N/A',
        '{{inquilino.direccion}}': `${tenant.address || ''}, ${tenant.city || ''}`.trim().replace(/^,|,$/g, ''),
        '{{propiedad.nombre}}': property.name,
        '{{propiedad.direccion}}': property.address,
        '{{fechaCheckIn}}': format(new Date(booking.startDate), "dd 'de' LLLL 'de' yyyy", { locale: es }),
        '{{fechaCheckOut}}': format(new Date(booking.endDate), "dd 'de' LLLL 'de' yyyy", { locale: es }),
        '{{monto}}': formatCurrency(booking.amount, booking.currency),
        '{{montoEnLetras}}': amountInWords,
        '{{fechaActual}}': format(new Date(), "dd 'de' LLLL 'de' yyyy", { locale: es }),
    };

    let processedTemplate = property.contractTemplate || 'No hay plantilla de contrato definida para esta propiedad.';

    for (const key in replacements) {
        processedTemplate = processedTemplate.replace(new RegExp(key, 'g'), replacements[key]);
    }
    
    const paragraphs = processedTemplate.split('\n').filter(p => p.trim() !== '');

    return (
        <div className="bg-white text-black p-4 sm:p-8 md:p-12 print:p-0">
             <div className="max-w-4xl mx-auto bg-white p-8 print:p-0">
                <header className="flex justify-between items-center pb-8 border-b">
                    <div>
                        <Image src={LogoCont} alt="Logo" width={225} height={60} placeholder="blur" />
                    </div>
                    <div className="print:hidden">
                        <h1 className="text-2xl font-bold text-right">Vista Previa del Contrato</h1>
                        <ContractActions />
                    </div>
                </header>
                
                <main className="mt-8">
                    <div className="prose prose-sm sm:prose-base max-w-none text-justify space-y-4">
                        {paragraphs.map((p, index) => (
                            <p key={index}>{p}</p>
                        ))}
                    </div>
                </main>

                <footer className="mt-40 flex justify-between items-end">
                    <div className="text-center">
                        <div className="h-20"></div>
                        <p className="pt-2 border-t border-black w-48 text-center">Firma Locatario</p>
                    </div>
                    <div className="text-center">
                        <div className="h-20 flex items-center justify-center">
                            <Image src={Firma} alt="Firma" width={109} height={99} placeholder="blur" />
                        </div>
                        <p className="pt-2 border-t border-black w-48 text-center">Firma Locador</p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
