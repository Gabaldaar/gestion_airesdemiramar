
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutManager from "@/components/layout-manager";
import { AuthProvider } from "@/components/auth-provider";


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
        <AuthProvider>
            <LayoutManager>{children}</LayoutManager>
        </AuthProvider>
      </body>
    </html>
  );
}
