
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutManager from "@/components/layout-manager";
import { AuthProvider } from "@/components/auth-provider";
import PwaSetup from "@/components/pwa-setup";


const inter = Inter({ subsets: ["latin"] });

const APP_NAME = "Gestión - Aires de Miramar";
const APP_DESCRIPTION = "Gestión de alquileres temporarios";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: APP_NAME,
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: "#17628d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png"></link>
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <LayoutManager>{children}</LayoutManager>
        </AuthProvider>
        <PwaSetup />
      </body>
    </html>
  );
}
