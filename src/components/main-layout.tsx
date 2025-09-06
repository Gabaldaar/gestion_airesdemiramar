
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Building2, Users, Calendar, Settings, Menu, BarChart3, ShoppingCart, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useState } from 'react';
import Image from 'next/image';
import Logo from '@/assets/logo.png';


const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/properties', label: 'Propiedades', icon: Building2 },
  { href: '/tenants', label: 'Inquilinos', icon: Users },
  { href: '/bookings', label: 'Reservas', icon: Calendar },
  { href: '/payments', label: 'Ingresos', icon: CreditCard },
  { href: '/expenses', label: 'Gastos', icon: ShoppingCart },
  { href: '/reports', label: 'Reportes', icon: BarChart3 },
  { href: '/settings', label: 'Configuración', icon: Settings },
];

function SidebarNav({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
              isActive && 'bg-muted text-primary'
            )}
            onClick={onLinkClick} // Close sheet on click
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
             <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
                <Image src={Logo} alt="Logo de la aplicacion" width={180} height={40} />
            </Link>
          </div>
          <div className="flex-1">
            <SidebarNav />
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
           <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="ml-2">Menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
               <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                 <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
                    <Image src={Logo} alt="Logo de la aplicacion" width={180} height={40} />
                </Link>
              </div>
              <SidebarNav onLinkClick={() => setIsSheetOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className='ml-auto'>
            {/* User menu can go here */}
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-2 md:p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
