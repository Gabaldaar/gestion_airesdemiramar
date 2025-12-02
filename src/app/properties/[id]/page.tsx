

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { getPropertyById, getTenants, getBookingsByPropertyId, getPropertyExpensesByPropertyId, getProperties, getExpenseCategories, Property, Tenant, BookingWithDetails, PropertyExpense, ExpenseCategory, Origin, getOrigins } from "@/lib/data";
import { BookingAddForm } from '@/components/booking-add-form';
import BookingsList from '@/components/bookings-list';
import { ExpenseAddForm } from '@/components/expense-add-form';
import { PropertyNotesForm } from '@/components/property-notes-form';
import { useEffect, useState, useMemo, FC } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Copy, Calendar as CalendarIcon, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar } from '@/components/ui/calendar';
import { es } from 'date-fns/locale';
import { DayPicker, DayProps } from 'react-day-picker';
import { isWithinInterval } from 'date-fns';
import useWindowSize from '@/hooks/use-window-size';


interface PropertyDetailData {
    property: Property;
    properties: Property[];
    tenants: Tenant[];
    bookings: BookingWithDetails[];
    expenses: PropertyExpense[];
    categories: ExpenseCategory[];
    origins: Origin[];
}

const DayContentWithTooltip: FC<DayProps & { data: PropertyDetailData | null }> = (dayProps) => {
    const { date, activeModifiers, data, ...rest } = dayProps;

    const bookingForDay = useMemo(() => {
        if (!data || !activeModifiers.booked) return undefined;
        return data.bookings.find(b => 
            (!b.status || b.status === 'active') && isWithinInterval(date, { start: new Date(b.startDate), end: new Date(b.endDate) })
        );
    }, [date, data, activeModifiers.booked]);

    const tenant = useMemo(() => {
        if (!bookingForDay || !data?.tenants) return undefined;
        return data.tenants.find(t => t.id === bookingForDay.tenantId);
    }, [bookingForDay, data?.tenants]);

    if (tenant) {
        return (
            <TooltipProvider delayDuration={100}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span>{date.getDate()}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{tenant.name}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }
    
    return <span>{date.getDate()}</span>;
};


export default function PropertyDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const propertyId = params.id as string;
  const [data, setData] = useState<PropertyDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState('');
  const { toast } = useToast();
  const { width } = useWindowSize();
  const isMobile = width < 768;


  useEffect(() => {
    // This runs on the client, so `window` is available
    setBaseUrl(window.location.origin);
  }, []);


  useEffect(() => {
    if (user && propertyId) {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [property, properties, tenants, bookings, expenses, categories, origins] = await Promise.all([
                    getPropertyById(propertyId),
                    getProperties(),
                    getTenants(),
                    getBookingsByPropertyId(propertyId),
                    getPropertyExpensesByPropertyId(propertyId),
                    getExpenseCategories(),
                    getOrigins(),
                ]);

                if (!property) {
                    // Not found logic will be handled by the return below
                    setData(null);
                } else {
                    setData({ property, properties, tenants, bookings, expenses, categories, origins });
                }
            } catch (error) {
                console.error("Error fetching property details:", error);
                setData(null);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }
  }, [user, propertyId]);
  
    const dayModifiers = useMemo(() => {
        if (!data) return {};
        
        const activeBookings = data.bookings.filter(b => !b.status || b.status === 'active');

        const bookedDays = activeBookings.map(booking => ({
            from: new Date(booking.startDate),
            to: new Date(booking.endDate),
        }));

        const checkinDays = activeBookings.map(b => new Date(b.startDate));
        const checkoutDays = activeBookings.map(b => new Date(b.endDate));
        
        const bookedMiddleDays = activeBookings.flatMap(booking => {
            const startDate = new Date(booking.startDate);
            const endDate = new Date(booking.endDate);
            if (endDate.getTime() - startDate.getTime() <= 2 * 24 * 60 * 60 * 1000) {
                 return []; // Don't mark middle days for short stays
            }
            return { from: new Date(startDate.getTime() + 86400000), to: new Date(endDate.getTime() - 86400000) };
        });

        return {
            booked: bookedDays,
            checkin: checkinDays,
            checkout: checkoutDays,
            'booked-middle': bookedMiddleDays,
        };
    }, [data]);

    const dayModifiersClassNames = {
        checkin: 'day-checkin',
        checkout: 'day-checkout',
        'booked-middle': 'day-booked-middle',
        disabled: 'day-disabled',
    };


  if (loading) {
    return <p>Cargando detalles de la propiedad...</p>;
  }

  if (!data) {
    return <p>Propiedad no encontrada o error al cargar los datos.</p>;
  }
  
  const { property, properties, tenants, bookings, expenses, categories, origins } = data;
  
  const icalUrl = `${baseUrl}/api/ical/${property.id}`;
  
  const handleCopyIcalUrl = () => {
    navigator.clipboard.writeText(icalUrl);
    toast({
        title: "Copiado",
        description: "El enlace iCal ha sido copiado al portapapeles.",
    });
  }
  
  const CustomDayContent: React.FC<DayProps> = (props) => (
    <DayContentWithTooltip {...props} data={data} />
  );
  
    const sortedBookings = useMemo(() => {
        return [...bookings].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }, [bookings]);

  return (
    <div className="flex-1 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center gap-4">
                <Image
                    src={property.imageUrl || 'https://picsum.photos/150/100'}
                    alt={`Foto de ${property.name}`}
                    width={150}
                    height={100}
                    className="rounded-lg object-cover"
                    data-ai-hint="apartment building exterior"
                />
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-primary">{property.name}</h2>
                    <p className="text-muted-foreground">{property.address}</p>
                </div>
            </div>
            <PropertyNotesForm property={property} />
        </div>

        <Card>
             <CardHeader>
                <CardTitle>Sincronización de Calendario (iCal)</CardTitle>
                <CardDescription>
                    Usa este enlace para suscribirte al calendario de esta propiedad desde Google Calendar, Apple Calendar o cualquier otro servicio compatible.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex flex-col sm:flex-row w-full max-w-md items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                    <div className="grid flex-1 gap-2">
                        <Label htmlFor="link" className="sr-only">
                        Enlace
                        </Label>
                        <Input
                        id="link"
                        defaultValue={icalUrl}
                        readOnly
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button type="button" size="icon" onClick={handleCopyIcalUrl} className='w-full sm:w-10'>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Copiar enlace de suscripción</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button type="button" size="icon" asChild className='w-full sm:w-10'>
                                        <a href={icalUrl} target="_blank" rel="noopener noreferrer">
                                            <CalendarIcon className="h-4 w-4" />
                                        </a>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Descargar archivo .ics</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </CardContent>
        </Card>

        <div className="lg:col-span-1">
        <Tabs defaultValue="bookings" className="space-y-4">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <TabsList className="grid w-full sm:w-auto grid-cols-3">
                    <TabsTrigger value="bookings">Reservas</TabsTrigger>
                    <TabsTrigger value="expenses">Gastos</TabsTrigger>
                    <TabsTrigger value="calendar">Calendario</TabsTrigger>
                </TabsList>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center w-full md:w-auto gap-2">
                    {property.propertyUrl && (
                      <Button asChild variant="secondary" className="w-full">
                        <Link href={property.propertyUrl} target="_blank">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Web de la Propiedad
                        </Link>
                      </Button>
                    )}
                    <BookingAddForm propertyId={property.id} tenants={tenants} existingBookings={bookings} />
                    <ExpenseAddForm propertyId={property.id} categories={categories} />
                </div>
            </div>
            <TabsContent value="bookings" className="space-y-4">
            <Card>
                <CardHeader>
                <CardTitle>Historial de Reservas</CardTitle>
                <CardDescription>
                    Gestiona las reservas pasadas, presentes y futuras de esta propiedad.
                </CardDescription>
                </CardHeader>
                <CardContent>
                <BookingsList bookings={sortedBookings} properties={properties} tenants={tenants} origins={origins} />
                </CardContent>
            </Card>
            </TabsContent>
            <TabsContent value="expenses" className="space-y-4">
            <Card>
                <CardHeader>
                <CardTitle>Gastos de la Propiedad</CardTitle>
                <CardDescription>
                    Registra y consulta los gastos asociados a la propiedad.
                </CardDescription>
                </CardHeader>
                <CardContent>
                <ExpensesList expenses={expenses} categories={categories} />
                </CardContent>
            </Card>
            </TabsContent>
            <TabsContent value="calendar" className="space-y-4">
            <Card>
                <CardHeader>
                <CardTitle>Calendario de Ocupación</CardTitle>
                <CardDescription>
                    Vista de las fechas reservadas para esta propiedad.
                </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Calendar
                        mode="multiple"
                        selected={[]}
                        onSelect={() => {}}
                        numberOfMonths={isMobile ? 1 : 2}
                        locale={es}
                        modifiers={dayModifiers}
                        modifiersClassNames={dayModifiersClassNames}
                        captionLayout="dropdown-buttons"
                        fromYear={new Date().getFullYear() - 2}
                        toYear={new Date().getFullYear() + 5}
                        components={{
                            DayContent: CustomDayContent
                        }}
                    />
                </CardContent>
            </Card>
            </TabsContent>
        </Tabs>
        </div>
    </div>
  );
}
