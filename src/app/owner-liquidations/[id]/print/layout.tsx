import { Inter } from "next/font/google";
import "../../../globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Rendición de Cuentas",
  description: "Comprobante de rendición de cuentas para propietarios",
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
