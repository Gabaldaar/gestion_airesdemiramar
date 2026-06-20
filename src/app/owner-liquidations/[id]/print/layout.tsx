import "../../../globals.css";

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
      <body>{children}</body>
    </html>
  );
}
