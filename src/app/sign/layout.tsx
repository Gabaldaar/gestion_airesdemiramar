import "../../app/globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata = {
  title: "Firmar Contrato de Alquiler",
  description: "Firma digital de contrato de alquiler temporario",
};

export default function SignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
