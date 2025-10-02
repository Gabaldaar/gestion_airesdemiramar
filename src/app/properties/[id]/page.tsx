
'use client';

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
import { getPropertyById, getTenants, getBookingsByPropertyId, getPropertyExpensesByPropertyId, getProperties, getExpenseCategories, Property, Tenant, BookingWithDetails, PropertyExpense, ExpenseCategory, Origin, getOrigins } from "@/lib/data";
import { BookingAddForm } from '@/components/booking-add-form';
import BookingsList from '@/components/bookings-list';
import { ExpenseAddForm } from '@/components/expense-add-form';
import ExpensesList from '@/components/expenses-list';
import { PropertyNotesForm } from '@/components/property-notes-form';
import { useEffect, useState, use } from 'react';
import { useAuth } from '@/components/auth-provider';

interface PropertyDetailData {
    property: Property;
    properties: Property[];
    tenants: Tenant[];
    bookings: BookingWithDetails[];
    expenses: PropertyExpense[];
    categories: ExpenseCategory[];
    origins: Origin[];
}

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const { id: propertyId } = use(params);
  const [data, setData] = useState<PropertyDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
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


  if (loading || !data) {
    return <p>Cargando detalles de la propiedad...</p>;
  }
  
  const { property, properties, tenants, bookings, expenses, categories, origins } = data;

  return (
    <div className="flex-1 space-y-4">
    <div className="flex items-center justify-between space-y-2">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-primary">{property.name}</h2>
            <p className="text-muted-foreground">{property.address}</p>
        </div>
        <PropertyNotesForm property={property} />
    </div>

    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
        <div className="lg:col-span-1">
        <Card>
            <CardHeader className="p-0">
            <div className="relative aspect-video w-full">
                <Image
                src={property.imageUrl || 'https://picsum.photos/600/400'}
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

        <div className="lg:col-span-1">
        <Tabs defaultValue="bookings" className="space-y-4">
            <div className="flex justify-between items-center">
            <TabsList>
                <TabsTrigger value="bookings">Reservas</TabsTrigger>
                <TabsTrigger value="expenses">Gastos</TabsTrigger>
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
        </Tabs>
        </div>
    </div>
    </div>
  );
}
