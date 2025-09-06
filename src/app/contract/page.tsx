import { getBookingWithDetails } from "@/lib/data";
import { notFound } from "next/navigation";
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Logo from '@/assets/logocont.png';
import Signature from '@/assets/firma.png';
import ContractActions from "@/components/contract-actions";
import { Suspense } from "react";

// The main page is a Client Component to handle searchParams
export default function ContractPageWrapper({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    const bookingId = typeof searchParams.id === 'string' ? searchParams.id : undefined;

    if (!bookingId) {
        return <div className="p-8 text-red-500 text-center">ID de reserva no proporcionado.</div>
    }

    return (
        <Suspense fallback={<div className="p-8 text-center">Cargando contrato...</div>}>
            <ContractPage bookingId={bookingId} />
        </Suspense>
    );
}


// This is the Server Component that fetches data
async function ContractPage({ bookingId }: { bookingId: string }) {
    const booking = await getBookingWithDetails(bookingId);

    if (!booking) {
        notFound();
    }
    
    const { tenant, property } = booking;
    if (!tenant || !property) {
        return <div className="p-8 text-red-500">Faltan datos del inquilino o la propiedad para generar el contrato.</div>
    }

    const formatCurrency = (amount: number, currency: 'USD' | 'ARS') => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    }
    
    const replacements: { [key: string]: string } = {
        '{{inquilino.nombre}}': tenant.name,
        '{{inquilino.dni}}': tenant.dni || 'N/A',
        '{{inquilino.direccion}}': `${tenant.address || ''}, ${tenant.city || ''}`.trim().replace(/^,|,$/g, ''),
        '{{propiedad.nombre}}': property.name,
        '{{propiedad.direccion}}': property.address,
        '{{fechaCheckIn}}': format(new Date(booking.startDate), "dd 'de' LLLL 'de' yyyy", { locale: es }),
        '{{fechaCheckOut}}': format(new Date(booking.endDate), "dd 'de' LLLL 'de' yyyy", { locale: es }),
        '{{monto}}': formatCurrency(booking.amount, booking.currency)
    };

    let processedTemplate = property.contractTemplate || 'No hay plantilla de contrato definida para esta propiedad.';

    for (const key in replacements) {
        processedTemplate = processedTemplate.replace(new RegExp(key, 'g'), replacements[key]);
    }
    
    const paragraphs = processedTemplate.split('\n').filter(p => p.trim() !== '');

    return (
        <div className="bg-white text-black p-4 sm:p-8 md:p-12 print:p-0">
             <div className="max-w-4xl mx-auto bg-white p-8 print:p-0">
                <header className="flex justify-between items-center pb-8 border-b print:hidden">
                    <h1 className="text-2xl font-bold">Vista Previa del Contrato</h1>
                    <ContractActions />
                </header>
                 <header className="hidden print:flex justify-between items-center pb-8 border-b">
                    {Logo && <Image src={Logo} alt="Logo" width={150} height={75} />}
                </header>

                <main className="mt-8">
                    <div className="prose prose-sm sm:prose-base max-w-none text-justify space-y-4">
                        {paragraphs.map((p, index) => (
                            <p key={index}>{p}</p>
                        ))}
                    </div>
                </main>

                <footer className="mt-16 flex justify-between items-end">
                    <div className="text-center">
                         <div className="h-[60px]"></div>
                        <p className="pt-2 border-t mt-2 w-48 text-center">Firma Locatario</p>
                    </div>
                    <div className="text-center">
                        {Signature && <Image src={Signature} alt="Firma" width={120} height={60} style={{width: '60%', margin: '0 auto'}} />}
                        <p className="pt-2 border-t mt-2 w-48 text-center">Firma Locador</p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
