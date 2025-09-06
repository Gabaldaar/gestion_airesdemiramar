import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
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
      <body className={cn(inter.className, "min-h-screen bg-background font-sans antialiased")}>
        <LayoutManager>{children}</LayoutManager>
      </body>
    </html>
  );
}
