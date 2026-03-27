

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
import { getPropertyById, getTenants, getBookings, getPropertyExpensesByPropertyId, getProperties, getExpenseCategories, Property, Tenant, BookingWithDetails, PropertyExpense, ExpenseCategory, Origin, getOrigins, getTasksByPropertyId, TaskWithDetails, TaskCategory, getTaskCategories, getProviders, Provider, getTaskScopes, TaskScope, DateBlock, getDateBlocks, getDateBlocksByPropertyId } from "@/lib/data";
import { BookingAddForm } from '@/components/booking-add-form';
import BookingsList from '@/components/bookings-list';
import ExpensesList from '@/components/expenses-list';
import TasksList from '@/components/tasks-list';
import { ExpenseAddForm, ExpensePreloadData } from '@/components/expense-add-form';
import { PropertyNotesForm } from '@/components/property-notes-form';
import { useEffect, useState, useMemo, FC, useCallback } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Copy, Calendar as CalendarIcon, ExternalLink, PlusCircle, CalendarX } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar } from '@/components/ui/calendar';
import { es } from 'date-fns/locale';
import { DayPicker, DayProps } from 'react-day-picker';
import { addDays, isWithinInterval, isSameDay } from 'date-fns';
import useWindowSize from '@/hooks/use-window-size';
import { parseDateSafely } from '@/lib/utils';
import { TaskAddForm } from '@/components/task-add-form';
import { DateBlockAddForm } from '@/components/date-block-add-form';
import DateBlocksList from '@/components/date-blocks-list';


interface PropertyDetailData {
    property: Property;
    properties: Property[];
    tenants: Tenant[];
    bookings: BookingWithDetails[];
    blocks: DateBlock[];
    expenses: PropertyExpense[];
    expenseCategories: ExpenseCategory[];
    tasks: TaskWithDetails[];
    taskCategories: TaskCategory[];
    taskScopes: TaskScope[];
    providers: Provider[];
    origins: Origin[];
}

