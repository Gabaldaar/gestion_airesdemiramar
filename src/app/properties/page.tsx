
'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProperties, Property } from "@/lib/data";
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';

export default function PropertiesPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
        setLoading(true);
        getProperties().then(data => {
            setProperties(data);
            setLoading(false);
        });
    }
  }, [user]);

  if (loading) {
    return <p>Cargando propiedades...</p>
  }

  return (
    <div className="flex-1 space-y-4">
    <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Propiedades</h2>
    </div>
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {properties.map((property: Property) => (
        <Link href={`/properties/${property.id}`} key={property.id} className="group">
            <Card className="h-full overflow-hidden transition-all group-hover:shadow-lg">
            <CardHeader className="p-0">
                <div className="relative aspect-video w-full">
                <Image
                    src={property.imageUrl || 'https://picsum.photos/600/400'}
                    alt={`Foto de ${property.name}`}
                    fill
                    className="rounded-t-lg object-cover transition-transform group-hover:scale-105"
                    data-ai-hint="apartment building exterior"
                />
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <CardTitle className="text-xl">{property.name}</CardTitle>
                <CardDescription>{property.address}</CardDescription>
            </CardContent>
            <CardFooter>
                {/*  Aquí podrían ir acciones, como "Ver detalles"  */}
            </CardFooter>
            </Card>
        </Link>
        ))}
    </div>
    </div>
  );
}
