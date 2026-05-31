import { Inter } from "next/font/google";
import "../../app/globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
