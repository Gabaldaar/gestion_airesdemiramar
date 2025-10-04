
'use client';

import Image from 'next/image';
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
import { ExpenseAddForm } from '@/components/expense-add-form';
import ExpensesList from '@/components/expenses-list';
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
import { isWithinInterval, addDays } from 'date-fns';
import BookingsList from '@/components/bookings-list';


interface PropertyDetailData {
    property: Property;
    properties: Property[];
    tenants: Tenant[];
    bookings: BookingWithDetails[];
    expenses: PropertyExpense[];
    categories: ExpenseCategory[];
    origins: Origin[];
}

const DayContentWithTooltip: FC<DayProps> = (dayProps) => {
    const { date, ...rest } = dayProps;

    // Remove non-standard DOM props before passing to the span
    const spanProps: any = { ...rest };
    delete spanProps.activeModifiers;
    delete spanProps.displayMonth;

    return <span {...spanProps}>{date.getDate()}</span>;
};



export default function PropertyDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const propertyId = params.id as string;
  const [data, setData] = useState<PropertyDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState('');
  const { toast } = useToast();

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
        
        const bookedDays = data.bookings.map(booking => ({
            from: new Date(booking.startDate),
            to: new Date(booking.endDate),
        }));

        const checkinDays = data.bookings.map(b => new Date(b.startDate));
        const checkoutDays = data.bookings.map(b => new Date(b.endDate));
        
        const bookedMiddleDays = data.bookings.flatMap(booking => {
            const startDate = new Date(booking.startDate);
            const endDate = new Date(booking.endDate);
            if (endDate.getTime() - startDate.getTime() <= 2 * 24 * 60 * 60 * 1000) {
                 return []; // Don't mark middle days for short stays
            }
            return { from: addDays(startDate, 1), to: addDays(endDate, -1) };
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

    const CustomDay = (props: DayProps) => {
        const { date, activeModifiers } = props;
        if (!activeModifiers || !data || !data.bookings) {
            return <DayContentWithTooltip {...props} />;
        }
        
        const bookingForDay = data.bookings.find(b => 
            activeModifiers.booked && isWithinInterval(date, { start: new Date(b.startDate), end: new Date(b.endDate) })
        );

        if (bookingForDay) {
            const tenant = data.tenants.find(t => t.id === bookingForDay.tenantId);
            if (tenant) {
                return (
                    <TooltipProvider delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div><DayContentWithTooltip {...props} /></div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{tenant.name}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            }
        }

        return <DayContentWithTooltip {...props} />;
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

  return (
    <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between space-y-2">
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
            <div className="flex items-center gap-2">
                <PropertyNotesForm property={property} />
            </div>
        </div>

        <Card>
             <CardHeader>
                <CardTitle>Sincronización de Calendario (iCal)</CardTitle>
                <CardDescription>
                    Usa este enlace para suscribirte al calendario de esta propiedad desde Google Calendar, Apple Calendar o cualquier otro servicio compatible.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex w-full max-w-sm items-center space-x-2">
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
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button type="button" size="icon" onClick={handleCopyIcalUrl}>
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
                                <Button type="button" size="icon" asChild>
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
            </CardContent>
        </Card>

        <div className="lg:col-span-1">
        <Tabs defaultValue="bookings" className="space-y-4">
            <div className="flex justify-between items-center">
            <TabsList>
                <TabsTrigger value="bookings">Reservas</TabsTrigger>
                <TabsTrigger value="expenses">Gastos</TabsTrigger>
                <TabsTrigger value="calendar">Calendario</TabsTrigger>
            </TabsList>
            <div className="flex items-center space-x-2">
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
                <BookingsList bookings={bookings} properties={properties} tenants={tenants} origins={origins} />
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
                        numberOfMonths={2}
                        locale={es}
                        modifiers={dayModifiers}
                        modifiersClassNames={dayModifiersClassNames}
                        captionLayout="dropdown-buttons"
                        fromYear={new Date().getFullYear() - 2}
                        toYear={new Date().getFullYear() + 5}
                        components={{
                            Day: CustomDay
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
