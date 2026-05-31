import { Inter } from "next/font/google";
import "../../../globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Recibo de Liquidación",
  description: "Comprobante de liquidación de servicios",
};

export default function PrintLayout({
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
