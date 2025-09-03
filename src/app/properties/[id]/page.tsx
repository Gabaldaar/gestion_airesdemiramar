
import Image from 'next/image';
import { notFound } from 'next/navigation';
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
import { getPropertyById, getTenants, getBookingsByPropertyId, getPropertyExpensesByPropertyId, getProperties } from "@/lib/data";
import { BookingAddForm } from '@/components/booking-add-form';
import BookingsList from '@/components/bookings-list';
import { ExpenseAddForm } from '@/components/expense-add-form';
import ExpensesList from '@/components/expenses-list';
import { PropertyNotesForm } from '@/components/property-notes-form';

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const propertyId = params.id;
  const [property, properties, tenants, bookings, expenses] = await Promise.all([
    getPropertyById(propertyId),
    getProperties(),
    getTenants(),
    getBookingsByPropertyId(propertyId),
    getPropertyExpensesByPropertyId(propertyId),
  ]);

  if (!property) {
    notFound();
  }

  const calendarSrc = property.googleCalendarId 
    ? `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(property.googleCalendarId)}&ctz=America/Argentina/Buenos_Aires`
    : null;

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">{property.name}</h2>
          <p className="text-muted-foreground">{property.address}</p>
        </div>
        <PropertyNotesForm property={property} />
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="p-0">
              <div className="relative aspect-video w-full">
                <Image
                  src={property.imageUrl || '/images/properties/placeholder.png'}
                  alt={`Foto de ${property.name}`}
                  fill
                  className="rounded-t-lg object-cover"
                  data-ai-hint="apartment building interior"
                />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle>{property.name}</CardTitle>
              <CardDescription>{property.address}</CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
           <Tabs defaultValue="calendar" className="space-y-4">
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="calendar">Calendario</TabsTrigger>
                <TabsTrigger value="bookings">Reservas</TabsTrigger>
                <TabsTrigger value="expenses">Gastos</TabsTrigger>
              </TabsList>
              <div className="flex items-center space-x-2">
                <BookingAddForm propertyId={property.id} tenants={tenants} />
                <ExpenseAddForm propertyId={property.id} />
              </div>
            </div>
            <TabsContent value="calendar" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Calendario de Disponibilidad</CardTitle>
                  <CardDescription>
                    Disponibilidad de la propiedad.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {calendarSrc ? (
                    <div className="relative h-[600px] w-full">
                        <iframe
                            src={calendarSrc}
                            style={{ borderWidth: 0 }}
                            width="100%"
                            height="600"
                            frameBorder="0"
                            scrolling="no"
                        ></iframe>
                    </div>
                  ) : (
                    <p>No hay un calendario de Google configurado para esta propiedad.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="bookings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Reservas</CardTitle>
                  <CardDescription>
                    Gestiona las reservas pasadas, presentes y futuras de esta propiedad.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BookingsList bookings={bookings} properties={properties} tenants={tenants} />
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
                  <ExpensesList expenses={expenses} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
