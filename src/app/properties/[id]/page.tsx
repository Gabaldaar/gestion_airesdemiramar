

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
import { getPropertyById, getTenants, getBookingsByPropertyId, getPropertyExpensesByPropertyId } from "@/lib/data";
import { BookingAddForm } from '@/components/booking-add-form';
import BookingsList from '@/components/bookings-list';
import { ExpenseAddForm } from '@/components/expense-add-form';
import ExpensesList from '@/components/expenses-list';

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const propertyId = parseInt(params.id, 10);
  const [property, tenants, bookings, expenses] = await Promise.all([
    getPropertyById(propertyId),
    getTenants(),
    getBookingsByPropertyId(propertyId),
    getPropertyExpensesByPropertyId(propertyId),
  ]);

  if (!property) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">{property.name}</h2>
          <p className="text-muted-foreground">{property.address}</p>
        </div>
        <div className="flex items-center space-x-2">
          <BookingAddForm propertyId={property.id} tenants={tenants} />
          <ExpenseAddForm propertyId={property.id} />
        </div>
      </div>
      <div className="relative aspect-[16/9] w-full">
        <Image
          src={property.imageUrl}
          alt={`Foto de ${property.name}`}
          fill
          className="rounded-lg object-cover"
          data-ai-hint="apartment building interior"
        />
      </div>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">Calendario</TabsTrigger>
          <TabsTrigger value="bookings">Reservas</TabsTrigger>
          <TabsTrigger value="expenses">Gastos</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar" className="space-y-4">
           <Card>
            <CardHeader>
              <CardTitle>Calendario de Disponibilidad</CardTitle>
              <CardDescription>
                Visualiza la disponibilidad e intégralo con Google Calendar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Próximamente: Integración con el calendario de Google.</p>
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
              <BookingsList bookings={bookings} />
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
  );
}
