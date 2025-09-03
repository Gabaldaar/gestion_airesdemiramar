
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
import { Button } from '@/components/ui/button';
import { getPropertyById, getTenants } from "@/lib/data";
import { PlusCircle } from 'lucide-react';
import { BookingAddForm } from '@/components/booking-add-form';

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const propertyId = parseInt(params.id, 10);
  const [property, tenants] = await Promise.all([
    getPropertyById(propertyId),
    getTenants()
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
          <Button variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Gasto
          </Button>
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
              <p>Próximamente: Listado de reservas con detalles del inquilino y pagos.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="expenses" className="space-y-4">
           <Card>
            <CardHeader>
              <CardTitle>Gastos de la Propiedad</CardTitle>
              <CardDescription>
                Registra y consulta los gastos asociados a la propiedad o a un alquiler específico.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Próximamente: Tabla de gastos con fecha, descripción y monto.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
