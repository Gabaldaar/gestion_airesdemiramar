'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn, parseDateSafely } from '@/lib/utils';
import { 
    Home, 
    Building2, 
    Users, 
    Calendar, 
    Settings, 
    Menu, 
    BarChart3, 
    ShoppingCart, 
    CreditCard, 
    LogOut, 
    ChevronLeft, 
    WifiOff, 
    ClipboardList, 
    Wrench, 
    Languages, 
    Check, 
    UserCircle, 
    ShieldCheck, 
    PlusCircle, 
    Loader2, 
    MapPin, 
    Notebook, 
    Info, 
    CircleHelp, 
    History, 
    Briefcase,
    Sun,
    Moon,
    FileText,
    ArrowLeftRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Toaster } from './ui/toaster';
import { useAuth } from './auth-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { APP_CONFIG } from '@/lib/app-config';
import { doc, onSnapshot, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BrandingSettings, UserRole, Property, Tenant, Booking, DateBlock, TaskCategory, TaskScope, Provider } from '@/lib/data';
import { useTranslation } from '@/i18n/useTranslation';
import { SUPPORTED_LANGUAGES } from '@/i18n/config';
import { BookingAddForm } from './booking-add-form';
import { TaskAddForm } from './task-add-form';
import { ExpenseAddForm } from './expense-add-form';
import { ProductTour } from './product-tour';
import { differenceInDays, startOfToday } from 'date-fns';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

function SidebarNav({ 
    onLinkClick, 
    isCollapsed, 
    pendingLiquidationsCount, 
    pendingBookingsCount, 
    upcomingAlertsCount,
    isPersonalFlavor, 
    version,
    activeRole 
}: { 
    onLinkClick?: () => void, 
    isCollapsed: boolean, 
    pendingLiquidationsCount: number, 
    pendingBookingsCount: number, 
    upcomingAlertsCount: number,
    isPersonalFlavor: boolean, 
    version: string,
    activeRole: UserRole | null
}) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const allNavItems = [
    { href: '/', label: t('navigation.home'), icon: Home, roles: ['admin', 'socio', 'staff'], badge: 'alerts', id: 'nav-home' },
    { href: '/owner/dashboard', label: t('navigation.home'), icon: Home, roles: ['owner'], id: 'nav-owner-home' },
    { href: '/properties', label: t('navigation.properties'), icon: Building2, roles: ['admin', 'socio', 'staff'], id: 'nav-properties' },
    { href: '/tenants', label: t('navigation.tenants'), icon: Users, roles: ['admin', 'socio', 'staff'], id: 'nav-tenants' },
    { href: '/providers', label: t('navigation.providers'), icon: Wrench, roles: ['admin', 'socio'], personalOnly: true, id: 'nav-providers' },
    { href: '/bookings', label: t('navigation.bookings'), icon: Calendar, roles: ['admin', 'socio', 'staff'], badge: 'bookings', id: 'nav-bookings' },
    { href: '/contratos', label: t('navigation.contracts'), icon: FileText, roles: ['admin', 'socio', 'staff'], id: 'nav-contratos' },
    { href: '/tasks', label: t('navigation.tasks'), icon: ClipboardList, roles: ['admin', 'socio', 'staff'], personalOnly: true, id: 'nav-tasks' },
    { href: '/payments', label: t('navigation.payments'), icon: CreditCard, roles: ['admin', 'socio', 'staff'], personalOnly: true, id: 'nav-payments' },
    { href: '/liquidations', label: t('navigation.liquidations'), icon: Briefcase, roles: ['admin', 'socio'], badge: 'liquidations', personalOnly: true, id: 'nav-liquidations' },
    { href: '/expenses', label: t('navigation.expenses'), icon: ShoppingCart, roles: ['admin', 'socio', 'staff'], personalOnly: true, id: 'nav-expenses' },
    { href: '/informes', label: t('navigation.reports'), icon: BarChart3, roles: ['admin', 'socio'], personalOnly: true, id: 'nav-informes' },
    { href: '/help', label: t('navigation.help'), icon: CircleHelp, roles: ['admin', 'socio', 'staff'], id: 'nav-help' },
    { href: '/settings', label: t('navigation.settings'), icon: Settings, roles: ['admin', 'socio'], id: 'nav-settings' },
  ];

  const navItems = allNavItems.filter(item => {
    if (activeRole && !item.roles.includes(activeRole)) return false;
    if (!isPersonalFlavor && (item as any).personalOnly) return false;
    return true;
  });

  const badgeCounts = {
      alerts: upcomingAlertsCount,
      bookings: pendingBookingsCount,
      liquidations: pendingLiquidationsCount,
  };
  
  const renderLink = (item: { href: string, label: string, icon: React.ElementType, badge?: string, id: string }) => {
    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
    const badgeCount = item.badge ? badgeCounts[item.badge as keyof typeof badgeCounts] : 0;
    const showBadge = badgeCount > 0;
    
    if (isCollapsed) {
        return (
            <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                    <Link
                        id={item.id}
                        href={item.href}
                        className={cn(
                            'relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                            isActive && 'bg-accent text-accent-foreground'
                        )}
                        onClick={onLinkClick}
                        >
                        <item.icon className="h-5 w-5" />
                            {showBadge && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground">
                                {badgeCount}
                            </span>
                        )}
                        <span className="sr-only">{item.label}</span>
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="flex items-center gap-4">
                    {item.label}
                    {showBadge && <span className="ml-auto text-muted-foreground">({badgeCount})</span>}
                </TooltipContent>
            </Tooltip>
        )
    }

    return (
      <Link
        key={item.href}
        id={item.id}
        href={item.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
          isActive && 'bg-muted text-primary'
        )}
        onClick={onLinkClick}
      >
        <item.icon className="h-4 w-4" />
        <span className="flex-1">{item.label}</span>
        {showBadge && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {badgeCount}
            </span>
        )}
      </Link>
    );
  }

  return (
    <div className="flex flex-col justify-between h-full">
        <div>
            <nav className={cn("grid items-start text-sm font-medium", isCollapsed ? "grid-flow-row justify-center gap-2 px-2" : "px-2 lg:px-4")}>
                {navItems.map(renderLink)}
            </nav>
        </div>
        <div className={cn("mt-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground opacity-50", isCollapsed ? "text-center" : "px-4")}>
            v{version}
        </div>
    </div>
  );
}

