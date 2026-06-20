import "../../../globals.css";

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
      <body>{children}</body>
    </html>
  );
}
