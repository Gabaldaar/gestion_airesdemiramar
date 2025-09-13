
'use client';

import Link from "next/link";
import {
  Bell,
  Home,
  Users,
  Building,
  CreditCard,
  LineChart,
  Settings,
  FileText,
  CircleHelp,
  Landmark,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";

const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/properties", label: "Propiedades", icon: Building },
    { href: "/tenants", label: "Inquilinos", icon: Users },
    { href: "/bookings", label: "Reservas", icon: FileText },
    { href: "/payments", label: "Ingresos", icon: Wallet },
    { href: "/expenses", label: "Gastos", icon: CreditCard },
    { href: "/reports", label: "Reportes", icon: LineChart },
    { href: "/templates", label: "Plantillas", icon: FileText },
    { href: "/settings", label: "Configuración", icon: Settings },
    { href: "/help", label: "Ayuda", icon: CircleHelp },
];


export default function Sidebar() {
    const pathname = usePathname();
    
    return (
        <div className="hidden border-r bg-muted/40 md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                         <span className="text-lg">Aires de Miramar</span>
                    </Link>
                </div>
                <div className="flex-1">
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                        {navItems.map(({ href, label, icon: Icon }) => {
                            const isActive = pathname === href;
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                        isActive && "bg-muted text-primary"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </div>
    );
}