function BottomNav({ 
    activeRole, 
    upcomingAlertsCount, 
    pendingBookingsCount 
}: { 
    activeRole: UserRole | null,
    upcomingAlertsCount: number,
    pendingBookingsCount: number
}) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const isSystemUser = activeRole === 'admin' || activeRole === 'socio' || activeRole === 'staff';

  if (!isSystemUser) return null;

  const navItems = [
    { href: '/', label: t('navigation.home'), icon: Home, badge: upcomingAlertsCount, id: 'nav-home-mobile' },
    { href: '/properties', label: t('navigation.properties'), icon: Building2, id: 'nav-properties-mobile' },
    { href: '/tenants', label: t('navigation.tenants'), icon: Users, id: 'nav-tenants-mobile' },
    { href: '/bookings', label: t('navigation.bookings'), icon: Calendar, badge: pendingBookingsCount, id: 'nav-bookings-mobile' },
    { href: '/contratos', label: t('navigation.contracts'), icon: FileText, id: 'nav-contratos-mobile' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
      <nav className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const hasBadge = (item.badge || 0) > 0;
          return (
            <Link
              key={item.href}
              id={item.id}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 gap-1 transition-all duration-200 relative",
                isActive ? "text-primary scale-110" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
              {hasBadge && (
                  <span className="absolute top-1 right-1/4 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[8px] font-black text-white border-2 border-background">
                      {item.badge}
                  </span>
              )}
              <span className={cn(
                "text-[9px] uppercase font-bold tracking-tighter transition-all",
                isActive ? "opacity-100" : "opacity-70"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function QuickActionFAB() {
    const { t } = useTranslation();
    const { activeRole, orgId } = useAuth();
    
    const [properties, setProperties] = useState<Property[]>([]);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [blocks, setBlocks] = useState<DateBlock[]>([]);
    const [taskCategories, setTaskCategories] = useState<TaskCategory[]>([]);
    const [taskScopes, setTaskScopes] = useState<TaskScope[]>([]);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
    
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [isTaskOpen, setIsTaskOpen] = useState(false);
    const [isExpenseOpen, setIsExpenseOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLeftPosition, setIsLeftPosition] = useState(false);

    useEffect(() => {
        const savedPosition = localStorage.getItem('regentum_fab_position');
        if (savedPosition === 'left') setIsLeftPosition(true);
    }, []);

    const togglePosition = () => {
        const newPos = !isLeftPosition;
        setIsLeftPosition(newPos);
        localStorage.setItem('regentum_fab_position', newPos ? 'left' : 'right');
    };

    const loadData = useCallback(async () => {
        if (!orgId) return;
        setIsLoading(true);
        try {
            const getQ = (c: string) => query(collection(db, c), where('orgId', '==', orgId));

            const safeGetDocsFiltered = async (collName: string, altName: string) => {
                try {
                    const snap = await getDocs(getQ(collName));
                    if (!snap.empty) return snap;
                    return await getDocs(getQ(altName));
                } catch (e) {
                    try {
                        return await getDocs(getQ(altName));
                    } catch (e2) {
                        return { docs: [] } as any;
                    }
                }
            };

            const [pSnap, tSnap, bSnap, blSnap, cSnap, sSnap, prSnap, ecSnap] = await Promise.all([
                getDocs(getQ('properties')),
                getDocs(getQ('tenants')),
                getDocs(getQ('bookings')),
                getDocs(getQ('date_blocks')),
                safeGetDocsFiltered('task_categories', 'taskCategories'),
                safeGetDocsFiltered('task_scopes', 'taskScopes'),
                getDocs(getQ('providers')),
                safeGetDocsFiltered('expense_categories', 'expenseCategories')
            ]);

            setProperties(pSnap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as Property)));
            setTenants(tSnap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as Tenant)));
            setBookings(bSnap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as Booking)));
            setBlocks(blSnap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as DateBlock)));
            setTaskCategories(cSnap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as TaskCategory)));
            setTaskScopes(sSnap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as TaskScope)));
            setProviders(prSnap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as Provider)));
            setExpenseCategories(ecSnap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as any)));
        } catch (e) { 
            console.error("Error al precargar datos para FAB:", e); 
        } finally {
            setIsLoading(false);
        }
    }, [orgId]);

    useEffect(() => {
        if (activeRole === 'admin' || activeRole === 'socio' || activeRole === 'staff') {
            loadData();
        }
    }, [activeRole, loadData]);

    if (activeRole !== 'admin' && activeRole !== 'socio' && activeRole !== 'staff') return null;

    return (
        <>
            <div className={cn(
                "md:hidden fixed bottom-20 z-50 transition-all duration-300",
                isLeftPosition ? "left-6" : "right-6"
            )}>
                <DropdownMenu onOpenChange={(open) => open && loadData()}>
                    <DropdownMenuTrigger asChild>
                        <Button size="icon" className="h-14 w-14 rounded-full shadow-2xl bg-primary text-white hover:scale-110 active:scale-95 transition-transform">
                            {isLoading ? <Loader2 className="h-7 w-7 animate-spin" /> : <PlusCircle className="h-8 w-8 stroke-[3px]" />}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isLeftPosition ? "start" : "end"} className="w-64 mb-4 rounded-2xl p-2 shadow-xl border-2 bg-background">
                        <DropdownMenuLabel className="text-[10px] uppercase font-black text-muted-foreground px-3 mb-1">{t('navigation.quick_actions')}</DropdownMenuLabel>
                        
                        <DropdownMenuItem onClick={() => setIsBookingOpen(true)} className="py-3 rounded-xl gap-3 cursor-pointer">
                            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg"><Calendar className="h-4 w-4" /></div>
                            <span className="font-bold text-sm">{t('navigation.new_booking')}</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => setIsExpenseOpen(true)} className="py-3 rounded-xl gap-3 cursor-pointer">
                            <div className="p-2 bg-red-100 text-red-700 rounded-lg"><ShoppingCart className="h-4 w-4" /></div>
                            <span className="font-bold text-sm">{t('navigation.new_expense')}</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => setIsTaskOpen(true)} className="py-3 rounded-xl gap-3 cursor-pointer">
                            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg"><ClipboardList className="h-4 w-4" /></div>
                            <span className="font-bold text-sm">{t('navigation.new_task')}</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem onClick={togglePosition} className="py-2 rounded-xl gap-3 opacity-60 hover:opacity-100 cursor-pointer">
                            <div className="p-2 bg-muted rounded-lg"><ArrowLeftRight className="h-4 w-4" /></div>
                            <span className="text-xs font-semibold">Mover botón a la {isLeftPosition ? 'derecha' : 'izquierda'}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <BookingAddForm 
                isOpen={isBookingOpen} 
                onOpenChange={setIsBookingOpen} 
                tenants={tenants} 
                properties={properties} 
                allBookings={bookings} 
                allBlocks={blocks} 
                onDataChanged={() => window.location.reload()}
            />
            
            <TaskAddForm 
                isOpen={isTaskOpen} 
                onOpenChange={setIsTaskOpen} 
                properties={properties} 
                providers={providers} 
                categories={taskCategories} 
                scopes={taskScopes} 
                onTaskAdded={() => window.location.reload()} 
                currencySettings={null}
            />

            <ExpenseAddForm 
                isOpen={isExpenseOpen} 
                onOpenChange={setIsExpenseOpen} 
                assignment={{ type: 'property', id: '' }} 
                categories={expenseCategories} 
                properties={properties} 
                scopes={taskScopes} 
                providers={providers} 
                onExpenseAdded={() => window.location.reload()} 
                currencySettings={null}
            />
        </>
    );
}