const DayContentWithTooltip: FC<DayProps & { data: PropertyDetailData | null }> = (dayProps) => {
    const { date, activeModifiers, data, ...rest } = dayProps;
    
    // Convert the 'date' prop to a string in 'yyyy-MM-dd' format for timezone-neutral comparison
    const currentDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const bookingForDay = useMemo(() => {
        if (!data || !activeModifiers.booked) return undefined;
        return data.bookings.find(b => {
             if (!b.status || b.status === 'active') {
                const bookingStartStr = b.startDate.substring(0, 10);
                const bookingEndStr = b.endDate.substring(0, 10);
                return currentDateStr >= bookingStartStr && currentDateStr <= bookingEndStr;
            }
            return false;
        });
    }, [currentDateStr, data, activeModifiers.booked]);

    const blockForDay = useMemo(() => {
        if (!data || !activeModifiers.blocked) return undefined;
        return data.blocks.find(b => {
            const blockStartStr = b.startDate.substring(0, 10);
            const blockEndStr = b.endDate.substring(0, 10);
            return currentDateStr >= blockStartStr && currentDateStr <= blockEndStr;
        });
    }, [currentDateStr, data, activeModifiers.blocked]);

    const tenant = useMemo(() => {
        if (!bookingForDay || !data?.tenants) return undefined;
        return data.tenants.find(t => t.id === bookingForDay.tenantId);
    }, [bookingForDay, data?.tenants]);
    
    let tooltipContent: React.ReactNode = null;
    if (tenant) {
        tooltipContent = <p>{tenant.name}</p>;
    } else if (blockForDay) {
        tooltipContent = <p className='font-semibold'>Bloqueado: <span className='font-normal'>{blockForDay.reason || 'Sin motivo'}</span></p>;
    }


    if (tooltipContent) {
        return (
            <TooltipProvider delayDuration={100}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span>{date.getDate()}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                        {tooltipContent}
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
  const [key, setKey] = useState(0); // State to force re-render

  const [isTaskAddOpen, setIsTaskAddOpen] = useState(false);
  const [isExpenseAddOpen, setIsExpenseAddOpen] = useState(false);
  const [expensePreloadData, setExpensePreloadData] = useState<ExpensePreloadData | undefined>(undefined);
  const [isBlockFormOpen, setIsBlockFormOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (user && propertyId) {
        setLoading(true);
        try {
            const [property, properties, tenants, bookings, blocks, expenses, expenseCategories, tasks, taskCategories, providers, origins, taskScopes] = await Promise.all([
                getPropertyById(propertyId),
                getProperties(),
                getTenants(),
                getBookings(), // Fetch all bookings
                getDateBlocks(), // Fetch all blocks
                getPropertyExpensesByPropertyId(propertyId),
                getExpenseCategories(),
                getTasksByPropertyId(propertyId),
                getTaskCategories(),
                getProviders(),
                getOrigins(),
                getTaskScopes(),
            ]);

            if (!property) {
                setData(null);
            } else {
                setData({ property, properties, tenants, bookings, blocks, expenses, expenseCategories, tasks, taskCategories, providers, origins, taskScopes });
            }
        } catch (error) {
            console.error("Error fetching property details:", error);
            setData(null);
        } finally {
            setLoading(false);
        }
    }
  }, [user, propertyId]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData, key]); // Re-fetch when fetchData or key changes

  const handleDataChanged = () => {
    setKey(prevKey => prevKey + 1);
  };

  const handleOpenExpenseFormWithData = useCallback((data: ExpensePreloadData) => {
    setExpensePreloadData(data);
    setIsExpenseAddOpen(true);
  }, []);


  useEffect(() => {
    // This runs on the client, so `window` is available
    setBaseUrl(window.location.origin);
  }, []);
  
    const bookingsForThisProperty = useMemo(() => {
        if (!data) return [];
        return data.bookings.filter(b => b.propertyId === propertyId);
    }, [data, propertyId]);
    
    const blocksForThisProperty = useMemo(() => {
        if (!data) return [];
        return data.blocks
            .filter(b => b.propertyId === propertyId)
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }, [data, propertyId]);
  
    const dayModifiers = useMemo(() => {
        if (!data) return {};
        
        const activeBookings = bookingsForThisProperty.filter(b => !b.status || b.status === 'active');

        const bookedDays = activeBookings.map(booking => {
            const from = parseDateSafely(booking.startDate);
            const to = parseDateSafely(booking.endDate);
            if (!from || !to) return null;
            return { from, to };
        }).filter(d => d !== null) as { from: Date, to: Date }[];
        
        const blockedDays = blocksForThisProperty.map(block => {
            const from = parseDateSafely(block.startDate);
            const to = parseDateSafely(block.endDate);
            if (!from || !to) return null;
            return { from, to };
        }).filter(d => d !== null) as { from: Date, to: Date }[];

        const checkinDays = activeBookings.map(b => parseDateSafely(b.startDate)).filter(d => d !== null) as Date[];
        const checkoutDays = activeBookings.map(b => parseDateSafely(b.endDate)).filter(d => d !== null) as Date[];
        
        const bookedMiddleDays = activeBookings.flatMap(booking => {
            const startDate = parseDateSafely(booking.startDate);
            const endDate = parseDateSafely(booking.endDate);
            if (!startDate || !endDate || isSameDay(addDays(startDate, 1), endDate) || isSameDay(startDate, endDate)) {
                 return []; // Don't mark middle days for short stays
            }
            return { from: addDays(startDate, 1), to: addDays(endDate, -1) };
        });

        return {
            booked: bookedDays,
            blocked: blockedDays,
            checkin: checkinDays,
            checkout: checkoutDays,
            'booked-middle': bookedMiddleDays,
        };
    }, [data, bookingsForThisProperty, blocksForThisProperty]);

    const dayModifiersClassNames = {
        checkin: 'day-checkin',
        checkout: 'day-checkout',
        blocked: 'bg-zinc-400/80 text-white rounded-md',
        'booked-middle': 'day-booked-middle',
        disabled: 'day-disabled',
    };


  if (loading) {
    return <p>Cargando detalles de la propiedad...</p>;
  }

  if (!data) {
    return <p>Propiedad no encontrada o error al cargar los datos.</p>;
  }
  
  const { property, properties, tenants, bookings, blocks, expenses, expenseCategories, tasks, taskCategories, taskScopes, providers, origins } = data;
  
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
                <TabsList className="grid w-full sm:w-auto grid-cols-5">
                    <TabsTrigger value="bookings">Reservas</TabsTrigger>
                    <TabsTrigger value="blocks">Bloqueos</TabsTrigger>
                    <TabsTrigger value="tasks">Tareas</TabsTrigger>
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
                    <BookingAddForm 
                        propertyId={property.id} 
                        tenants={tenants} 
                        allBookings={bookings} 
                        allBlocks={blocks}
                        properties={properties} 
                        onDataChanged={handleDataChanged}
                    />
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
                <BookingsList bookings={bookingsForThisProperty} properties={properties} tenants={tenants} origins={origins} providers={providers} onDataChanged={handleDataChanged} />
                </CardContent>
            </Card>
            </TabsContent>
            <TabsContent value="blocks" className="space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Fechas Bloqueadas</CardTitle>
                        <CardDescription>
                            Gestiona períodos no disponibles por mantenimiento, uso personal, etc.
                        </CardDescription>
                    </div>
                    <DateBlockAddForm
                        propertyId={property.id}
                        allBookings={bookings}
                        allBlocks={blocks}
                        isOpen={isBlockFormOpen}
                        onOpenChange={setIsBlockFormOpen}
                        onDataChanged={handleDataChanged}>
                        <Button variant="outline">
                            <CalendarX className="mr-2 h-4 w-4" />
                            Bloquear Fechas
                        </Button>
                    </DateBlockAddForm>
                </CardHeader>
                <CardContent>
                    <DateBlocksList 
                        blocks={blocksForThisProperty} 
                        allBookings={bookings}
                        allBlocks={blocks}
                        onDataChanged={handleDataChanged} 
                    />
                </CardContent>
            </Card>
            </TabsContent>
            <TabsContent value="tasks" className="space-y-4">
            <Card>
                 <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Tareas de la Propiedad</CardTitle>
                        <CardDescription>
                            Gestiona el mantenimiento y las tareas pendientes para esta propiedad.
                        </CardDescription>
                    </div>
                     <TaskAddForm 
                        propertyId={property.id} 
                        properties={properties}
                        providers={providers} 
                        categories={taskCategories} 
                        scopes={taskScopes}
                        isOpen={isTaskAddOpen} 
                        onOpenChange={setIsTaskAddOpen} 
                        onTaskAdded={handleDataChanged}>
                        <Button variant="outline" onClick={() => setIsTaskAddOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Añadir Tarea
                        </Button>
                    </TaskAddForm>
                </CardHeader>
                <CardContent>
                    <TasksList tasks={tasks} properties={properties} providers={providers} categories={taskCategories} scopes={taskScopes} onDataChanged={handleDataChanged} onRegisterExpense={handleOpenExpenseFormWithData} propertyId={propertyId} />
                </CardContent>
            </Card>
            </TabsContent>
            <TabsContent value="expenses" className="space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Gastos de la Propiedad</CardTitle>
                        <CardDescription>
                            Registra y consulta los gastos asociados a la propiedad.
                        </CardDescription>
                    </div>
                     <ExpenseAddForm
                        propertyId={property.id}
                        categories={expenseCategories}
                        providers={providers}
                        onExpenseAdded={handleDataChanged}
                        isOpen={isExpenseAddOpen}
                        onOpenChange={setIsExpenseAddOpen}
                        preloadData={expensePreloadData}
                    >
                         <Button variant="outline" onClick={() => setIsExpenseAddOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Añadir Gasto
                        </Button>
                    </ExpenseAddForm>
                </CardHeader>
                <CardContent>
                    <ExpensesList expenses={expenses} categories={expenseCategories} providers={providers} property={property} onDataChanged={handleDataChanged} />
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
