
'use client';

import Image from 'next/image';
import { notFound, useParams } from 'next/navigation';
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
import ExpensesList from '@/components/expenses-list';
import { PropertyNotesForm } from '@/components/property-notes-form';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Copy, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar } from '@/components/ui/calendar';
import { es } from 'date-fns/locale';
import { DayPicker, DayProps } from 'react-day-picker';
import { isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';


interface PropertyDetailData {
    property: Property;
    properties: Property[];
    tenants: Tenant[];
    bookings: BookingWithDetails[];
    expenses: PropertyExpense[];
    categories: ExpenseCategory[];
    origins: Origin[];
}


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
                notFound();
                return;
            }
            setData({ property, properties, tenants, bookings, expenses, categories, origins });
            setLoading(false);
        };
        fetchData();
    }
  }, [user, propertyId]);
  
  const occupiedDaysModifiers = useMemo(() => {
    if (!data?.bookings) {
      return {};
    }
    
    const modifiers: Record<string, any> = {
        booked: [],
        checkin: [],
        checkout: [],
        booked_middle: [],
     };

    data.bookings.forEach(booking => {
        const startDate = new Date(booking.startDate);
        const endDate = new Date(booking.endDate);

        modifiers.booked.push({ from: startDate, to: endDate });
        modifiers.checkin.push(startDate);
        modifiers.checkout.push(endDate);
        
        if (endDate > startDate) {
           const middleRange = {
                from: new Date(startDate.getTime() + 86400000), // start + 1 day
                to: new Date(endDate.getTime() - 86400000) // end - 1 day
            };
            if (middleRange.from <= middleRange.to) {
                modifiers.booked_middle.push(middleRange);
            }
        }
    });
    return modifiers;
  }, [data?.bookings]);

  function CustomDay(props: DayProps) {
    const bookingForDay = useMemo(() => {
        if (!props.modifiers?.booked || !data?.bookings) {
            return undefined;
        }
        return data.bookings.find(b => 
            isWithinInterval(props.date, { start: new Date(b.startDate), end: new Date(b.endDate) })
        );
    }, [props.date, props.modifiers, data?.bookings]);

    const tenant = useMemo(() => {
        if (!bookingForDay || !data?.tenants) {
            return undefined;
        }
        return data.tenants.find(t => t.id === bookingForDay.tenantId);
    }, [bookingForDay, data?.tenants]);

    const buttonClassName = cn(
      buttonVariants({ variant: "ghost" }),
      "h-9 w-9 p-0 font-normal",
      props.modifiers?.today && "bg-accent text-accent-foreground",
      (props.modifiers?.selected || props.modifiers?.booked) && "aria-selected:opacity-100",
      props.modifiers?.booked && "bg-accent text-accent-foreground",
      props.modifiers?.checkin && "day-checkin",
      props.modifiers?.checkout && "day-checkout",
      props.modifiers?.booked_middle && "day-booked-middle",
      props.modifiers?.disabled && "text-muted-foreground opacity-50",
      props.modifiers?.outside && "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30"
    );

    if (tenant) {
      return (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={buttonClassName}
                disabled={props.modifiers?.disabled}
              >
                {props.date.getDate()}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tenant.name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <button
        type="button"
        className={buttonClassName}
        disabled={props.modifiers?.disabled}
      >
        {props.date.getDate()}
      </button>
    );
  }


  if (loading || !data) {
    return <p>Cargando detalles de la propiedad...</p>;
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
                   <DayPicker
                        modifiers={occupiedDaysModifiers}
                        modifiersClassNames={{
                            checkin: 'day-checkin',
                            checkout: 'day-checkout',
                            booked_middle: 'day-booked-middle',
                        }}
                        numberOfMonths={2}
                        locale={es}
                        disabled
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
