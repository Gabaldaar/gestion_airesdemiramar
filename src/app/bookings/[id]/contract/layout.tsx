
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contrato de Alquiler",
  description: "Visualización de contrato de alquiler temporario",
};

export default function ContractLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-gray-200 print:bg-white">
          {children}
      </body>
    </html>
  );
}
