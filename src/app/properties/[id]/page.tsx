
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
  
    const occupiedDays = useMemo(() => {
        if (!data) return [];
        return data.bookings.flatMap(booking => {
            const startDate = new Date(booking.startDate);
            const endDate = new Date(booking.endDate);
            // Mark check-in and check-out days separately
            return [{ from: startDate, to: endDate }];
        });
    }, [data]);

    const dayModifiers = useMemo(() => {
        if (!data) return {};
        
        const checkinDays = data.bookings.map(b => new Date(b.startDate));
        const checkoutDays = data.bookings.map(b => new Date(b.endDate));

        const bookedMiddleDays = data.bookings.flatMap(booking => {
            const startDate = new Date(booking.startDate);
            const endDate = new Date(booking.endDate);
            if (endDate.getTime() - startDate.getTime() <= 2 * 24 * 60 * 60 * 1000) {
                 return []; // Don't mark middle days for short stays
            }
            return { from: new Date(startDate.getTime() + 86400000), to: new Date(endDate.getTime() - 86400000) };
        });

        return {
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
                    />
                </CardContent>
            </Card>
            </TabsContent>
        </Tabs>
        </div>
    </div>
  );
}

