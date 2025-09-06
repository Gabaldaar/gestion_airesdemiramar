import { Inter } from "next/font/google";
import "../globals.css";
import { getBookingWithDetails } from "@/lib/data";
import { format } from "date-fns";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const bookingId = typeof searchParams.id === 'string' ? searchParams.id : undefined;

  if (!bookingId) {
    return {
      title: "Contrato de Alquiler",
      description: "Visualización de contrato para imprimir",
    };
  }

  const booking = await getBookingWithDetails(bookingId);

  // Verificación robusta: nos aseguramos de que booking, tenant y property existan
  // y tengan las propiedades que necesitamos (name).
  if (!booking || !booking.tenant?.name || !booking.property?.name) {
    return {
      title: "Contrato de Alquiler",
      description: "Visualización de contrato para imprimir",
    };
  }

  const checkInDate = format(new Date(booking.startDate), 'yyyy-MM-dd');
  const tenantName = booking.tenant.name.replace(/ /g, '_');
  const propertyName = booking.property.name.replace(/ /g, '_');
  
  const dynamicTitle = `Contrato_${tenantName}-${propertyName}-${checkInDate}`;

  return {
    title: dynamicTitle,
    description: `Contrato de alquiler para ${booking.tenant.name} en ${booking.property.name}`,
  };
}


export default function ContractLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
