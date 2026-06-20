import "../globals.css";

export const metadata = {
  title: "Contrato de Alquiler",
  description: "Visualización de contrato para imprimir",
};


export default function ContractLayout({
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
