import "../globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata = {
  title: "Rendición de Cuentas",
  description: "Visualización de rendición de cuentas para propietarios",
};

export default function LiquidationViewLayout({
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