function UserMenu() {
    const { user, appUser, signOut, activeRole, setActiveRole } = useAuth();
    const { t, language, setLanguage } = useTranslation();
    const router = useRouter();
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [ownsProperties, setOwnsProperties] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.classList.toggle('dark', savedTheme === 'dark');
        }
    }, []);

    useEffect(() => {
        const email = (user?.email || user?.providerData[0]?.email || appUser?.email || '').toLowerCase().trim();
        if (!email) {
            setOwnsProperties(false);
            return;
        }

        const fetchOwnProperties = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'properties'));
                const hasMatch = snapshot.docs.some(doc => {
                    const data = doc.data();
                    return (data.ownerEmail || '').toLowerCase().trim() === email;
                });
                setOwnsProperties(hasMatch);
            } catch (e) {
                console.error("Error al buscar propiedades del dueño:", e);
                setOwnsProperties(false);
            }
        };
        fetchOwnProperties();
    }, [user, appUser]);

    const toggleTheme = (newTheme: 'light' | 'dark') => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            router.push('/login');
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    if (!user) return null;
    
    return (
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button id="user-menu-trigger" variant="secondary" size="icon" className="rounded-full overflow-hidden">
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
                    <DropdownMenuLabel>{user.displayName || t('navigation.home')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {ownsProperties && activeRole !== 'owner' && (
                        <DropdownMenuItem onClick={() => { setActiveRole('owner'); router.push('/owner/dashboard'); }}>
                            <UserCircle className="mr-2 h-4 w-4 text-primary" />
                            <span>{t('navigation.view_as_owner')}</span>
                        </DropdownMenuItem>
                    )}
                    
                    {activeRole === 'owner' && appUser?.role && appUser.role !== 'owner' && (
                        <DropdownMenuItem onClick={() => { setActiveRole(appUser.role); router.push('/'); }}>
                            {appUser.role === 'admin' ? (
                                <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
                            ) : (
                                <Wrench className="mr-2 h-4 w-4 text-primary" />
                            )}
                            <span>
                                {appUser.role === 'admin' 
                                    ? t('navigation.view_as_admin') 
                                    : t('navigation.view_as_staff')}
                            </span>
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            {theme === 'light' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                            <span>{t('navigation.theme')}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => toggleTheme('light')}>
                                <Sun className="mr-2 h-4 w-4" />
                                <span className="flex items-center justify-between w-full">{t('navigation.theme_light')} {theme === 'light' && <Check className="ml-2 h-4 w-4" />}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleTheme('dark')}>
                                <Moon className="mr-2 h-4 w-4" />
                                <span className="flex items-center justify-between w-full">{t('navigation.theme_dark')} {theme === 'dark' && <Check className="ml-2 h-4 w-4" />}</span>
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <Languages className="mr-2 h-4 w-4" />
                            <span>{t('navigation.language')}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            {SUPPORTED_LANGUAGES.map((lang) => (
                                <DropdownMenuItem key={lang.code} onClick={() => setLanguage(lang.code)}>
                                    <span className="flex items-center justify-between w-full">
                                    {lang.name}
                                    {language === lang.code && <Check className="ml-2 h-4 w-4" />}
                                    </span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowLogoutConfirm(true)} className="text-destructive focus:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>{t('navigation.logout')}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('navigation.logout_confirm_title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('navigation.logout_confirm_desc')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSignOut} className="bg-destructive hover:bg-destructive/90">
                            {t('navigation.logout')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function OfflineWarning({ isOnline }: { isOnline: boolean }) {
    if (isOnline) {
        return null;
    }
    return (
        <div className="bg-yellow-500 text-black py-2 px-4">
            <div className="container mx-auto flex items-center justify-center gap-2 text-sm font-semibold">
                <WifiOff className="h-4 w-4" />
                <span>Estás trabajando sin conexión. Algunos datos pueden no estar actualizados.</span>
            </div>
        </div>
    )
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { appUser, activeRole, orgId } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  // Real-time Badge Counts
  const [pendingLiqCount, setPendingLiqCount] = useState(0);
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
  const [unliquidatedItemsCount, setUnliquidatedItemsCount] = useState(0);
  const [upcomingAlertsCount, setUpcomingAlertsCount] = useState(0);
  
  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  const isPersonalFlavor = appUser?.appFlavor !== 'commercial';

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setIsOnline(navigator.onLine);
    }
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // --- REAL-TIME LISTENERS FOR BADGES ---
    if (orgId && (activeRole === 'admin' || activeRole === 'socio' || activeRole === 'staff')) {
        const today = startOfToday();

        // 1. Pending Liquidations (Payouts)
        const liqUnsub = onSnapshot(query(collection(db, 'liquidations'), where('orgId', '==', orgId), where('status', 'in', ['pending_payment', 'partially_paid'])), (snap) => {
            setPendingLiqCount(snap.size);
        });

        // 2. Pending Bookings (Waiting status)
        const bookingsUnsub = onSnapshot(query(collection(db, 'bookings'), where('orgId', '==', orgId), where('status', '==', 'pending')), (snap) => {
            setPendingBookingsCount(snap.size);
        });

        // 3. Unliquidated Items (Worklogs + Adjustments)
        const workUnsub = onSnapshot(query(collection(db, 'workLogs'), where('orgId', '==', orgId), where('status', '==', 'pending_liquidation')), (snap) => {
            const workSize = snap.size;
            const adjUnsub = onSnapshot(query(collection(db, 'manualAdjustments'), where('orgId', '==', orgId), where('status', '==', 'pending_liquidation')), (adjSnap) => {
                setUnliquidatedItemsCount(workSize + adjSnap.size);
            });
            return adjUnsub;
        });

        // 4. Upcoming Alerts (Check-in/out logic on client)
        const alertsUnsub = onSnapshot(doc(db, 'settings', `alerts_${orgId}`), (settingsSnap) => {
            const settings = settingsSnap.data();
            const checkInDays = settings?.checkInDays ?? 7;
            const checkOutDays = settings?.checkOutDays ?? 3;

            return onSnapshot(query(collection(db, 'bookings'), where('orgId', '==', orgId), where('status', 'in', ['active', 'pending'])), (snap) => {
                let count = 0;
                snap.docs.forEach(doc => {
                    const b = doc.data();
                    const start = b.startDate ? new Date(b.startDate) : null;
                    const end = b.endDate ? new Date(b.endDate) : null;
                    if (start && !isNaN(start.getTime())) {
                        const diffIn = differenceInDays(start, today);
                        if (diffIn >= 0 && diffIn <= checkInDays) count++;
                    }
                    if (end && !isNaN(end.getTime())) {
                        const diffOut = differenceInDays(end, today);
                        if (diffOut >= 0 && diffOut <= checkOutDays) count++;
                    }
                });
                setUpcomingAlertsCount(count);
            });
        });

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            liqUnsub();
            bookingsUnsub();
            workUnsub();
            alertsUnsub();
        };
    }

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, [activeRole, orgId]);

  useEffect(() => {
    if (orgId) {
        const unsubBranding = onSnapshot(doc(db, 'settings', `branding_${orgId}`), (snap) => {
            if (snap.exists()) setBranding(snap.data() as BrandingSettings);
        });
        return () => unsubBranding();
    }
  }, [orgId]);

  const totalLiquidationsBadge = pendingLiqCount + unliquidatedItemsCount;

  // App Badging API Logic
  useEffect(() => {
    const setBadge = async () => {
        if ('setAppBadge' in navigator && 'clearAppBadge' in navigator) {
            const totalCount = totalLiquidationsBadge + pendingBookingsCount + upcomingAlertsCount;
            try {
                if (totalCount > 0) {
                    await (navigator as any).setAppBadge(totalCount);
                } else {
                    await (navigator as any).clearAppBadge();
                }
            } catch (error) {
                console.error("App Badging API error:", error);
            }
        }
    };
    // Limpiamos al entrar
    if ('clearAppBadge' in navigator) (navigator as any).clearAppBadge();
    setBadge();
  }, [totalLiquidationsBadge, pendingBookingsCount, upcomingAlertsCount]);

  const appName = isPersonalFlavor ? (branding?.appName || APP_CONFIG.name) : APP_CONFIG.name;
  const logoSrc = isPersonalFlavor ? (branding?.logoMainUrl || APP_CONFIG.logo.main) : APP_CONFIG.logo.main;

  return (
    <TooltipProvider>
        <div className="min-h-screen bg-background font-sans antialiased">
            <div className={cn(
                "grid min-h-screen w-full",
                isCollapsed ? "md:grid-cols-[5rem_1fr]" : "md:grid-cols-[200px_1fr] lg:grid-cols-[240px_1fr]",
                "transition-all duration-300 ease-in-out"
            )}>
            <div className={cn("hidden border-r bg-muted/40 md:flex md:flex-col")}>
                <div className="flex h-14 items-center justify-between border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href="/" className={cn("flex items-center gap-2 font-semibold text-primary overflow-hidden", isCollapsed ? "justify-center w-full" : "w-40")}>
                        <div className={cn("relative h-10 transition-all", isCollapsed ? "w-8" : "w-full")}>
                            <Image 
                            src={logoSrc} 
                            alt={appName} 
                            fill
                            className={cn('transition-all object-contain', isCollapsed ? 'p-1' : 'p-0')}
                            priority
                            />
                        </div>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="shrink-0">
                        <ChevronLeft className={cn("h-5 w-5 transition-transform", isCollapsed && "rotate-180")} />
                    </Button>
                </div>
                <div className="flex-1 overflow-auto py-2">
                    <SidebarNav 
                        isCollapsed={isCollapsed} 
                        pendingLiquidationsCount={totalLiquidationsBadge} 
                        pendingBookingsCount={pendingBookingsCount} 
                        upcomingAlertsCount={upcomingAlertsCount}
                        isPersonalFlavor={isPersonalFlavor} 
                        version={APP_CONFIG.version}
                        activeRole={activeRole}
                    />
                </div>
            </div>
            <div className="flex flex-col relative">
                <header className="flex h-14 items-center justify-between border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                    <Button
                        id="mobile-menu-trigger"
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
                                <div className="relative h-10 w-40">
                                    <Image 
                                    src={logoSrc} 
                                    alt={appName} 
                                    fill
                                    className="object-contain"
                                    />
                                </div>
                            </Link>
                            <SheetTitle className="sr-only">Menú Principal</SheetTitle>
                        </SheetHeader>
                        <div className="flex-1">
                            <SidebarNav 
                                onLinkClick={() => setIsSheetOpen(false)} 
                                isCollapsed={false} 
                                pendingLiquidationsCount={totalLiquidationsBadge} 
                                pendingBookingsCount={pendingBookingsCount} 
                                upcomingAlertsCount={upcomingAlertsCount}
                                isPersonalFlavor={isPersonalFlavor} 
                                version={APP_CONFIG.version} 
                                activeRole={activeRole}
                            />
                        </div>
                    </SheetContent>
                </Sheet>
                <div className='ml-auto'>
                    <UserMenu />
                </div>
                </header>
                <OfflineWarning isOnline={isOnline} />
                <main className={cn(
                    "flex flex-1 flex-col gap-4 p-2 md:p-4 lg:gap-6 lg:p-6 pb-20 md:pb-6",
                    (activeRole === 'admin' || activeRole === 'socio' || activeRole === 'staff') ? "pb-32 md:pb-6" : "pb-6"
                )}>
                {children}
                </main>
                <QuickActionFAB />
                <Toaster />
                <BottomNav 
                    activeRole={activeRole} 
                    upcomingAlertsCount={upcomingAlertsCount}
                    pendingBookingsCount={pendingBookingsCount}
                />
                <ProductTour />
            </div>
            </div>
        </div>
    </TooltipProvider>
  );
}
