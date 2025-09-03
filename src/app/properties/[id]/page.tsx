
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPropertyById } from "@/lib/data";

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const propertyId = parseInt(params.id, 10);
  const property = await getPropertyById(propertyId);

  if (!property) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-primary">{property.name}</h2>
      </div>
      <Card>
        <CardHeader>
           <div className="relative aspect-[16/9] w-full">
            <Image
              src={property.imageUrl}
              alt={`Foto de ${property.name}`}
              fill
              className="rounded-t-lg object-cover"
              data-ai-hint="apartment building interior"
            />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <CardTitle className="text-xl">Dirección</CardTitle>
          <p>{property.address}</p>
          {/* Aquí se agregarán más detalles en el futuro, como el calendario. */}
        </CardContent>
      </Card>
    </div>
  );
}
