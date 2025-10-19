

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Building2, Users, Calendar, Settings, Menu, BarChart3, ShoppingCart, CreditCard, Mail, LogOut, CircleHelp, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useState } from 'react';
import Image from 'next/image';
import Logo from '@/assets/logo.png';
import { Toaster } from './ui/toaster';
import { useAuth } from './auth-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';


const mainNavItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/properties', label: 'Propiedades', icon: Building2 },
  { href: '/tenants', label: 'Inquilinos', icon: Users },
  { href: '/bookings', label: 'Reservas', icon: Calendar },
  { href: '/payments', label: 'Pagos', icon: CreditCard },
  { href: '/expenses', label: 'Gastos', icon: ShoppingCart },
  { href: '/informes', label: 'Informes', icon: BarChart3 },
  { href: '/templates', label: 'Plantillas', icon: Mail },
  { href: '/settings', label: 'Configuración', icon: Settings },
];

const helpNavItem = { href: '/help', label: 'Ayuda', icon: CircleHelp };

function SidebarNav({ onLinkClick, isCollapsed }: { onLinkClick?: () => void, isCollapsed: boolean }) {
  const pathname = usePathname();
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION;
  
  const renderLink = (item: { href: string, label: string, icon: React.ElementType }) => {
    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
    
    if (isCollapsed) {
        return (
            <TooltipProvider key={item.href}>
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <Link
                            href={item.href}
                            className={cn(
                                'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                                isActive && 'bg-accent text-accent-foreground'
                            )}
                            onClick={onLinkClick}
                            >
                            <item.icon className="h-5 w-5" />
                            <span className="sr-only">{item.label}</span>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="flex items-center gap-4">
                       {item.label}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
          isActive && 'bg-muted text-primary'
        )}
        onClick={onLinkClick}
      >
        <item.icon className="h-4 w-4" />
        {item.label}
      </Link>
    );
  }

  return (
    <div className="flex flex-col justify-between h-full">
        <div>
            <nav className={cn("grid items-start text-sm font-medium", isCollapsed ? "grid-flow-row justify-center gap-2 px-2" : "px-2 lg:px-4")}>
                {mainNavItems.map(renderLink)}
            </nav>
        </div>
        <div>
            <nav className={cn("grid items-start text-sm font-medium mt-auto", isCollapsed ? "grid-flow-row justify-center gap-2 px-2" : "px-2 lg:px-4")}>
                {renderLink(helpNavItem)}
            </nav>
             {appVersion && (
                <div className={cn("mt-4 text-xs text-muted-foreground", isCollapsed ? "text-center" : "px-4")}>
                   v{appVersion}
                </div>
            )}
        </div>
    </div>
  );
}

function UserMenu() {
    const { user, signOut } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };

    if (!user) return null;
    
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                    {user.photoURL ? (
                        <Image
                            src={user.photoURL}
                            alt={user.displayName || "User Avatar"}
                            width={36}
                            height={36}
                            className="rounded-full"
                        />
                    ) : (
                         <Users className="h-5 w-5" />
                    )}
                    <span className="sr-only">Toggle user menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.displayName || 'Mi Cuenta'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}


export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
        <div className={cn(
            "grid min-h-screen w-full",
            isCollapsed ? "md:grid-cols-[5rem_1fr]" : "md:grid-cols-[200px_1fr] lg:grid-cols-[240px_1fr]",
            "transition-all duration-300 ease-in-out"
        )}>
        <div className={cn("hidden border-r bg-muted/40 md:flex md:flex-col")}>
            <div className="flex h-14 items-center justify-between border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/" className={cn("flex items-center gap-2 font-semibold text-primary", isCollapsed && "justify-center")}>
                    <Image src={Logo} alt="Logo de la aplicacion" width={isCollapsed ? 40 : 180} height={40} className={cn('transition-all', isCollapsed && 'w-auto h-auto')}/>
                    <span className={cn('sr-only', isCollapsed && 'hidden')}>Aires de Miramar</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className={cn(isCollapsed && 'mr-auto')}>
                    <ChevronLeft className={cn("h-5 w-5 transition-transform", isCollapsed && "rotate-180")} />
                </Button>
            </div>
            <div className="flex-1 overflow-auto py-2">
                <SidebarNav isCollapsed={isCollapsed} />
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
                    <SheetHeader className="h-14 flex flex-row items-center border-b px-4 lg:h-[60px] lg:px-6">
                        <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
                            <Image src={Logo} alt="Logo de la aplicacion" width={180} height={40} />
                        </Link>
                         <SheetTitle className="sr-only">Menú Principal</SheetTitle>
                    </SheetHeader>
                    <div className="flex-1">
                        <SidebarNav onLinkClick={() => setIsSheetOpen(false)} isCollapsed={false} />
                    </div>
                </SheetContent>
            </Sheet>
            <div className='ml-auto'>
                <UserMenu />
            </div>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-2 md:p-4 lg:gap-6 lg:p-6 overflow-x-auto">
            {children}
            </main>
            <Toaster />
        </div>
        </div>
    </div>
  );
}
