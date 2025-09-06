
'use client';

import { getBookingWithDetails } from "@/lib/data";
import { notFound } from "next/navigation";
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Logo from '@/assets/logocont.png';
import Signature from '@/assets/firma.png';
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

// Client Component for interactive elements
function ContractActions() {
    return (
        <Button onClick={() => window.print()}>Imprimir / Guardar como PDF</Button>
    );
}


function ContractPageContent({ booking }: { booking: NonNullable<Awaited<ReturnType<typeof getBookingWithDetails>>> }) {
    
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
        '{{inquilino.direccion}}': `${tenant.address}, ${tenant.city}`.trim(),
        '{{propiedad.nombre}}': property.name,
        '{{propiedad.direccion}}': property.address,
        '{{fechaCheckIn}}': format(new Date(booking.startDate), "dd 'de' LLLL 'de' yyyy", { locale: es }),
        '{{fechaCheckOut}}': format(new Date(booking.endDate), "dd 'de' LLLL 'de' yyyy", { locale: es }),
        '{{monto}}': formatCurrency(booking.amount, booking.currency)
    };
    
    // Add aliases
    replacements['{{inquilino}}'] = replacements['{{inquilino.nombre}}'];
    replacements['{{propiedad}}'] = replacements['{{propiedad.nombre}}'];


    let processedTemplate = property.contractTemplate || 'No hay plantilla de contrato definida para esta propiedad.';

    for (const key in replacements) {
        processedTemplate = processedTemplate.replace(new RegExp(key, 'g'), replacements[key]);
    }
    
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
                    <div 
                        className="prose prose-sm sm:prose-base max-w-none"
                        dangerouslySetInnerHTML={{ __html: processedTemplate.replace(/\n/g, '<br />') }}
                    >
                    </div>
                </main>

                <footer className="mt-16">
                   {Signature && <Image src={Signature} alt="Firma" width={200} height={100} />}
                    <p className="pt-2 border-t mt-2">Firma</p>
                </footer>
            </div>
        </div>
    );
}

export default async function ContractPage({ params }: { params: { id: string } }) {
    const bookingId = params.id;
    const booking = await getBookingWithDetails(bookingId);

    if (!booking) {
        notFound();
    }

    return <ContractPageContent booking={booking} />;
}
