import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutManager from "@/components/layout-manager";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gestión - Aires de Miramar",
  description: "Gestión de alquileres temporarios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <LayoutManager>{children}</LayoutManager>
      </body>
    </html>
  );
}
